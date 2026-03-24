import base58
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

def generate_keypair():
    """Generates an Ed25519 keypair and returns raw bytes for private and public keys."""
    private_key = ed25519.Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    # Export private key to raw bytes
    priv_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Export public key to raw bytes
    pub_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    )
    
    return priv_bytes, pub_bytes

def derive_did_key(public_key_bytes: bytes) -> str:
    """Derives a did:key identifier from Ed25519 public key bytes following the W3C spec."""
    # The multicodec prefix for ed25519-pub is 0xed01
    prefixed_key_bytes = b'\xed\x01' + public_key_bytes
    # Base58btc encoding
    encoded_key = base58.b58encode(prefixed_key_bytes).decode('utf-8')
    # Prepend 'z' to indicate base58btc identifier
    return f"did:key:z{encoded_key}"

def create_did_document(did: str) -> dict:
    """Creates a basic standard DID Document for a given did:key identifier."""
    key_id = f"{did}#{did.split(':')[-1]}"
    multibase_key = did.split(':')[-1]
    
    return {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/ed25519-2020/v1"
        ],
        "id": did,
        "verificationMethod": [{
            "id": key_id,
            "type": "Ed25519VerificationKey2020",
            "controller": did,
            "publicKeyMultibase": multibase_key
        }],
        "authentication": [key_id],
        "assertionMethod": [key_id]
    }
