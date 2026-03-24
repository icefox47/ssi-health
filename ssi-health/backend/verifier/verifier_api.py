from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import base58

from common.vc_schema import VerifiableCredential
from common.crypto import verify_signature

router = APIRouter()

class VerifyRequest(BaseModel):
    vc: VerifiableCredential

@router.post("/verify")
def verify_credential(request: VerifyRequest):
    """Verifies a signed Verifiable Credential."""
    try:
        vc = request.vc
        
        if not vc.proof:
            raise HTTPException(status_code=400, detail="Credential is missing a proof.")
            
        # 1. Extract the public key bytes from the issuer's DID
        # Issuer did looks like did:key:zMultibaseEncodedKey
        # we know it's base58btc, and starts with an ed25519 prefix \xed\x01
        issuer_did = vc.issuer
        if not issuer_did.startswith("did:key:z"):
            raise HTTPException(status_code=400, detail="Only did:key is supported in Phase 1.")
            
        encoded_key = issuer_did.split("did:key:z")[-1]
        try:
            prefixed_key_bytes = base58.b58decode(encoded_key)
            if not prefixed_key_bytes.startswith(b'\xed\x01'):
                raise HTTPException(status_code=400, detail="Unsupported multicodec prefix.")
            public_key_bytes = prefixed_key_bytes[2:] # Strip prefix
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid issuer DID format.")

        # 2. Extract signature and the data that was signed
        proof = vc.proof
        signature_b64 = proof.jws
        
        vc_dict = vc.model_dump(exclude={"proof"}, exclude_none=True, by_alias=True)
        
        # 3. Cryptographic Verification
        is_valid = verify_signature(vc_dict, signature_b64, public_key_bytes)
        
        if not is_valid:
            return {"valid": False, "reason": "Invalid cryptographic signature."}
            
        return {
            "valid": True,
            "issuer": issuer_did,
            "subject": vc.credentialSubject.id,
            "type": vc.type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
