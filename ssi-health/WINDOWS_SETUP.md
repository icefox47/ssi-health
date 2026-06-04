# Windows 11 + WSL2 Migration & Setup Guide

This guide is designed for developers migrating from native Linux (e.g., Linux Mint) to a Windows 11 environment utilizing **WSL2 (Windows Subsystem for Linux)**. It addresses path assumptions, line-ending differences, dependency requirements, port mappings, and camera/WebRTC constraints.

---

## 1. System Architecture & WSL2 Networking

When running in WSL2:
*   The backend database, FastAPI server, and React development servers run inside the **Linux virtual machine**.
*   The web browsers run on the **Windows 11 host**.
*   WSL2 automatically forwards traffic on `localhost` from Windows to Linux. You can access the dev servers in your Windows web browser at `http://localhost:5173`, `http://localhost:5174`, etc.

---

## 2. Crucial WSL2 Gotchas & Prerequisites

### A. File System Performance (The `/mnt/c` Trap)
> [!IMPORTANT]
> **Do not** store or run this project on the Windows host drive path (e.g., `/mnt/c/Users/...`). 
> Under WSL2, cross-OS file operations are extremely slow, and running `npm install` or compilation on `/mnt/c` can take hours or fail due to symlink compatibility.
> **Always** clone and run the project inside the native Linux filesystem path (e.g., `/home/username/projects/ssi-health`), as you have done.

### B. Git CRLF Line Endings Issue
Windows Git default configurations (`core.autocrlf = true`) automatically convert Unix LF line endings to Windows CRLF line endings on check out.
If `start_all.sh` gets CRLF line endings, executing it inside WSL2 will fail with:
`bash: ./start_all.sh: /bin/bash^M: bad interpreter: No such file or directory`

#### How to Fix:
1. Install `dos2unix` in WSL2 Ubuntu:
   ```bash
   sudo apt update && sudo apt install -y dos2unix
   ```
2. Convert the script line endings back to Unix format:
   ```bash
   dos2unix start_all.sh
   ```
3. (Optional) Prevent Git from changing line endings for this project by creating a `.gitattributes` file in the root directory:
   ```text
   *.sh text eol=lf
   ```

---

## 3. Dependency Inventory & Installation

### A. Bash Dependencies
The script `start_all.sh` uses standard Unix terminal controls:
*   `trap`: Handles SIGINT/SIGTERM to kill background PIDs on exit.
*   `kill`: Terminates the background dev processes.
*   `wait`: Blocks shell termination until child processes complete.
These utilities are pre-installed in the default Ubuntu WSL2 bash shell.

### B. Python Dependencies (Backend & Simulation)
The python virtual environment uses packages with native binary compilation (e.g., `cryptography`, `bcrypt`, `numpy`, `scikit-learn`).

1. Install system prerequisites in WSL2:
   ```bash
   sudo apt install -y python3-pip python3-venv python3-dev build-essential
   ```
2. Initialize and install dependencies inside the `backend` folder:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   deactivate
   cd ..
   ```

### C. Node.js & NPM Dependencies (Frontends)
You must install Node.js inside the WSL2 Linux environment (do not use Windows-installed Node.js from inside WSL).

1. Install **NVM (Node Version Manager)** to manage versions cleanly:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   source ~/.bashrc
   ```
2. Install Node.js LTS (v20+):
   ```bash
   nvm install 20
   nvm use 20
   ```
3. Install frontend module packages:
   ```bash
   cd frontend/wallet && npm install
   cd ../issuer-portal && npm install
   cd ../verifier-portal && npm install
   cd ../..
   ```

---

## 4. Port Allocations & Conflict Resolution

The system utilizes four hardcoded ports:
*   `8000` — FastAPI Backend API
*   `5173` — Wallet Web App
*   `5174` — Issuer Portal
*   `5175` — Verifier Portal

### A. Checking for Port Conflicts on Windows/WSL2
If another service on your machine is running on one of these ports, the startup script will crash. To check if a port is in use from WSL2, run:
```bash
ss -tulpn | grep -E "8000|5173|5174|5175"
```
Or check from Windows PowerShell:
```powershell
Get-NetTCPConnection | Where-Object { $_.LocalPort -in 8000, 5173, 5174, 5175 }
```

### B. Hardcoded Port Assumption Warn
If you change a port in Vite config or the backend startup command, you **must** update the endpoints in the frontend code since API calls are currently hardcoded to `http://localhost:8000`:
*   `frontend/wallet/src/api.js` (Line 1)
*   `frontend/issuer-portal/src/components/AnalyticsDashboard.jsx` (Line 21)
*   `frontend/verifier-portal/src/views/ScanView.jsx` (Line 64)
*   `frontend/verifier-portal/src/views/ZkpView.jsx` (Line 23)

---

## 5. WebRTC / Camera & QR Scanning Constraints

The Verifier Portal (`ScanView.jsx`) and Issuer Portal (`IssueCredential.jsx`) utilize the camera to scan DID/Credential QR codes.

### A. Secure Context Requirement
Modern web browsers (Chrome, Edge, Firefox) block access to the camera (`navigator.mediaDevices.getUserMedia`) on pages served over insecure channels.
*   **Allowed**: `http://localhost:<port>` (treated as a secure context).
*   **Blocked**: `http://127.0.0.1:<port>` or `http://<WSL_IP_ADDRESS>:<port>` or your local LAN IP (e.g., `http://192.168.1.5:5175`).

**Recommendation**: When testing on your Windows host, always open the apps using `http://localhost:5173`, `http://localhost:5174`, and `http://localhost:5175` rather than numerical IP addresses.

### B. Testing with Mobile Devices / External Cameras
If you want to test scanning using a physical mobile phone:
1. You cannot use `http://localhost` from your phone.
2. If you access the Verifier Portal on your phone using your computer's IP (e.g., `http://192.168.1.X:5175`), camera access will be blocked due to lack of HTTPS.
3. **Workaround**: Use a secure tunnel tool like `ngrok` or `localtunnel` to map port 5175 to an HTTPS endpoint:
   ```bash
   npx localtunnel --port 5175
   ```
   Open the generated `https://...` URL on your mobile phone to grant secure camera access.

---

## 6. How to Run the System

1.  Convert the startup script line endings:
    ```bash
    dos2unix start_all.sh
    ```
2.  Launch the services simultaneously:
    ```bash
    ./start_all.sh
    ```
3.  In another terminal tab, run the Federated Learning simulation script:
    ```bash
    cd simulation
    # Ensure backend venv is active to provide requests, numpy, and scikit-learn
    source ../backend/venv/bin/activate
    python fl_simulation.py --clients 5 --rounds 10
    ```
4.  Open the web interfaces in your Windows browser:
    *   **Wallet App**: `http://localhost:5173`
    *   **Issuer Portal**: `http://localhost:5174`
    *   **Verifier Portal**: `http://localhost:5175`
