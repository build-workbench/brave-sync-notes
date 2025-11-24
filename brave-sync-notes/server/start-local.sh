#!/usr/bin/env bash
set -euo pipefail

# Simple helper script to run the Brave Sync Notes server locally or on a VPS.
# Usage:
#   ./start-local.sh          # starts on port 3002
#   PORT=4000 ./start-local.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d node_modules ]; then
  echo "[info] Installing dependencies..."
  npm install
fi

PORT="${PORT:-3002}"
NODE_ENV="${NODE_ENV:-production}"

echo "[info] Starting server on port $PORT (NODE_ENV=$NODE_ENV)..."
PORT="$PORT" NODE_ENV="$NODE_ENV" node index.js
