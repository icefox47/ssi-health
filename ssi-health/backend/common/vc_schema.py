from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any, Optional

class Proof(BaseModel):
    type: str = "Ed25519Signature2020"
    created: str
    verificationMethod: str
    proofPurpose: str = "assertionMethod"
    jws: str

class CredentialSubject(BaseModel):
    model_config = ConfigDict(extra='allow')
    id: str

class VerifiableCredential(BaseModel):
    context: List[str] = Field(alias="@context", default=["https://www.w3.org/2018/credentials/v1"])
    id: str
    type: List[str] = ["VerifiableCredential"]
    issuer: str
    issuanceDate: str
    expirationDate: Optional[str] = None
    credentialSubject: CredentialSubject
    proof: Optional[Proof] = None
