import json
import base64
from typing import Dict, Any
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.exceptions import InvalidSignature

def normalize_dict(data: Dict[str, Any]) -> bytes:
    """Normalizes JSON data into definitive bytes for signing to prevent malleability issues."""
    return json.dumps(data, separators=(',', ':'), sort_keys=True).encode('utf-8')

def sign_data(data: Dict[str, Any], private_key_bytes: bytes) -> str:
    """Signs arbitrary JSON data deterministically using Ed25519."""
    serialized = normalize_dict(data)
    private_key = ed25519.Ed25519PrivateKey.from_private_bytes(private_key_bytes)
    signature = private_key.sign(serialized)
    
    # Return URL-safe base64 encoded signature
    return base64.urlsafe_b64encode(signature).decode('utf-8').rstrip("=")

def verify_signature(data: Dict[str, Any], signature_b64: str, public_key_bytes: bytes) -> bool:
    """Verifies a signature over deterministic JSON data."""
    try:
        serialized = normalize_dict(data)
        
        # Add padding back if necessary
        padding = 4 - (len(signature_b64) % 4)
        if padding != 4:
            signature_b64 += "=" * padding
            
        signature = base64.urlsafe_b64decode(signature_b64)
        public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
        
        public_key.verify(signature, serialized)
        return True
    except InvalidSignature:
        return False
    except Exception:
        return False
