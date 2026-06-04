#!/bin/bash

# Kill any existing proxies first
pkill -f local-ssl-proxy 2>/dev/null

# Try to find local-ssl-proxy in PATH
PROXY_CMD=$(which local-ssl-proxy)

# If not found, try loading NVM
if [ -z "$PROXY_CMD" ]; then
    if [ -s "$HOME/.nvm/nvm.sh" ]; then
        source "$HOME/.nvm/nvm.sh"
        PROXY_CMD=$(which local-ssl-proxy)
    elif [ -s "/home/lenovo/.nvm/nvm.sh" ]; then
        source "/home/lenovo/.nvm/nvm.sh"
        PROXY_CMD=$(which local-ssl-proxy)
    fi
fi

# Final fallback for current Windows/WSL configuration if needed
if [ -z "$PROXY_CMD" ] && [ -f "/home/lenovo/.nvm/versions/node/v24.16.0/bin/local-ssl-proxy" ]; then
    # We can invoke it directly using its node engine
    NODE_CMD="/home/lenovo/.nvm/versions/node/v24.16.0/bin/node"
    PROXY_BIN="/home/lenovo/.nvm/versions/node/v24.16.0/bin/local-ssl-proxy"
    PROXY_CMD="$NODE_CMD $PROXY_BIN"
fi

if [ -z "$PROXY_CMD" ]; then
    echo -e "\e[31m✘ Error: local-ssl-proxy not found in PATH or NVM.\e[0m"
    echo "Please install it globally by running: npm install -g local-ssl-proxy"
    exit 1
fi

echo "Starting SSL Proxies on 0.0.0.0 (accessible from LAN)..."
echo "Using proxy command: $PROXY_CMD"

# Start Verifier SSL Proxy (5176 -> 5175)
$PROXY_CMD --hostname 0.0.0.0 --source 5176 --target 5175 > verifier_proxy.log 2>&1 &
VERIFIER_PROXY_PID=$!

# Start Backend SSL Proxy (8001 -> 8000)
$PROXY_CMD --hostname 0.0.0.0 --source 8001 --target 8000 > backend_proxy.log 2>&1 &
BACKEND_PROXY_PID=$!

sleep 2

# Check if they are running
if ps -p $VERIFIER_PROXY_PID > /dev/null && ps -p $BACKEND_PROXY_PID > /dev/null; then
    echo -e "\e[32m✔ SSL Proxies successfully started in the background!\e[0m"
    echo "➜ Verifier Proxy: https://0.0.0.0:5176"
    echo "➜ Backend Proxy:  https://0.0.0.0:8001"
else
    echo -e "\e[31m✘ Failed to start proxies. Check verifier_proxy.log and backend_proxy.log for errors.\e[0m"
fi
