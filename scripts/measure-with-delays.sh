#!/bin/bash
# Measure SSR vs RSC at different content-fetch delays (throttled: 4x CPU, Slow 3G)
# Usage: bash scripts/measure-with-delays.sh

set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20 > /dev/null 2>&1

DELAYS="0 200 500"
RAILS_OPTS="RAILS_ENV=production RAILS_SERVE_STATIC_FILES=true SECRET_KEY_BASE=dummy_secret_key_base_for_testing_1234567890abcdef"

kill_servers() {
  pkill -f 'puma.*3000' 2>/dev/null || true
  pkill -f 'node.*node-renderer' 2>/dev/null || true
  sleep 2
}

start_servers() {
  local delay_ms=$1
  echo "Starting servers with CONTENT_DELAY_MS=${delay_ms}..."

  # Node renderer (no delay needed, always running)
  NODE_ENV=production node node-renderer.js > /dev/null 2>&1 &
  sleep 3

  # Rails with delay env var
  CONTENT_DELAY_MS=$delay_ms RAILS_ENV=production RAILS_SERVE_STATIC_FILES=true \
    SECRET_KEY_BASE=dummy_secret_key_base_for_testing_1234567890abcdef \
    bundle exec rails server -p 3000 > /dev/null 2>&1 &
  sleep 5

  # Verify
  local ssr_code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/blog/ssr)
  local rsc_code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/blog/rsc)
  echo "  SSR: $ssr_code, RSC: $rsc_code"

  if [ "$ssr_code" != "200" ] || [ "$rsc_code" != "200" ]; then
    echo "ERROR: Server health check failed!"
    return 1
  fi
}

for delay in $DELAYS; do
  echo ""
  echo "============================================"
  echo "  CONTENT_DELAY_MS = ${delay}ms"
  echo "============================================"

  kill_servers
  start_servers $delay

  # Run throttled measurements (9 runs + 3 warmup = 12 total)
  node scripts/measure-vitals.mjs \
    --pages ssr,rsc \
    --throttle \
    -n 12 -w 3 \
    -l "delay-${delay}ms" \
    2>&1

  echo ""
done

kill_servers
echo "All delay tests complete!"
