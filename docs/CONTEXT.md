# Context
Verified facts about everything this project depends on. Each entry says how it was verified, so no session has to re-derive it or trust training data. Read before touching an integration.

## Platforms and environments
| Name | Kind | ID | Endpoint (env var) | Explorer | Verified |
|---|---|---|---|---|---|
| Reactive Lasna | Reactive testnet (Omni, CometBFT) | 5318007 (`0x512577`) | `https://lasna-rpc.rnk.dev/` (`LASNA_RPC`) | https://lasna.reactscan.net | `eth_chainId` 2026-11-19. Block time 1.09 s avg over 100 blocks, 1.42 s over 10,000, and one 600-block window at 2.6 s |
| Ethereum Sepolia | origin | 11155111 | `https://ethereum-sepolia-rpc.publicnode.com` (`SEPOLIA_RPC`) | https://sepolia.etherscan.io | USDC calls 2026-11-19 |
| Base Sepolia | origin + destination (book) | 84532 (`0x14a34`) | `https://sepolia.base.org` (`BASE_SEPOLIA_RPC`) | https://sepolia.basescan.org | `eth_chainId` + 0.200 s blocks over 10,000, 2026-11-19 |
| Unichain Sepolia | origin | 1301 (`0x515`) | `https://sepolia.unichain.org` (`UNICHAIN_SEPOLIA_RPC`) | https://sepolia.uniscan.xyz | `eth_chainId` + 1.000 s blocks over 10,000, 2026-11-19 |

## Our deployments (testnet, 2026-11-19; full record in contracts/deployments/testnet.json)
| Contract | Network | Address | Deploy tx |
|---|---|---|---|
| AnnalReactive | Reactive Lasna (5318007) | `0x653B62A39Aea06998c152b48F150175B2645c8Bd` | `0x7fc707bad916dd68804a495b20c5247ff1a165e7eb72f5b5bead4a182b104b52` |
| AnnalBook | Base Sepolia (84532) | `0x653B62A39Aea06998c152b48F150175B2645c8Bd` | `0x6939b7177d970f26857ec34e9bea02498cf80a6805c2a48390286be7fbd86d8a` |
| LookalikeUSDC (demo only, not a source) | Base Sepolia | `0x4D2579b6E0f6273618Cd95Ff57Ae07653E9106Ca` | see docs/evidence/E-004 |

Both Annal contracts sit at the same address because each was the deployer's first transaction (nonce 0) on its chain. That is a coincidence of a fresh deployer, not a requirement: deploy.sh predicts the book's address from whatever the Base Sepolia nonce is.

## Contracts we call
| Name | Address | Source of address | Verified how |
|---|---|---|---|
| Reactive system contract (Lasna) | `0x8888888888888888888888888888888888888888` | docs origins-and-destinations | `eth_getCode` non-empty, 2026-11-19 |
| Legacy service / Cron source | `0x0000000000000000000000000000000000fffFfF` | docs index.md, reactive-contracts.mdx | docs only |
| Callback proxy, Base Sepolia | `0x476F44b11F5C942c58f4c8E3d0300E5710743585` | docs origins-and-destinations | `eth_getCode` 218 bytes, 2026-11-19 |
| Callback proxy, Unichain Sepolia | `0x775c9B990ADe401060B78D0e98684eEf8d2466C1` | docs | `eth_getCode` 218 bytes, 2026-11-19 |
| Callback proxy, Ethereum Sepolia | `0xAa14d9Cd0f788Ca23d11805986C1d8bd035D23b4` | docs | not checked |
| Circle USDC, Ethereum Sepolia | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | Circle testnet list | `symbol()` = USDC, `decimals()` = 6, 2026-11-19 |
| Circle USDC, Base Sepolia | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Circle testnet list | `symbol()` = USDC, `decimals()` = 6, 2026-11-19 |
| Circle USDC, Unichain Sepolia | `0x31d0220469e10c4E71834a79b1f276d740d3768F` | Circle testnet list | `symbol()` = USDC, `decimals()` = 6, 2026-11-19 |
| Lasna faucet (send Sepolia ETH, receive lREACT) | Ethereum Sepolia `0x9b9BB25f1A81078C544C829c5EB7822d747Cf434` · Base Sepolia `0x2afaFD298b23b62760711756088F75B7409f5967` | Reactive-Network/testnet-faucet README | Source read 2026-11-21 (`src/faucet/ReactiveFaucetL1.sol`): `request()` only emits `PaymentRequest(receiver, amount)`; an off-chain relayer pays on Lasna. `max_payout` is in ETH wei (5e19 = 50 ETH on Ethereum Sepolia); anything above it is kept. 0.1 ETH paid 10.5 lREACT to the receiver within one 15 s check (E-011) |

