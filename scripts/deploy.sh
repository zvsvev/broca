#!/usr/bin/env bash
# Build the contract and deploy + initialize it on NEAR testnet.
#
# Requires cargo-near, near-cli-rs, and a funded testnet account whose private
# key is in CONTRACT_KEY. Fill in the values in .env (see .env.example):
#   CONTRACT_ID, TREASURY_ID, CONTRACT_KEY, NEAR_NETWORK
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

: "${CONTRACT_ID:?set CONTRACT_ID in .env}"
: "${TREASURY_ID:?set TREASURY_ID in .env}"
: "${CONTRACT_KEY:?set CONTRACT_KEY in .env (private key that controls CONTRACT_ID)}"
NETWORK="${NEAR_NETWORK:-testnet}"
GRACE_NS="${GRACE_NS:-120000000000}"
MAX_SUPPLY="${MAX_SUPPLY:-1050000}"

export PATH="$HOME/.cargo/bin:$PATH"

echo "Building contract wasm..."
cargo near build non-reproducible-wasm --manifest-path contract/Cargo.toml

echo "Deploying to $CONTRACT_ID and calling new(treasury=$TREASURY_ID, grace_ns=$GRACE_NS)..."
near contract deploy "$CONTRACT_ID" \
  use-file contract/target/near/broca.wasm \
  with-init-call new json-args "{\"treasury\":\"$TREASURY_ID\",\"grace_ns\":$GRACE_NS,\"max_supply\":\"$MAX_SUPPLY\"}" \
  prepaid-gas '100 Tgas' attached-deposit '0 NEAR' \
  network-config "$NETWORK" \
  sign-with-plaintext-private-key "$CONTRACT_KEY" send

echo
echo "Deployed. Check it:"
echo "  near contract call-function as-read-only $CONTRACT_ID get_config json-args '{}' network-config $NETWORK now"
