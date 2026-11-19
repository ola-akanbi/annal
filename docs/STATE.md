# State
_Last verified: 2026-11-19 21:38 UTC at the foundation commit_

**Thesis:** One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it.
**Milestone:** M0 · Rigged (checkpoint 2026-11-21 10:44 UTC) · **Deadline:** 2026-12-05 20:00 UTC (time left: the clock line)
**Next action:** fund the deployer `0x4713b56012F67a84114D6a65Cd8924E7850b691E` on Base Sepolia, Ethereum Sepolia and Unichain Sepolia, plus lREACT and Circle USDC. Then run the M0 spike: deploy AnnalReactive on Lasna and AnnalBook on Base Sepolia, open a book, and send one USDC payment on two chains (PLAN M0).
**Blocked on:** testnet funds for the deployer (since 2026-11-19). Plan once Sepolia ETH lands: bridge to Base Sepolia (`0xfd0B…3120`) and Unichain Sepolia (`0xea58…4Ce2`), buy lREACT from the faucet (1 ETH → 100), and get USDC on all three chains (docs/CONTEXT.md, Funding routes).

## Works (verified this session)
| Capability | Verified by | Evidence |
|---|---|---|
| Contracts compile on solc 0.8.29 against reactive-lib-omni `3ade0dc` | `forge build --sizes` (AnnalBook 4,834 B, AnnalReactive 3,200 B runtime) | local run 2026-11-19 |
| Contract logic: open → watch every chain → copy → write; fake USDC never copied; forged, wrong-sender, unknown-source and unopened writes refused; duplicates written once | `forge test`: 20 passed, incl. 256-run fuzz. The system contract is a recorder in tests only | local run 2026-11-19 |
| Contracts gate | `forge fmt --check`, `forge lint --deny warnings` exit 0 | local run 2026-11-19 |
| App floor: thesis h1 server-rendered, link previews, no FAIL lines | starter self-test `ui-audit.mjs` on localhost (25 PASS) | `internal/design/audit/rig/` |
| App lint (zero warnings) + typecheck | `npm run lint -- --max-warnings=0`, `npm run typecheck` | local run 2026-11-19 |

## Deployed
| What | Network or environment | Address / URL | Last checked |
|---|---|---|---|
| nothing yet | — | — | — |

## Broken or unverified
- **Real subscribe/callback cost and the gas of `react()` on open** (three `subscribe` calls + one callback, under the 900k cap): unverified until the spike. Unit-test gas uses a recorder, not the real system contract.
- `CALLBACK_GAS_LIMIT = 400_000` hasn't been checked against the Base Sepolia proxy's `_extraGas` / `_maxChargeGas`.
- The Lasna faucet ratio and per-request cap haven't been read.
- GitHub: `github.com/ola-akanbi/annal`, **public** since 2026-11-19 (D-006). **CI can't run: GitHub says "The job was not started because your account is locked due to a billing issue"** (run 44622607530, both jobs, after the switch to public). The account owner must clear it at github.com/settings/billing. Until then `npm run gate` locally is the gate of record.

## Claims not yet verified
- C-1 thesis, C-2 "nobody can write a line by hand", C-3 "fake USDC is never written". All need on-chain evidence from M0/M2 (docs/EVIDENCE.md).

## Open questions
- Clear the GitHub billing lock on `ola-akanbi` so CI runs (operator).
- Can related builders submit separate BUIDLs, and when are results announced? (organizers, via DoraHacks Q&A)
- Vercel account for the deployment: the CLI here is logged in as the operator's account, and Lekan's GitHub has the Vercel app installed (a Vercel check is queued on main). Which account owns the project? (operator)
