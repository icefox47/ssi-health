# SSI-Health Project Phases

## Phase 2 — Issuer Portal (Weeks 3–5)
A hospital-facing dashboard. Think of it as an admin panel.

**What to build:**
- Login with JWT auth (issuer role)
- A form to issue a credential (select credential type: vaccination / eligibility / discharge summary, enter patient DID via QR scan or paste, fill template fields)
- Credential type templates (JSON schemas for each credential type — vaccination has vaccineType, date, batchNo etc.)
- A revocation panel — list issued credentials, click to revoke (adds credential ID to a revocation bitstring)
- Audit log table — every issuance/revocation timestamped

---

## Phase 3 — Verifier Portal (Weeks 5–7)
A clinic-facing app. This is your demo showpiece — fast, clean, works offline.

**What to build:**
- QR scanner (use react-qr-reader) that decodes the credential payload
- Signature verification against the issuer's public key (fetched from their DID Document — or cached locally for offline mode)
- Revocation status check against the status list endpoint
- ZKP selective disclosure — the user generates a proof on their wallet (e.g. "I am over 18" without revealing DOB), the verifier checks only the proof
- A result screen: green ✓ Valid / yellow ⚠ Expired / red ✗ Revoked with latency shown
- *The sub-5 second claim*: measure and display the verification time prominently in your demo — it's one of your evaluation metrics.

---

## Phase 4 — Federated Learning Module (Weeks 7–10)
This is the research novelty of your project. Keep the ML model simple (logistic regression or a small neural net) — the complexity is in the protocol, not the model.

**What to build:**
- A simulation script — 10 synthetic "devices" each with a local dataset (pseudonymized VC-derived features like eligibility_score, vaccination_count, aggregated per wallet). Each device trains locally, sends only model weight updates
- A FL aggregator FastAPI endpoint — receives updates, runs FedAvg, returns global model
- Differential privacy — add Gaussian noise to weight updates before sending (use diffprivlib or implement manually — it's a 5-line addition)
- An analytics dashboard — shows the global model's output (e.g. predicted vaccination coverage trend by region) as charts
- A consent UI — in the wallet app, a toggle: "Participate in health analytics (no raw data leaves your device)"
- A convergence visualization — loss curve per FL round, communication overhead per round

---

## Project Structure
```text
ssi-health/
├── backend/
│   ├── common/          # DID utils, VC schema, crypto
│   ├── issuer/          # Issuer API
│   ├── verifier/        # Verifier API
│   └── fl_aggregator/   # Federated learning server
├── frontend/
│   ├── wallet/          # User wallet SPA
│   ├── issuer-portal/   # Hospital dashboard
│   └── verifier-portal/ # Clinic portal
├── circuits/            # Circom ZKP circuits
├── simulation/          # FL device simulation scripts
└── docs/
```

## Suggested demo flow (for your final review)
1. Open wallet app → generate DID → show DID Document
2. Switch to issuer portal → issue a vaccination credential to that DID → credential appears in wallet
3. Open verifier portal → scan QR → show valid result with latency under 5 seconds
4. Click "Selective Disclosure" → reveal only age eligibility, not full DOB → verifier confirms proof
5. Switch to analytics tab → run FL simulation → show loss converging over rounds → show trend prediction chart
