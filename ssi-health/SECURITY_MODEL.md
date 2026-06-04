# Security Model - SSI Health

This document outlines the security architecture, cryptographic guarantees, data privacy features, and potential vulnerabilities of the **SSI Health** project.

---

## 1. Cryptographic Architecture

SSI Health relies on asymmetric and symmetric cryptography to enforce authentication, authorization, data integrity, and non-repudiation:

```
                      CRYPTOGRAPHIC PRIMITIVES
                      
   ┌───────────────────────┬───────────────────────┬────────────────────────┐
   │       Ed25519         │      AES-256-CBC      │      PBKDF2 / SHA256   │
   ├───────────────────────┼───────────────────────┼────────────────────────┤
   │ - did:key Identities  │ - Wallet Storage      │ - Vault Password KDF   │
   │ - VC Signatures       │   Encryption          │ - JWT Hashing          │
   │ - VC Verifications    │                       │ - Admin Passwords      │
   └───────────────────────┴───────────────────────┴────────────────────────┘
```

### A. Decentralized Identities (did:key)
*   User wallets and the clinic issuer generate **Ed25519 Elliptic Curve keypairs**.
*   A user's identity is defined by their public key, wrapped in a multicodec format (`did:key:z6Mk...`).
*   Ed25519 provides security (128-bit security level) with short signature lengths (64 bytes) and fast signature generation/verification speeds, which supports the requirement for sub-5 second verification times.

### B. Verifiable Credentials & Signature Malleability Prevention
To sign a Verifiable Credential:
1.  The JSON representation of the VC is normalized into a definitive byte stream using deterministic serialization (alphabetically sorted keys, no whitespace indentation: `json.dumps(data, separators=(',', ':'), sort_keys=True)`).
2.  This prevents **signature malleability**, where minor formatting variations (spaces, key ordering changes) could invalidate a valid signature.
3.  The signature is generated using the issuer's private key over the normalized byte stream and encoded as a URL-safe Base64 string within the `proof.jws` parameter.

### C. Wallet Vault Encryption (Client-side Data-at-Rest)
*   The private keys and credentials of the user are stored in the browser's `localStorage` to ensure offline capability.
*   To prevent unauthorized local access (e.g., physical theft, cross-site scripting stealing plain keys), the data is stored as a ciphertext block.
*   The wallet uses **AES-256 symmetric encryption** via `crypto-js` to encrypt the state. The encryption key is derived from a user password.
*   *Current implementation details*: In the current prototype, the password is hardcoded as `ssi-demo-password` for convenience, but the architecture allows prompting the user for a password during startup.

---

## 2. Privacy Engineering

### A. Selective Disclosure (Zero-Knowledge Proofs)
*   **The Problem**: Standard VC verification requires sharing the full VC JSON file, which exposes private data (e.g., sharing a full date of birth when proving a patient is over 18).
*   **The ZKP Concept**: Under a Zero-Knowledge paradigm, the user's wallet generates a cryptographic proof demonstrating a mathematical predicate (e.g., $Age \ge 18$) using a circuit compiler (like Circom) without revealing the underlying input.
*   *Current implementation details*: The verification of this proof is mocked in `verifier_api.py`. The verifier portal evaluates the mock validation based on client signals.

### B. Differential Privacy (Decentralized Analytics)
*   **The Problem**: Sharing raw medical diagnostic codes for federated statistics exposes individual identities through membership inference attacks.
*   **The DP Mechanism**: The simulation script (`fl_simulation.py`) implements a **Local Differential Privacy (LDP) Gaussian Mechanism**:
    *   Let $W$ be the client weight vector, and $B$ be the bias vector optimized on local records.
    *   Prior to transmitting the parameters, the client adds random noise drawn from a normal distribution scaled to a noise multiplier:
        $$W_{noisy} = W + \mathcal{N}(0, \sigma^2)$$
        $$B_{noisy} = B + \mathcal{N}(0, \sigma^2)$$
    *   This provides a mathematical guarantee of privacy ($\epsilon$-differential privacy), which limits how much information an observer can learn about any single participant from the aggregated global model.

---

## 3. Security Vulnerability Assessment (Prototype Risks)

As a prototype, several design trade-offs have been made. These must be addressed before any production deployment:

### A. Hardcoded Administrative Credentials
*   **Location**: `backend/issuer/issuer_api.py` (Lines 24-25)
*   **Risk**: The system stores plain administrative username (`admin`) and the hash of the default password (`password123`).
*   **Fix**: Move credentials out of code to an environment file (`.env`) and hash dynamically with random salts.

### B. Hardcoded JWT Secret Key
*   **Location**: `backend/issuer/auth.py` (Line 9)
*   **Risk**: The JWT token signature secret key is hardcoded:
    `SECRET_KEY = "super-secret-key-for-ssi-health-prototype"`
    An attacker can forge administrative JWT tokens and issue/revoke arbitrary credentials.
*   **Fix**: Load the secret key using `os.getenv("JWT_SECRET_KEY")` and generate a cryptographically secure random string on deployment.

### C. Overly Permissive CORS Policy
*   **Location**: `backend/main.py` (Line 15)
*   **Risk**: CORS is set to allow all origins: `allow_origins=["*"]`.
*   **Fix**: Restrict allowed origins to the specific hosts running the frontends (e.g., `http://localhost:5173`).

### D. Mocked ZKP Verification
*   **Location**: `backend/verifier/verifier_api.py` (Line 95)
*   **Risk**: The `/verify-zkp` endpoint returns `valid: true` if the first element of `publicSignals` is `"1"`. It does not perform actual cryptographic checks.
*   **Fix**: Integrate a library like `py-snarkjs` to verify real zk-SNARK proofs against a compiled verification key.

### E. Plaintext SQLite Database
*   **Location**: `backend/issuer_data.db`
*   **Risk**: If an attacker gains access to the backend filesystem, they can read the SQLite file directly, exposing the credentials database.
*   **Fix**: Implement database encryption (e.g., SQLCipher) or database access restrictions.
