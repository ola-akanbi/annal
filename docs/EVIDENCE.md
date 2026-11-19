# Evidence
Every public claim, and the proof behind it. Proofs are append-only. Claims are re-checked against live state before anything is published.

## Claims
| # | Claim (verbatim) | Appears in | Proof | Status | Checked |
|---|---|---|---|---|---|
| C-1 | One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it. | README h1, repo description, site h1, form, video close | E-002, E-005 | qualified: on testnet the book covers every Reactive testnet origin that has Circle USDC (Ethereum, Base and Unichain Sepolia). Copy must name the chains near the claim. "Links back" is proven in data (each line stores chain, tx hash and log index) but not yet in the UI (M1) | 2026-11-19 |
| C-2 | Nobody can write a line by hand, including the book's owner. | README, site | E-004, E-006 | verified: the owner's direct `record` was mined and reverted with `NotAuthorized` (E-004). The proxy path from any other reactive contract, unknown sources and unopened books are refused in tests (E-006). The contracts have no owner or admin function | 2026-11-19 |
| C-3 | A fake "USDC" token sent to the wallet is never written. | README, video | E-004 | verified for one look-alike (`name` "USD Coin", `symbol` "USDC", 6 decimals) on Base Sepolia: book unchanged at 3 lines 30 s later. Also refused at the book layer in tests (E-006) | 2026-11-19 |
| C-4 | A payment shows up in the book about a second after its block. | README, video | E-002, E-005 | qualified: n = 3 payments + 1 open. Base Sepolia 1 s, Unichain Sepolia 1 s, Ethereum Sepolia 3 s, open → watching 1 s. Measured from the origin block timestamp to the line's `writtenAt` (both whole seconds). A latency claim needs ≥ 20 runs (M2) | 2026-11-19 |

## Proofs
| # | Date | Claim | Proof | Commit |
|---|---|---|---|---|
| E-001 | 2026-11-19 | Deployer funded: lREACT faucet + Base/Unichain bridge deposits | `docs/evidence/E-001-funding-txs.txt` (4 Ethereum Sepolia txs, all status 1) | — |
| E-002 | 2026-11-19 | One book, three chains: 1 USDC paid on each of Base, Unichain and Ethereum Sepolia became lines #0–#2, fields copied exactly (incl. Sepolia log index 223) | `docs/evidence/E-002-first-three-payments.txt` + receipts below | — |
| E-003 | 2026-11-19 | Running cost after 4 loops: AnnalReactive spent 0.0603 lREACT (~0.015 per payment), the book spent 0.0000052 ETH, no debt on either side | `docs/evidence/E-003-costs-after-4-loops.txt` | — |
| E-004 | 2026-11-19 | Reversal: look-alike "USDC" payment of 500 never written. Owner's forged `record` mined and reverted | `docs/evidence/E-004-lookalike-and-forgery.txt` · receipts `lookalike-payment-base-0x811b5dcc.json`, `forged-record-base-0x7e5721dc.json` (status 0) | — |
| E-005 | 2026-11-19 | Full loops, origin → Lasna reactive tx → Base callback (table below) | `docs/evidence/receipts/loop*.json` | — |
| E-006 | 2026-11-19 | 21 Foundry tests pass (forgery, wrong reactive sender, unknown source, fake USDC, unopened book, duplicates, 256-run fuzz); lint with warnings denied exits 0 | `npm run gate:contracts` (local; CI blocked by an account billing lock) | — |

### E-005 loops (all status 1)
| Loop | Origin | Reactive (Lasna) | Callback (Base Sepolia) | Origin → book |
|---|---|---|---|---|
| Open book | Base `0x76135bbc2e51e01405d8b2c9215b5130b6ee8c4f7cd31cce7786473e542dfbb0` | `0xdd4dccbbaf8ca448ac552136dbbfe331e12d7d1b38dd7380dd213d734d6388fa` | `0xd894bc44f80814b5ca95c633ca210d7d9f3fcf1729b168c37225f0726a5933e1` | 1 s (8 blocks) |
| 1 USDC, Base Sepolia | `0xc2a4ea51d5862f2436c559edfc4f06f54c1aef04200162cb48c3f981fe3d963f` | `0x8c0c16ffcc4c0bb15325bb6731a1ac114e198d9c4c3c4bfa82d690709c3bd7d7` | `0xfe416c8a8900ee717631c953797f7ae50e77930b76ce5c5ace9d7557cbcd2b43` | 1 s (5 blocks) |
| 1 USDC, Unichain Sepolia | `0xe86c31fe81adb62d36fade316ae3a735a5e0cfbd668f1570e5d5dfe7dc928f72` | `0x37fdfcefa0cfdbe349276a3108fc156d7d037d87fadc2ecd332384b0e4b033a2` | `0xd475c679eb10029e02ca958ee9acf701f5956a0f77f528971ce9097b98ca1632` | 1 s |
| 1 USDC, Ethereum Sepolia | `0x887310bc0673f6d4b3aae5fe4cb4e7b634b002fc63818bbc3b78e592d3fa3522` | `0x308d35c722d1862f6ebca6e42757978b10d3fc05c3f96f3354fdf070149b6052` | `0x84874b2c970f0b3dbf87a18c0996f7c8e55d7b24e823fe2249a704a3cfc736af` | 3 s |
