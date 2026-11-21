# Plan
Build window: 2026-11-05T12:00Z → 2026-12-05T20:00Z
Started: 2026-11-19T20:22Z
Deadline source: https://dorahacks.io/hackathon/reactive-omni-buildathon/detail (deadline listed as 2026/12/05 21:00 UTC+1). Buffer: 10% of the window, at least 2 hours and at most 24. Freeze: 80% of the window, or 48 hours before the deadline, whichever is later.

All checkpoints count from `Started:`.

| # | Milestone | When | Exit criteria (a stranger could check these) | Due | Status |
|---|---|---|---|---|---|
| M0 | Rigged | 10% | D-001 recorded; the riskiest dependency spiked with evidence: one Lasna subscription delivers a Circle USDC `Transfer` from at least two origin chains, and its callback lands on Base Sepolia; the app deployed to Vercel; design direction locked before any UI code: the category's best interfaces captured into `internal/design/bar/` and `impeccable shape` run | 2026-11-21 10:44 UTC | in progress |
| M1 | Walking skeleton | 40% | Opening a book on Base Sepolia makes the ownerless reactive contract subscribe for that wallet, with no admin step. A real USDC payment on any of the three chains becomes a line in the book. The deployed statement page renders that line from the chain and re-checks it against the origin receipt. The signature component is chosen from three variants | 2026-11-26 05:49 UTC | |
| M2 | Core claim | 65% | Payments on Ethereum Sepolia, Base Sepolia and Unichain Sepolia all land in one book. Every line links to its origin transaction and passes the receipt re-check. Reversal beat: a fake "USDC" token sent to the wallet is never written, on camera. A forged `record` call that doesn't come through the proxy is refused on-chain. Latency is measured over ≥ 20 payments | 2026-11-30 05:44 UTC | |
| M3 | UI pass | 75% | `impeccable critique` and `polish` findings fixed; motion pass done; `ui-audit.mjs` shows no FAIL lines on the deployed app; the first screen scores 3 on benchmark's first-screen dimension against the best reference | 2026-12-01 20:05 UTC | |
| M4 | Proof surface | freeze | README proof section; every claim has a verified row in the claims table; demo video (< 3 min) recorded on the finished UI; benchmark run | 2026-12-03 20:00 UTC | |
| M5 | Submitted | deadline − buffer | DoraHacks form submitted with the verbatim thesis, contract addresses and full-loop transaction hashes; repo public and open source; preflight passed from a phone on cellular | 2026-12-04 20:00 UTC | |

## Work items (sprint profile)
### M0 · Rigged
- [x] Foundry project in `contracts/` on Solidity 0.8.29 with `reactive-lib-omni` and forge-std pinned. Done when `forge build` and `forge test` are green.
- [x] Deployer funded on Lasna, Ethereum Sepolia, Base Sepolia and Unichain Sepolia, with USDC on all three. Done when the balances are captured in `docs/evidence/`. → E-001
- [x] Spike: a minimal reactive contract on Lasna subscribed to Circle USDC `Transfer` to a test wallet on two chains, calling back a recorder on Base Sepolia. Done when E-00n holds the origin tx, reactive tx and callback tx for each chain, plus the lREACT spent per reaction. → Done with the real contracts on three chains, not a minimal one: E-002, E-003, E-005. The M2 reversal beat and forgery refusal also landed early: E-004
- [x] App deployed to Vercel from the GitHub repo (Lekan's account): https://annal-sooty.vercel.app serves the thesis h1. `ui-audit.mjs` can't reach Vercel from this machine's terminal; it runs through the browser at M3.
- [x] Design direction locked through `impeccable shape`: PRODUCT.md, a decision round, the Register Roll chosen (D-007), direction contract in `.impeccable/surfaces/`.

### M1 · Walking skeleton
- [x] Statement page `/` and `/book/[address]` server-rendered from AnnalBook, re-read live. → E-007
- [x] Each line opens to its trail (origin, Lasna reaction, Base callback) and is re-checked against the origin receipt in the reader's browser. → E-007
- [x] Explorers' view: transfers the book didn't print, with the reason (look-alike shown struck). → E-007
- [x] Open flow wired (connect, switch to Base Sepolia, `open()`) and exercised end to end on production with a fresh wallet: open → confirmed in 2 s → first payment printed live. → E-008
- [ ] Signature component chosen from three variants (`impeccable generate 3`). Deferred: the roll was locked on the decision page (D-007); variants of the line treatment come at the M3 UI pass.
- [ ] Phone and tablet re-verified after every UI change (done for this build: `mobile-2.png`, `tablet-2.png`).

### M2 · Core claim
- [x] Latency measured over ≥ 20 payments: 24 real payments, 8 per chain, 24/24 printed with fields matching; median 1 s, max 3 s. → E-009
- [x] Contracts source-verified: Sourcify exact match on both, Blockscout on Base Sepolia; linked from the site. Basescan pending an Etherscan API key. → E-010
- [x] Top up AnnalReactive before the demo and the video: 11.00 lREACT, about 750 payments. → E-011

### M3 · UI pass
- [x] `impeccable critique` (dual-agent, 23/40) and polish of every priority issue, verified in production. → D-012, commit bee55ab
- [x] Re-checked by the cold-judge benchmark instead (E-013); the stats band stays (D-013).

### M4 · Proof surface
- [x] README proof section: every factual sentence backed by a claims row re-checked live today (C-1–C-8). → README.md
- [x] Run of show and film script, every line tied to a verified claim. → docs/RUNOFSHOW.md, docs/VIDEO.md
- [x] Demo video rendered: 2:29.8 on the finished UI, real transactions (E-012).
- [x] Uploaded unlisted, plays logged out, embedded in the README: https://youtu.be/Hb0ndXJAirs (E-014).
- [x] Benchmark run: cold judges 15/20, AI screen pass, fixes shipped (E-013, D-013).
- [x] Preflight passed (E-014).
- [x] Submitted on DoraHacks 2026-11-21 by the project lead, from `internal/SUBMISSION.md`.

## Cut list
Things deliberately not being built. Each entry links the DECISIONS entry that cut it.
- Mainnet deployment (testnet only), per D-002.
