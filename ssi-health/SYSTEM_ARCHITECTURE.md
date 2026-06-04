# System Architecture - SSI Health

This document outlines the system architecture of the **SSI Health** project. It details the design, data structures, communication protocols, and sequence flows of the application.

---

## 1. Architectural Overview

SSI Health is structured as a **decentralized 4-layer architecture** designed to issue, manage, and verify health credentials, and perform privacy-preserving analytics:

1.  **User Wallet**: A React-based client-side application (Vite, TailwindCSS) where users generate decentralized identities, store credentials securely in an encrypted local database (`localStorage`), and manage privacy preferences.
2.  **Issuer Portal**: An administrative dashboard for medical authorities (e.g., hospitals, clinics) to issue credentials and view analytics. It communicates with a database containing issuance audits and revocation logs.
3.  **Verifier Portal**: A portal for clinic check-ins to verify patient credentials offline. It decodes QR codes, validates cryptographic signatures, and evaluates mock Zero-Knowledge Proofs.
4.  **Federated Learning Server & Simulator**: An aggregator that collects local model weights from simulated client devices, averages them (using FedAvg), and monitors optimization progress without directly accessing raw data.

```
┌──────────────────────────────────────────────────────────────────┐
│                      Web Browser (Windows 11)                    │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │    Wallet App    │  │  Issuer Portal   │  │Verifier Portal │  │
│  │   (Port 5173)    │  │   (Port 5174)    │  │  (Port 5175)   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬───────┘  │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │ Request VCs         │ Issue/Revoke/Audit  │ Verify VC/ZKP
            ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                          FastAPI Backend                         │
│                            (Port 8000)                           │
│                                                                  │
│    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│    │  Issuer API  │      │ Verifier API │      │    FL API    │  │
│    └──────┬───────┘      └──────┬───────┘      └──────┬───────┘  │
└───────────┼─────────────────────┼─────────────────────┼──────────┘
            │                     │                     ▲ Local weights
            ▼                     ▼                     │
┌─────────────────────────┐ ┌───────────────────────────┴──────────┐
│  SQLite (issuer_data)   │ │ FL Simulator (fl_simulation.py)      │
│  - Issued credentials   │ │ - Client datasets                    │
│  - Audit logs           │ │ - SGD Classifier (scikit-learn)      │
└─────────────────────────┘ └──────────────────────────────────────┘
```

---

## 2. Core Components

### A. Frontend Services (Single-Page Applications)
The frontends are built using **React 19**, **Vite 8**, and **TailwindCSS v4**:

*   **Wallet (`frontend/wallet`)**:
    *   **Cryptographic Engine (`crypto.js`)**: Encrypts and decrypts state information using `CryptoJS.AES` (symmetric AES-256) keyed by a user-supplied passcode.
    *   **Credential Wallet (`WalletHome.jsx`)**: Synchronizes credentials from the issuer and renders QR codes.
    *   **Analytics Consent Manager (`DIDSetup.jsx`)**: Collects consent for local ML model training contributions.
*   **Issuer Portal (`frontend/issuer-portal`)**:
    *   **Authentication Portal (`Login.jsx`)**: Authorizes admin login via JWT tokens.
    *   **Credential Emitting Form (`IssueCredential.jsx`)**: Allows inputting metadata mapped into predefined VC templates.
    *   **Revocation panel (`RevocationPanel.jsx`)**: Updates database records to mark VCs invalid.
    *   **Analytics visualizer (`AnalyticsDashboard.jsx`)**: Displays charts (`Recharts`) tracking round loss and communication metrics.
*   **Verifier Portal (`frontend/verifier-portal`)**:
    *   **Camera Scan component (`ScanView.jsx`)**: Utilizes `html5-qrcode` to capture and parse JSON QR code streams.
    *   **ZKP Checker (`ZkpView.jsx`)**: Evaluates mock selective disclosure proofs.

### B. Python API Services (FastAPI Backend)
The backend is structured into modular routers:
*   **Issuer Service (`backend/issuer`)**: Signs credentials, tracks database states, and issues JWT tokens.
*   **Verifier Service (`backend/verifier`)**: Resolves Issuer public keys from `did:key` identifiers, validates signatures, and parses revocation tables.
*   **FL Aggregator (`backend/fl_aggregator`)**: Accumulates model parameters in-memory and executes the FedAvg algorithm once the minimum client count is satisfied.
*   **Common utilities (`backend/common`)**: Shared libraries for base58/multicodec DID encoding, SQLAlchemy database models, and Ed25519 signature checks.

