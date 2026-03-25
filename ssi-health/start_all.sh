#!/bin/bash

# Configuration and Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting SSI-Health Project Services...${NC}"

# Start Backend
echo -e "${GREEN}[1/4] Starting FastAPI Backend on :8000...${NC}"
cd backend
# Assume python 3 is standard
python3 main.py > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start Wallet
echo -e "${GREEN}[2/4] Starting Wallet Web App on :5173...${NC}"
cd frontend/wallet
npm run dev -- --port 5173 > wallet.log 2>&1 &
WALLET_PID=$!
cd ../..

# Start Issuer Portal
echo -e "${GREEN}[3/4] Starting Issuer Portal on :5174...${NC}"
cd frontend/issuer-portal
npm run dev -- --port 5174 > issuer.log 2>&1 &
ISSUER_PID=$!
cd ../..

# Start Verifier Portal
echo -e "${GREEN}[4/4] Starting Verifier Portal on :5175...${NC}"
cd frontend/verifier-portal
npm run dev -- --port 5175 > verifier.log 2>&1 &
VERIFIER_PID=$!
cd ../..

echo -e "\n${BLUE}All services successfully started!${NC}"
echo -e "➜ ${GREEN}Backend API:${NC}      http://localhost:8000/docs"
echo -e "➜ ${GREEN}Wallet Web App:${NC}   http://localhost:5173"
echo -e "➜ ${GREEN}Issuer Portal:${NC}    http://localhost:5174"
echo -e "➜ ${GREEN}Verifier Portal:${NC}  http://localhost:5175"
echo -e "\n${BLUE}Press Ctrl+C to terminate all processes.${NC}"

# Handle Termination gracefully
trap 'echo -e "\nGracefully shutting down services..."; kill $BACKEND_PID $WALLET_PID $ISSUER_PID $VERIFIER_PID; exit' SIGINT SIGTERM EXIT
wait