## SDKs and APIs
| Package | Pinned | Calls we use | Verified in |
|---|---|---|---|
| reactive-lib-omni (GitHub `Reactive-Network/reactive-lib-omni`) | commit to pin at install | `AbstractReactive` (`SYSTEM`, `REACTIVE_IGNORE`, `onlySystem`) · `SYSTEM.subscribe(chainId, contract, topic0..3)` / `unsubscribe` (same six args) · `SYSTEM.requestCallbackV_1_0(CallbackConfiguration_V_1_0{chainId, recipient, gasLimit, payload})` · `react(LogRecord)` · `AbstractCallback(callbackProxy, callbackSender)` with `onlyServiceProvider` + `onlyCallbackSender(address)` | `src/interfaces/IReactive.sol` read 2026-11-19; docs reactive-contracts.mdx, callback-contracts.mdx, index.md |
| `IReactive.LogRecord` | — | `chainId, contractAddress, topic0, topic1, topic2, topic3, data, blockNumber, opCode, blockHash, txHash, logIndex` (all `uint256` except `contractAddress` and `data`) | `src/interfaces/IReactive.sol`, 2026-11-19 |

## Traps
- **The RVM is gone (Omni, since Lasna 2026-10-07).** Contracts deploy once, as Solidity 0.8.29. Pre-October tutorials with dual deployment, `vmOnly` or `rvmOnly` are out of date. (Source: blog "Lasna Testnet Completes Migration", 2026-10-07)
- **`lasna-omni-rpc.rnk.dev` no longer resolves** (2026-11-19), though older posts cite it. Use `lasna-rpc.rnk.dev`.
- **Wildcards:** `chainId 0` = any chain, `contract address(0)` = any contract, `REACTIVE_IGNORE` = any topic value. At least one criterion must be specific. Equality only, no OR: call `subscribe()` once per combination. A topic of `0` is a literal zero, not a wildcard. (Source: reactive-contracts.mdx + wildcard-table.js)
- **`unsubscribe()` must match all six arguments exactly**, or it fails silently.
- **Topping up a reactive contract:** AnnalReactive (via `AbstractPayer`) has a payable `receive()`, and the system contract charges it with `pay()` from its own balance, so a plain lREACT transfer tops it up while debt is 0. The pinned reactive-lib-omni has no `depositTo`; that call lives on the system contract per economy.mdx and is only needed to settle a debt (E-011).
- **Debt silences everything:** any debt > 0 stops `react()` (Reactive side) or delivery (callback side, `InDebt`). Fund the reactive contract with `depositTo()` on the system contract. Fund the book with `depositTo()` on the Base Sepolia callback proxy. A plain transfer doesn't settle debt. (Source: economy.mdx)
- **Callback payload:** the first 160 bits are replaced with the requesting reactive contract's address. Declare an `address` first argument and pass `address(0)`. (Source: reactive-contracts.mdx)
- **Callbacks are billed to the recipient**, in the destination chain's native currency. A failed callback is still billed.
- **A reverting `react()` is still billed.** Filter by falling through, never by reverting.
- **A contract can't be both reactive and callback** (AbstractPayer has a single immutable service provider).
- **Deploy order:** a callback contract fixes its authorized `callbackSender` at construction, and an ownerless reactive contract fixes its recipient at construction. Predict the book's Base Sepolia address from the deployer's next nonce, deploy the reactive contract on Lasna with that address, then deploy the book.
- **Base Sepolia blocks are 200 ms.** Use timestamps, never block counts, for any timer. (Source: buildathon rules)
- **Native ETH transfers emit no logs**, so Annal records ERC-20 (USDC) only.
- Reactive transaction gas limit max 900,000. The callback proxy reserves `_extraGas` + `_maxChargeGas` from the callback gas limit, so read both from the proxy before sizing. (Source: economy.mdx)

