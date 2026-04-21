#!/usr/bin/env bash
set -euo pipefail

# Simple helper script to run the Brave Sync Notes server locally or on a VPS.
# Usage:
#   ./start-local.sh          # starts on port 3002
#   PORT=4000 ./start-local.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d node_modules ]; then
  echo "[error] Dependencies are missing. Run 'npm ci' in this directory first."
  exit 1
fi

PORT="${PORT:-3002}"
NODE_ENV="${NODE_ENV:-development}"

if [ -z "${CORS_ORIGIN:-}" ]; then
  export CORS_ORIGIN="http://localhost:5173"
fi

if [ -z "${PRIMARY_STORAGE:-}" ]; then
  export PRIMARY_STORAGE="sqlite"
fi

if [ -z "${FALLBACK_STORAGE:-}" ]; then
  export FALLBACK_STORAGE="sqlite"
fi

echo "[info] Using CORS_ORIGIN=$CORS_ORIGIN"
echo "[info] Using PRIMARY_STORAGE=$PRIMARY_STORAGE"
echo "[info] Using FALLBACK_STORAGE=$FALLBACK_STORAGE"

echo "[info] Starting server on port $PORT (NODE_ENV=$NODE_ENV)..."
PORT="$PORT" NODE_ENV="$NODE_ENV" node index.js
