#!/bin/bash

# Configuration and Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load NVM (Node Version Manager) automatically if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
elif [ -s "/home/lenovo/.nvm/nvm.sh" ]; then
    source "/home/lenovo/.nvm/nvm.sh"
fi

# Parse arguments
TUNNEL=false
for arg in "$@"
do
    case $arg in
        --tunnel|-t)
        TUNNEL=true
        shift
        ;;
    esac
done

echo -e "${BLUE}Starting SSI-Health Project Services...${NC}"

# Start Backend
echo -e "${GREEN}[1/4] Starting FastAPI Backend on :8000...${NC}"
cd backend
if [ -d "venv" ]; then
    ./venv/bin/python main.py > backend.log 2>&1 &
else
    python3 main.py > backend.log 2>&1 &
fi
BACKEND_PID=$!
cd ..

# Start Wallet
echo -e "${GREEN}[2/4] Starting Wallet Web App on :5173...${NC}"
cd frontend/wallet
npm run dev -- --port 5173 --host > wallet.log 2>&1 &
WALLET_PID=$!
cd ../..

# Start Issuer Portal
echo -e "${GREEN}[3/4] Starting Issuer Portal on :5174...${NC}"
cd frontend/issuer-portal
npm run dev -- --port 5174 --host > issuer.log 2>&1 &
ISSUER_PID=$!
cd ../..

# Start Verifier Portal
echo -e "${GREEN}[4/4] Starting Verifier Portal on :5175...${NC}"
cd frontend/verifier-portal
npm run dev -- --port 5175 --host > verifier.log 2>&1 &
VERIFIER_PID=$!
cd ../..

# Expose tunnels if requested
if [ "$TUNNEL" = true ]; then
    echo -e "\n${BLUE}Starting secure public tunnels via tunnelmole...${NC}"
    
    # Wait for the backend and frontends to bind to their ports
    echo -e "${GREEN}Waiting for local services to start up and bind to ports...${NC}"
    sleep 5
    
    # Remove old tunnel logs
    rm -f *tunnel.log
    
    # Run global tmole command directly
    tmole 8000 > backend_tunnel.log 2>&1 &
    BACKEND_TUNNEL_PID=$!
    
    tmole 5173 > wallet_tunnel.log 2>&1 &
    WALLET_TUNNEL_PID=$!
    
    tmole 5174 > issuer_tunnel.log 2>&1 &
    ISSUER_TUNNEL_PID=$!
    
    tmole 5175 > verifier_tunnel.log 2>&1 &
    VERIFIER_TUNNEL_PID=$!
    
    echo -n -e "${GREEN}Waiting for tunnel URLs to resolve${NC}"
    # Poll logs for up to 15 seconds until the URL appears
    for i in {1..15}; do
        if [ -f "backend_tunnel.log" ] && grep -q "tunnelmole.net" backend_tunnel.log; then
            echo -e " ${GREEN}[Done]${NC}"
            break
        fi
        echo -n "."
        sleep 1
    done
fi

echo -e "\n${BLUE}All services successfully started!${NC}"
echo -e "➜ ${GREEN}Backend API:${NC}      http://localhost:8000/docs"
echo -e "➜ ${GREEN}Wallet Web App:${NC}   http://localhost:5173"
echo -e "➜ ${GREEN}Issuer Portal:${NC}    http://localhost:5174"
echo -e "➜ ${GREEN}Verifier Portal:${NC}  http://localhost:5175"

if [ "$TUNNEL" = true ]; then
    echo -e "\n${BLUE}Public Tunnel URLs (Accessible from any network/device):${NC}"
    echo -e "➜ ${GREEN}Backend API Tunnel:${NC}    $(grep -o 'https://[^ ]*tunnelmole\.net' backend_tunnel.log | head -n 1)"
    echo -e "➜ ${GREEN}Wallet App Tunnel:${NC}     $(grep -o 'https://[^ ]*tunnelmole\.net' wallet_tunnel.log | head -n 1)"
    echo -e "➜ ${GREEN}Issuer Portal Tunnel:${NC}  $(grep -o 'https://[^ ]*tunnelmole\.net' issuer_tunnel.log | head -n 1)"
    echo -e "➜ ${GREEN}Verifier Portal Tunnel:${NC}$(grep -o 'https://[^ ]*tunnelmole\.net' verifier_tunnel.log | head -n 1)"
fi

echo -e "\n${BLUE}Press Ctrl+C to terminate all processes.${NC}"

# Handle Termination gracefully
trap 'echo -e "\nGracefully shutting down services..."; kill $BACKEND_PID $WALLET_PID $ISSUER_PID $VERIFIER_PID $BACKEND_TUNNEL_PID $WALLET_TUNNEL_PID $ISSUER_TUNNEL_PID $VERIFIER_TUNNEL_PID 2>/dev/null; exit' SIGINT SIGTERM EXIT
wait