- **Base Sepolia public RPC limits `eth_getLogs` to a 200-block range** (error -32614). Page in 200-block windows. Lasna's RPC returned a 600+ block range without complaint. (Observed 2026-11-19)
- **`cast call` decorates big numbers**, e.g. `1795126045 [1.795e9]`. Strip ` [..]` before arithmetic, or use `--json`.
- **zsh doesn't word-split unquoted variables.** Run multi-field shell loops under `bash -c`.
- **Measured costs (n = 4 loops):** about 0.015 lREACT per payment reaction at 100 gwei Lasna gas; about 0.0000013 ETH per callback on Base Sepolia. Deploying AnnalReactive cost about 0.095 lREACT. (E-003)

- **Lasna RPC caps `eth_getLogs` at 30,000 blocks** (error -32012, `maxAllowedRange: 30000`, observed 2026-11-20). `readLineTrail` binary-searches Lasna for the block nearest a line's time, then queries 600 blocks.
- **Next 16 + Cache Components:** `RouteContext` only exists after typegen, so route params are typed explicitly. A `notFound()` inside `<Suspense>` streams the not-found UI with HTTP 200, because the shell is already sent.
- **Tailwind preflight removes list markers.** Restore `list-style` where a list should show bullets.
- **All three source RPCs, Lasna and Blockscout send CORS headers** (`*`, or the deployed origin), so the receipt check and the explorers' view run in the reader's browser (checked 2026-11-20).

## Vercel (Lekan's account)
- Project `lekan6/annal`, production alias https://annal-sooty.vercel.app, deployed by Vercel's GitHub app on every push to `main`.
- The CLI login for Lekan lives in its own config dir, `~/.config/vercel-lekan`, so the operator's global login stays untouched. Use `npm run vercel:lekan -- <command>` (e.g. `ls`, `inspect <url>`). The repo is linked (`.vercel/`, gitignored).
- Vercel MCP server added at user scope (`https://mcp.vercel.com`). It needs a one-time `/mcp` sign-in. The Vercel plugin (`vercel-plugin@vercel`) is installed at user scope and loads after a Claude Code restart.

## Environment
| Var | Purpose | Where to get it |
|---|---|---|
| `LASNA_RPC`, `SEPOLIA_RPC`, `BASE_SEPOLIA_RPC`, `UNICHAIN_SEPOLIA_RPC` | RPC endpoints | table above |
| `ANNAL_ACCOUNT` | Foundry keystore account name (`annal-deployer`) | D-004 |
| `ANNAL_PW_FILE` | Path to the keystore password file (outside the repo) | operator |

## Funding routes (testnet)
| Route | Contract | Source | Notes |
|---|---|---|---|
| Sepolia ETH → lREACT | `request(address receiver)` payable on `0x9b9BB25f1A81078C544C829c5EB7822d747Cf434` (Ethereum Sepolia) or `0x2afaFD298b23b62760711756088F75B7409f5967` (Base Sepolia) | reactive-mainnet.mdx + `ReactiveFaucetL1.sol` | 1 ETH → 100 lREACT. Each request is capped at `max_payout()`, and the excess is kept, so read the cap before sending |
| Sepolia ETH → Base Sepolia ETH | L1StandardBridge `0xfd0Bf71F60660E2f608ed56e1659C450eB113120` (Ethereum Sepolia) | docs.base.org base-contracts (read 2026-11-19) | OP Stack deposit, a few minutes |
| Sepolia ETH → Unichain Sepolia ETH | L1StandardBridgeProxy `0xea58fcA6849d79EAd1f26608855c2D6407d54Ce2` (Ethereum Sepolia) | ethereum-optimism/superchain-registry `superchain/configs/sepolia/unichain.toml` (read 2026-11-19) | OP Stack deposit |

## Accounts (testnet only)
| Role | Address | Keystore |
|---|---|---|
| Deployer, and the client who pays in the demo | `0x4713b56012F67a84114D6a65Cd8924E7850b691E` | `annal-deployer` |
| Freelancer who owns the demo book | `0xa7D557BF0C7312EAF186a6A81159a3650aA77444` | `annal-freelancer` |