### C. Storage & Database (SQLite / SQL Alchemy)
A local SQLite database file `issuer_data.db` is maintained in the backend folder:
1.  **`issued_credentials` Table**: Saves issued VCs, subject DIDs, types, raw JSON payloads, and active status (`valid` or `revoked`).
2.  **`audit_logs` Table**: Records issuance timestamps, actions (`ISSUE`, `REVOKE`), and targeted credentials.

---

## 3. Data Models and Schemas

### A. Decentralized Identifier (did:key)
The wallet generates Ed25519 keypairs. The public key is translated to a W3C-compliant `did:key`:
1.  Prefix the raw public key bytes (32 bytes) with the **Ed25519 multicodec header** (`0xed01`).
2.  Encode the prefixed bytes using **Base58btc**.
3.  Prepend `did:key:z` (where `z` indicates Base58btc multibase format).

**Example DID**: `did:key:z6MkuV...`

### B. W3C Verifiable Credential Schema (Pydantic)
```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "id": "urn:uuid:f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
  "type": ["VerifiableCredential", "VaccinationCredential"],
  "issuer": "did:key:z6MkuV...",
  "issuanceDate": "2026-06-04T12:00:00Z",
  "expirationDate": "2027-06-04T12:00:00Z",
  "credentialSubject": {
    "id": "did:key:z6MkfT...",
    "vaccineType": "mRNA-1273",
    "date": "2026-06-04",
    "batchNo": "AB1234"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2026-06-04T12:00:00Z",
    "verificationMethod": "did:key:z6MkuV...#z6MkuV...",
    "proofPurpose": "assertionMethod",
    "jws": "Base64URL-encoded-signature-value"
  }
}
```

---

## 4. Sequence Workflows

### A. Identity Generation & Credential Syncing
The user sets up an identity inside the wallet, which triggers credential loading:

```
┌────────┐               ┌──────────────┐               ┌─────────────┐
│ Wallet │               │  Issuer API  │               │ SQLite (DB) │
└───┬────┘               └──────┬───────┘               └──────┬──────┘
    │                           │                              │
    │ 1. generateDID()          │                              │
    ├──────────────────────────>│                              │
    │                           │ 2. Generate Ed25519 keypair  │
    │                           │    Derive did:key            │
    │                           │                              │
    │ 3. Return DID + keys      │                              │
    │<──────────────────────────┤                              │
    │                           │                              │
    │ 4. Local storage encrypt  │                              │
    │    (AES-256 with password)│                              │
    │                           │                              │
    │ 5. fetchMyCredentials(DID)│                              │
    ├───────────────────────────┼─────────────────────────────>│
    │                           │                              │ Query valid VCs
    │                           │                              │ for this DID
    │                           │ 6. Return VC payloads        │
    │<──────────────────────────┼──────────────────────────────┤
    │                           │                              │
```

### B. Verification Flow
The user presents a QR code representing their VC to a clinic verifier:

```
┌────────┐             ┌────────────────┐            ┌──────────────┐            ┌─────────────┐
│ Wallet │             │ Verifier Portal│            │ Verifier API │            │ SQLite (DB) │
└───┬────┘             └───────┬────────┘            └──────┬───────┘            └──────┬──────┘
    │                          │                            │                           │
    │ 1. Scan VC QR            │                            │                           │
    ├─────────────────────────>│                            │                           │
    │    (VC Payload + TS)     │ 2. verify(VC)              │                           │
    │                          ├───────────────────────────>│                           │
    │                          │                            │                           │
    │                          │                            │ 3. Extract Issuer DID     │
    │                          │                            │    Decode base58 &        │
    │                          │                            │    Verify Ed25519 signature
    │                          │                            │                           │
    │                          │                            │ 4. Check revocation state │
    │                          │                            ├──────────────────────────>│
    │                          │                            │                           │
    │                          │                            │ 5. Return status          │
    │                          │                            │<──────────────────────────┤
    │                          │                            │                           │
    │                          │ 6. Return response         │                           │
    │                          │    (valid/expired/revoked  │                           │
    │                          │     + latency)             │                           │
    │                          │<───────────────────────────┤                           │
    │                          │                            │                           │
```
