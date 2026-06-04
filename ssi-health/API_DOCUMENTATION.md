# API Documentation - SSI Health

This document contains specifications for the REST API of the **SSI Health** project.

*   **Base URL**: `http://localhost:8000/api`
*   **API Docs (Swagger UI)**: `http://localhost:8000/docs`

---

## 1. Issuer API (`/api/issuer`)

Endpoints utilized by the Issuer Portal for administrative logging, did resolving, issuing credentials, and revocation.

### A. Login Authentication
Authenticates the administrative user and returns a JSON Web Token (JWT) bearer credentials.

*   **URL**: `/login`
*   **Method**: `POST`
*   **Content-Type**: `application/x-www-form-urlencoded`
*   **Request Parameters**:
    *   `username` (string, required): Administrative login ID (Default: `admin`)
    *   `password` (string, required): Password (Default: `password123`)
*   **Response (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer"
    }
    ```

### B. Fetch Issuer DID
Returns the cryptographic Decentralized Identifier (DID) and associated DID Document for the current Issuer.

*   **URL**: `/did`
*   **Method**: `GET`
*   **Response (200 OK)**:
    ```json
    {
      "did": "did:key:z6MkuV...",
      "didDocument": {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://w3id.org/security/suites/ed25519-2020/v1"
        ],
        "id": "did:key:z6MkuV...",
        "verificationMethod": [{
          "id": "did:key:z6MkuV...#z6MkuV...",
          "type": "Ed25519VerificationKey2020",
          "controller": "did:key:z6MkuV...",
          "publicKeyMultibase": "z6MkuV..."
        }],
        "authentication": ["did:key:z6MkuV...#z6MkuV..."],
        "assertionMethod": ["did:key:z6MkuV...#z6MkuV..."]
      }
    }
    ```

### C. Utility: Generate Fresh User DID
Generates an ephemeral Ed25519 keypair and creates a matching DID Document. Useful for the client wallet setup.

*   **URL**: `/generate-did`
*   **Method**: `GET`
*   **Response (200 OK)**:
    ```json
    {
      "did": "did:key:z6MkfT...",
      "privateKeyBase64": "SGVsbG8gV29ybGQ...",
      "publicKeyBase64": "cHVibGljS2V5QmFzZT...",
      "didDocument": { ... }
    }
    ```

### D. Issue Credential
Cryptographically signs and registers a new Verifiable Credential for a patient.

*   **URL**: `/issue`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <token>`
*   **Request Payload**:
    ```json
    {
      "subject_did": "did:key:z6MkfT...",
      "credential_type": "VaccinationCredential",
      "claims": {
        "vaccineType": "Covishield",
        "doseNumber": "2",
        "batchNumber": "ABV5765",
        "vaccinationDate": "2024-03-15",
        "facility": "AIIMS Delhi"
      },
      "expiration_date": "2027-03-15T00:00:00Z"
    }
    ```
*   **Response (200 OK)**: Returns the complete W3C `VerifiableCredential` structure containing the cryptographic `proof` object.

### E. Revoke Credential
Revokes an active Verifiable Credential.

*   **URL**: `/revoke/{vc_id}`
*   **Method**: `POST`
*   **Headers**: `Authorization: Bearer <token>`
*   **Path Variables**:
    *   `vc_id` (string, required): The VC identifier URI (e.g. `urn:uuid:f81d4fae-...`)
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Credential urn:uuid:f81d4fae-... revoked."
    }
    ```

### F. Get Revocation List
Returns a public array of revoked VC IDs.

*   **URL**: `/revocation-list`
*   **Method**: `GET`
*   **Response (200 OK)**:
    ```json
    {
      "revoked_ids": [
        "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6"
      ]
    }
    ```

### G. Get Wallet Credentials
Fetches all valid (non-revoked) credentials issued to a specific patient DID. Used for simulation/sync purposes.

*   **URL**: `/wallet/credentials/{did}`
*   **Method**: `GET`
*   **Response (200 OK)**: Array of active `VerifiableCredential` objects matching the subject DID.

---

## 2. Verifier API (`/api/verifier`)

Endpoints used to verify credentials and ZK proofs.

### A. Verify Verifiable Credential
Evaluates signature integrity, checks expiration dates, and queries status updates against revocation indexes.

*   **URL**: `/verify`
*   **Method**: `POST`
*   **Request Payload**:
    ```json
    {
      "vc": {
        "@context": ["https://www.w3.org/2018/credentials/v1"],
        "id": "urn:uuid:f81d4...",
        "type": ["VerifiableCredential", "VaccinationCredential"],
        "issuer": "did:key:z6MkuV...",
        "issuanceDate": "2026-06-04T12:00:00Z",
        "credentialSubject": { "id": "did:key:z6MkfT...", "vaccineType": "Covishield" },
        "proof": {
          "type": "Ed25519Signature2020",
          "created": "2026-06-04T12:00:00Z",
          "verificationMethod": "did:key:z6MkuV...#z6MkuV...",
          "proofPurpose": "assertionMethod",
          "jws": "base64-signature"
        }
      }
    }
    ```
*   **Response (200 OK - Valid)**:
    ```json
    {
      "valid": true,
      "status": "valid",
      "issuer": "did:key:z6MkuV...",
      "subject": "did:key:z6MkfT...",
      "type": ["VerifiableCredential", "VaccinationCredential"]
    }
    ```
*   **Response (200 OK - Invalid / Revoked)**:
    ```json
    {
      "valid": false,
      "reason": "Credential has been revoked.",
      "status": "revoked"
    }
    ```

### B. Verify ZKP (Selective Disclosure)
Mock endpoint evaluating a client-submitted zero-knowledge proof.

*   **URL**: `/verify-zkp`
*   **Method**: `POST`
*   **Request Payload**:
    ```json
    {
      "proof": { "pi_a": ["123", "456", "1"] },
      "publicSignals": ["1"],
      "verificationKey": {}
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "valid": true,
      "status": "valid",
      "latency_ms": 12,
      "match": true
    }
    ```

---

## 3. Federated Learning API (`/api/fl`)

Endpoints utilized by the client simulation training models.

### A. Submit Local Weights
Allows clients to upload their locally trained model parameters. Executing this endpoint aggregates parameters once the client count reaches `min_clients` (5).

*   **URL**: `/update`
*   **Method**: `POST`
*   **Request Payload**:
    ```json
    {
      "client_id": "device_0",
      "weights": [0.124, -0.452],
      "intercept": [0.089],
      "loss": 0.325,
      "data_size": 200
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "ok",
      "message": "Update received. Pending: 3/5"
    }
    ```

### B. Get Server Status
Returns the state of the global model along with history charts metadata.

*   **URL**: `/status`
*   **Method**: `GET`
*   **Response (200 OK)**:
    ```json
    {
      "current_round": 2,
      "global_weights": [0.112, -0.441],
      "global_intercept": [0.081],
      "pending_updates": 0,
      "loss_history": [
        { "round": 1, "loss": 0.354 }
      ],
      "overhead_history": [
        { "round": 1, "bytes": 480 }
      ],
      "min_clients": 5
    }
    ```

### C. Reset State
Resets all stored weights, intercepts, metrics, and round counts.

*   **URL**: `/reset`
*   **Method**: `POST`
*   **Response (200 OK)**:
    ```json
    {
      "status": "reset"
    }
    ```
