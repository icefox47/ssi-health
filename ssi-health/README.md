# SSI Health - Privacy-Preserving Health Credentials System

**SSI Health** is a comprehensive, production-grade 4-layer prototype that demonstrates the power of Self-Sovereign Identity (SSI) blended with secure Zero Knowledge Proofs (ZKP) and decentralized Federated Learning (FL). 

This project tackles the inherent challenge of verifiable, untamperable health credentials (vaccinations, eligibility) securely existing offline while respecting user data dignity via differential privacy analytics.

## 🚀 Quick Start
Run all endpoints and applications simultaneously using the unified shell script:
```bash
chmod +x start_all.sh
./start_all.sh
```

## 🌐 The 4 Core Phases

### Phase 1: Core Identity (The User Wallet)
- **DID Generation:** Generates Ed25519 `did:key` pairs directly in the browser.
- **W3C VC Structure:** Handles Verifiable Credentials mapped directly to DID parameters.
- **Local Persistence:** Credentials securely reside on the user's localized wallet app.

### Phase 2: Issuer Portal (The Admin Dashboard)
- **Hospital API:** A secure portal for medical professionals to emit standard credentials.
- **Audit Logs:** Full tracing mechanism for every VC emitted.
- **Revocation Engine:** Tracks a live bitstring map allowing an issuer to revoke credentials dynamically (invalidating them on the clinic side natively).

### Phase 3: Verifier Portal (The Clinic Showpiece)
- **Sub-5s Decoding:** Instant, completely offline capability to decode a QR structure.
- **Latency Tracking:** Measures cryptographic signature authentication and real-time expiration validation.
- **ZKP Selective Disclosure:** Validate user properties (e.g., *Age &gt; 18*) bypassing raw-data harvesting via simulated cryptographic circuit evaluation.

### Phase 4: Federated Learning (The Research Novelty)
- **Aggregator Simulation:** Connects `N` synthetic dataset sources (wallets modeling logistic regression locally).
- **Differential Privacy:** Blends dynamic Gaussian Noise models protecting user identification prior to payload handshakes.
- **Visual Analytics Dashboard:** Embedded natively within the Issuer Portal demonstrating Loss Function and Communications convergence live.

---

## 🎬 Suggested Demo Flow (Review Pipeline)

Evaluate the complete end-to-end implementation by proceeding manually through the following sequence:

1. **Initialize Your Identity**
   - Access **Wallet App (Port 5173)**. 
   - Generate your new DID and view the resulting DID Document detailing the public keys.
2. **Issue The Credential**
   - Switch to **Issuer Portal (Port 5174)**. Log in with `admin` / `password123`.
   - Issue a vaccination or eligibility credential using the DID copied from your wallet.
   - Observe the credential sync accurately into your wallet interface.
3. **Verify Visually**
   - Open **Verifier Portal (Port 5175)**. 
   - Scan the QR payload reflecting from your Wallet App.
   - Authenticate the green `✓ Valid` output recognizing the measured cryptographic latency (<5 seconds!).
4. **Demonstrate Selective Disclosure**
   - Transition to the **ZKP Selection** interface in the Verifier portal.
   - Showcase validating specific properties locally utilizing the Demo payload proofs mapping to age verification without revealing birthdates.
5. **Run Federated Learning Simulation**
   - Open up the integrated **Analytics & FL Dashboard** localized on the Issuer Portal.
   - Within your IDE interface, open `simulation/fl_simulation.py` and run: 
     `python fl_simulation.py --clients 5 --rounds 10`
   - Observe the live trend convergence mapping loss metrics interactively over iterations!
