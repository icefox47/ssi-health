from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import uuid
import base64
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from common.did_utils import generate_keypair, derive_did_key, create_did_document
from common.vc_schema import VerifiableCredential, CredentialSubject, Proof
from common.crypto import sign_data
from common.db import get_db, IssuedCredential, AuditLog, init_db
from issuer.auth import create_access_token, get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES, get_password_hash, verify_password

# Initialize DB automatically during import (safe with check_same_thread)
init_db()

router = APIRouter()

ISSUER_PRIV_BYTES, ISSUER_PUB_BYTES = generate_keypair()
ISSUER_DID = derive_did_key(ISSUER_PUB_BYTES)

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = get_password_hash("password123")

class IssueRequest(BaseModel):
    subject_did: str
    credential_type: str = "VaccinationCredential"
    claims: Dict[str, Any]
    expiration_date: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    if form_data.username != ADMIN_USERNAME or not verify_password(form_data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/did")
def get_issuer_did():
    """Returns the issuer's DID and DID Document."""
    doc = create_did_document(ISSUER_DID)
    return {"did": ISSUER_DID, "didDocument": doc}

@router.get("/generate-did")
def generate_user_did():
    """Utility endpoint: generates a fresh Ed25519 DID for the wallet frontend."""
    priv, pub = generate_keypair()
    did = derive_did_key(pub)
    doc = create_did_document(did)
    return {
        "did": did,
        "privateKeyBase64": base64.b64encode(priv).decode('utf-8'),
        "publicKeyBase64": base64.b64encode(pub).decode('utf-8'),
        "didDocument": doc
    }

@router.post("/issue", response_model=VerifiableCredential)
def issue_credential(
    request: IssueRequest, 
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Issues a Verifiable Credential to the given subject DID."""
    try:
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        vc_id = f"urn:uuid:{uuid.uuid4()}"
        
        subject = CredentialSubject(id=request.subject_did, **request.claims)
        
        vc = VerifiableCredential(
            id=vc_id,
            type=["VerifiableCredential", request.credential_type],
            issuer=ISSUER_DID,
            issuanceDate=now,
            expirationDate=request.expiration_date,
            credentialSubject=subject
        )
        
        vc_dict = vc.model_dump(exclude_none=True, by_alias=True)
        signature_b64 = sign_data(vc_dict, ISSUER_PRIV_BYTES)
        
        verification_method = f"{ISSUER_DID}#{ISSUER_DID.split(':')[-1]}"
        vc.proof = Proof(
            created=now,
            verificationMethod=verification_method,
            jws=signature_b64
        )
        
        # Save to DB
        db_cred = IssuedCredential(
            vc_id=vc_id,
            subject_did=request.subject_did,
            credential_type=request.credential_type,
            status="valid",
            vc_payload=vc.model_dump(exclude_none=True, by_alias=True)
        )
        db.add(db_cred)
        
        # Create Audit Log
        db_log = AuditLog(
            action="ISSUE",
            details={
                "vc_id": vc_id,
                "subject_did": request.subject_did,
                "type": request.credential_type
            }
        )
        db.add(db_log)
        db.commit()
        
        return vc
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/credentials")
def get_issued_credentials(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all issued credentials."""
    creds = db.query(IssuedCredential).order_by(IssuedCredential.issuance_date.desc()).all()
    return creds

@router.post("/revoke/{vc_id}")
def revoke_credential(
    vc_id: str,
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a credential by updating its status to 'revoked'."""
    cred = db.query(IssuedCredential).filter(IssuedCredential.vc_id == vc_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    if cred.status == "revoked":
        raise HTTPException(status_code=400, detail="Credential is already revoked")
        
    cred.status = "revoked"
    
    # Audit log
    db_log = AuditLog(
        action="REVOKE",
        details={
            "vc_id": vc_id,
            "subject_did": cred.subject_did
        }
    )
    db.add(db_log)
    db.commit()
    
    return {"status": "success", "message": f"Credential {vc_id} revoked."}

@router.get("/revocation-list")
def get_revocation_list():
    """Return a list of all revoked VC IDs. Public endpoint for verifiers."""
    # To use DB here, we need manual session
    from common.db import SessionLocal
    db = SessionLocal()
    try:
        revoked = db.query(IssuedCredential).filter(IssuedCredential.status == "revoked").all()
        revoked_ids = [r.vc_id for r in revoked]
        return {"revoked_ids": revoked_ids}
    finally:
        db.close()

@router.get("/audit-logs")
def get_audit_logs(
    current_user: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    return logs

@router.get("/wallet/credentials/{did}")
def get_wallet_credentials(did: str):
    """Fetch credentials issued to this specific DID. (Public for prototype)"""
    from common.db import SessionLocal
    db = SessionLocal()
    try:
        creds = db.query(IssuedCredential).filter(IssuedCredential.subject_did == did, IssuedCredential.status == "valid").all()
        return [cred.vc_payload for cred in creds if cred.vc_payload]
    finally:
        db.close()
