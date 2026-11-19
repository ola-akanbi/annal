#!/usr/bin/env bash
# Deploys Annal to Reactive Lasna + Base Sepolia.
#
# Order matters (docs/CONTEXT.md, "Deploy order"): the book fixes its authorised reactive contract at
# construction, and the ownerless reactive contract fixes the book's address at construction. So we
# predict the book's address from the deployer's next Base Sepolia nonce, deploy the reactive side
# first, then deploy the book and check the prediction held.
#
# Usage: ANNAL_ACCOUNT=annal-deployer ANNAL_PW_FILE=~/.config/annal/deployer.pw contracts/script/deploy.sh
#   REACTIVE_FUNDING  lREACT sent to AnnalReactive at deployment (default 1.5ether)
#   BOOK_FUNDING      Base Sepolia ETH sent to AnnalBook at deployment (default 0.004ether)
set -euo pipefail
cd "$(dirname "$0")/.."

: "${ANNAL_ACCOUNT:?set ANNAL_ACCOUNT}" "${ANNAL_PW_FILE:?set ANNAL_PW_FILE}"
LASNA_RPC="${LASNA_RPC:-https://lasna-rpc.rnk.dev/}"
BASE_SEPOLIA_RPC="${BASE_SEPOLIA_RPC:-https://sepolia.base.org}"
REACTIVE_FUNDING="${REACTIVE_FUNDING:-1.5ether}"
BOOK_FUNDING="${BOOK_FUNDING:-0.004ether}"
AUTH=(--account "$ANNAL_ACCOUNT" --password-file "$ANNAL_PW_FILE")

# Sources and proxy: docs/CONTEXT.md, "Contracts we call" (each verified on-chain 2026-11-19).
BOOK_CHAIN_ID=84532
CALLBACK_PROXY=0x476F44b11F5C942c58f4c8E3d0300E5710743585
CHAINS="[11155111,84532,1301]"
TOKENS="[0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238,0x036CbD53842c5426634e7929541eC2318f3dCF7e,0x31d0220469e10c4E71834a79b1f276d740d3768F]"

DEPLOYER=$(cast wallet address "${AUTH[@]}")
[ "$(cast chain-id --rpc-url "$LASNA_RPC")" = "5318007" ] || { echo "LASNA_RPC is not Lasna"; exit 1; }
[ "$(cast chain-id --rpc-url "$BASE_SEPOLIA_RPC")" = "84532" ] || { echo "BASE_SEPOLIA_RPC is not Base Sepolia"; exit 1; }

BASE_NONCE=$(cast nonce "$DEPLOYER" --rpc-url "$BASE_SEPOLIA_RPC")
PREDICTED_BOOK=$(cast compute-address "$DEPLOYER" --nonce "$BASE_NONCE" | awk '{print $NF}')
echo "deployer $DEPLOYER · Base Sepolia nonce $BASE_NONCE · predicted book $PREDICTED_BOOK"

echo "==> AnnalReactive on Lasna"
RC_OUT=$(forge create src/AnnalReactive.sol:AnnalReactive --broadcast --json "${AUTH[@]}" \
  --rpc-url "$LASNA_RPC" --value "$REACTIVE_FUNDING" \
  --constructor-args "$BOOK_CHAIN_ID" "$PREDICTED_BOOK" "$CHAINS" "$TOKENS")
REACTIVE=$(echo "$RC_OUT" | jq -r .deployedTo)
REACTIVE_TX=$(echo "$RC_OUT" | jq -r .transactionHash)
echo "AnnalReactive $REACTIVE (tx $REACTIVE_TX)"

[ "$(cast nonce "$DEPLOYER" --rpc-url "$BASE_SEPOLIA_RPC")" = "$BASE_NONCE" ] || { echo "Base Sepolia nonce moved; prediction is stale"; exit 1; }

echo "==> AnnalBook on Base Sepolia"
BOOK_OUT=$(forge create src/AnnalBook.sol:AnnalBook --broadcast --json "${AUTH[@]}" \
  --rpc-url "$BASE_SEPOLIA_RPC" --value "$BOOK_FUNDING" \
  --constructor-args "$CALLBACK_PROXY" "$REACTIVE" "$CHAINS" "$TOKENS")
BOOK=$(echo "$BOOK_OUT" | jq -r .deployedTo)
BOOK_TX=$(echo "$BOOK_OUT" | jq -r .transactionHash)
echo "AnnalBook $BOOK (tx $BOOK_TX)"

if [ "$(echo "$BOOK" | tr '[:upper:]' '[:lower:]')" != "$(echo "$PREDICTED_BOOK" | tr '[:upper:]' '[:lower:]')" ]; then
  echo "BOOK ADDRESS MISMATCH: predicted $PREDICTED_BOOK, got $BOOK"; exit 1
fi

mkdir -p deployments
jq -n --arg reactive "$REACTIVE" --arg reactiveTx "$REACTIVE_TX" --arg book "$BOOK" --arg bookTx "$BOOK_TX" \
  --arg deployer "$DEPLOYER" --arg proxy "$CALLBACK_PROXY" --arg at "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{deployedAt: $at, deployer: $deployer,
    lasna: {chainId: 5318007, AnnalReactive: $reactive, tx: $reactiveTx},
    baseSepolia: {chainId: 84532, AnnalBook: $book, tx: $bookTx, callbackProxy: $proxy},
    sources: [
      {chainId: 11155111, usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"},
      {chainId: 84532, usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e"},
      {chainId: 1301, usdc: "0x31d0220469e10c4E71834a79b1f276d740d3768F"}]}' > deployments/testnet.json
cat deployments/testnet.json
