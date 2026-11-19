# State
_Last verified: 2026-11-19 22:25 UTC at 3c41d8e_

**Thesis:** One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it. (Claims table: qualified. Copy must name Ethereum, Base and Unichain Sepolia.)
**Milestone:** M0 · Rigged (checkpoint 2026-11-21 10:44 UTC) · **Deadline:** 2026-12-05 20:00 UTC (time left: the clock line)
**Next action:** design bar + `impeccable shape` for the statement page (PLAN M0). Then deploy the app to Vercel (account to be chosen by the operator).
**Blocked on:** nothing for contracts. The Vercel account choice is open.

## Works (verified this session)
| Capability | Verified by | Evidence |
|---|---|---|
| Open a book → Lasna subscribes on 3 chains → confirmation lands on Base Sepolia, no admin step | `open()` by the freelancer; `watchingSince` set 1 s later; `watching(freelancer)` true on Lasna | E-005 loop 1 |
| Real USDC payment on Base, Unichain and Ethereum Sepolia → one line each in one book, fields copied exactly | 3 × 1 USDC transfers; `lineAt(freelancer, 0..2)` read back; totalReceived 3,000,000 | E-002, E-005 |
| Origin → book in 1 s (Base, Unichain) and 3 s (Ethereum Sepolia), n = 1 each | block timestamp vs `writtenAt` | E-002 |
| Look-alike "USDC" (500) never written | book still 3 lines after 30 s | E-004 |
| Owner's forged `record` refused on-chain | tx `0x7e5721dc…` status 0, `NotAuthorized` | E-004 |
| Costs: ~0.015 lREACT per payment, ~0.0000013 ETH per callback, no debt | balances read on Lasna and Base | E-003 |
| Contracts gate: 21 tests, lint with warnings denied, fmt check | `npm run gate:contracts` | E-006 |
| App floor: thesis h1 server-rendered, link previews, no FAIL lines | starter self-test `ui-audit.mjs` on localhost | `internal/design/audit/rig/` |

## Deployed
| What | Network | Address | Last checked |
|---|---|---|---|
| AnnalReactive | Reactive Lasna | `0x653B62A39Aea06998c152b48F150175B2645c8Bd` (1.44 lREACT, debt 0) | 2026-11-19 22:20 UTC |
| AnnalBook | Base Sepolia | `0x653B62A39Aea06998c152b48F150175B2645c8Bd` (0.00399 ETH, debt 0) | 2026-11-19 22:20 UTC |
| LookalikeUSDC (demo only) | Base Sepolia | `0x4D2579b6E0f6273618Cd95Ff57Ae07653E9106Ca` | 2026-11-19 22:15 UTC |
| Demo book owner (freelancer) | — | `0xa7D557BF0C7312EAF186a6A81159a3650aA77444`, 3 lines | 2026-11-19 22:20 UTC |

## Broken or unverified
- **CI can't run:** the `ola-akanbi` account is locked for a billing issue (run 44622607530 annotation). The operator accepted the local gate (`npm run gate`) as the gate of record.
- Contracts aren't source-verified on any explorer yet (Blockscout/Sourcify for Base Sepolia; check whether Lasna's explorer supports verification).
- Latency is n = 1 per chain. Needs ≥ 20 runs before any public number (M2, via `harness/`).
- No UI reads the book yet. The app is still the starter floor.

## Claims not yet verified
- C-1 qualified (chains must be named; "links back" not yet in the UI). C-4 qualified (n too small). C-2, C-3 verified. See docs/EVIDENCE.md.

## Open questions
- Which Vercel account owns the deployment? (operator)
- Can related builders submit separate BUIDLs, and when are results announced? (organizers, via DoraHacks Q&A)
