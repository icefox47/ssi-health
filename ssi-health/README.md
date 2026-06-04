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

---

## 🛠 Setup & Installation on Linux / Ubuntu

Follow these steps to run this project on any Linux machine or VM:

### 1. Install System Prerequisites
Ensure Node.js (v20+) and Python 3 with virtual environment support are installed:
```bash
# Update package list and install Python + build tools
sudo apt update
sudo apt install -y python3-pip python3-venv python3-dev build-essential curl

# Install Node.js (v20) via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

### 2. Install Project Dependencies
Run this from the project's root folder:
```bash
# Install frontend packages
cd frontend/wallet && npm install && cd ../..
cd frontend/issuer-portal && npm install && cd ../..
cd frontend/verifier-portal && npm install && cd ../..

# Install backend dependencies in a Python virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### 3. Install SSL Proxy Tool (For Camera & Phone Access)
Since mobile browsers block camera access (QR scanning) on insecure `http` connections, you need `local-ssl-proxy` to enable HTTPS:
```bash
npm install -g local-ssl-proxy
```

---

## 🚀 Running the Project

### Step 1: Start Main Services
In your first terminal, run the unified startup script:
```bash
chmod +x start_all.sh
./start_all.sh
```

### Step 2: Start SSL Proxies
Open a second terminal window or tab and run:
```bash
chmod +x start_proxies.sh
./start_proxies.sh
```
This opens:
* **Verifier Portal HTTPS**: `https://<PC_LAN_IP>:5176` (proxied from port `5175`)
* **Backend API HTTPS**: `https://<PC_LAN_IP>:8001` (proxied from port `8000`)

### Step 3: Accessing from Mobile/Other Devices
1. Ensure both your hosting device (PC) and phone are connected to the **same Wi-Fi network**.
2. Note your hosting device's LAN IP address (e.g. run `ip addr` or `ifconfig`).
3. In your phone's browser, navigate to:
   **`https://<LAN_IP>:5176`** (e.g., `https://192.168.1.100:5176`).
4. **Important**: You must explicitly type `https://`. Bypass the self-signed certificate warning (Advanced -> Proceed) to load the page and enable the camera scanner.
