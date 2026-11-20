# State
_Last verified: 2026-11-19 22:25 UTC at 3c41d8e_

**Thesis:** One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it. (Claims table: qualified. Copy must name Ethereum, Base and Unichain Sepolia.)
**Milestone:** M1 · Walking skeleton (checkpoint 2026-11-26 05:49 UTC). M0 closed. · **Deadline:** 2026-12-05 20:00 UTC (time left: the clock line)
**Next action:** exercise the open flow with a real browser wallet on a fresh address (open → Reactive confirms → first payment prints live), then build `harness/` for the ≥ 20-payment latency run (M2).
**Blocked on:** nothing.

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
| Landing page in production (live-ticker hero from the newest real payment, ticker, live stats, animated three-chain flow with real tx links, look-alike comparison, audiences, contracts and verify command, final call to action) + glass nav with icons, full-colour brand (D-008) | browser on https://annal-sooty.vercel.app at 1440 and 390 wide, every section rendered, no horizontal scroll, console clean | commit 074b520 |
| Book page redesign in production (D-009): identity band, live stats incl. 3/3 verified, dot QR share card, printer head (state: watching), verified stamp, chain split, newest line's trail timed +0/+1/+3 s; Doto dot-matrix figures; no GitHub links | browser on https://annal-sooty.vercel.app/book/0xa7D5…7444 at 1440 and 390 wide, console clean | commit 674970b |
| Statement page in production: server-rendered roll, live re-reads, per-line trail, in-browser receipt check (3/3 ticked), explorers' view showing the look-alike struck | browser on https://annal-sooty.vercel.app at 1440, 900 and 390 wide; console clean | E-007 |

## Deployed
| What | Network | Address | Last checked |
|---|---|---|---|
| AnnalReactive | Reactive Lasna | `0x653B62A39Aea06998c152b48F150175B2645c8Bd` (1.44 lREACT, debt 0) | 2026-11-19 22:20 UTC |
| AnnalBook | Base Sepolia | `0x653B62A39Aea06998c152b48F150175B2645c8Bd` (0.00399 ETH, debt 0) | 2026-11-19 22:20 UTC |
| LookalikeUSDC (demo only) | Base Sepolia | `0x4D2579b6E0f6273618Cd95Ff57Ae07653E9106Ca` | 2026-11-19 22:15 UTC |
| Web app (landing `/` + book `/book/[address]`) | Vercel production, `lekan6/annal` | https://annal-sooty.vercel.app (commit 674970b) | 2026-11-20 01:17 local |
| Demo book owner (freelancer) | — | `0xa7D557BF0C7312EAF186a6A81159a3650aA77444`, 3 lines | 2026-11-19 22:20 UTC |

## Broken or unverified
- **CI can't run:** the `ola-akanbi` account is locked for a billing issue (run 44622607530 annotation). The operator accepted the local gate (`npm run gate`) as the gate of record.
- Contracts aren't source-verified on any explorer yet (Blockscout/Sourcify for Base Sepolia; check whether Lasna's explorer supports verification).
- Latency is n = 1 per chain. Needs ≥ 20 runs before any public number (M2, via `harness/`).
- The open flow hasn't been run with a real browser wallet yet.
- `ui-audit.mjs` hasn't run against production (this machine's terminal can't reach Vercel; the browser can).
- This machine's terminal can't reach Vercel's IPs (216.198.79.3, 64.29.17.3; connect timeout even outside the sandbox), but a browser can. Run production audits through the browser.

## Claims not yet verified
- C-1 qualified (chains must be named; "links back" not yet in the UI). C-4 qualified (n too small). C-2, C-3 verified. See docs/EVIDENCE.md.

## Open questions
- Can related builders submit separate BUIDLs, and when are results announced? (organizers, via DoraHacks Q&A)
