# State
_Last verified: 2026-11-21 15:35 UTC at efdbae7_

**Thesis:** One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it. (Copy near it names Ethereum, Base and Unichain Sepolia.)
**Milestone:** M5 · Submitted on DoraHacks 2026-11-21 (deadline 2026-12-05 20:00 UTC). · Results: not announced.
**Next action:** keep the demo path live through judging: AnnalReactive funded (≥ 1 lREACT, debt 0), the app and video reachable. Push only fixes; the repo as submitted is the commit before any later push.
**Blocked on:** nothing on our side.

## Works (verified 2026-11-21)
| Capability | Verified by | Evidence |
|---|---|---|
| Full loop on three chains: USDC paid on Ethereum, Base, Unichain Sepolia → Lasna reactive tx → Base Sepolia callback writes one line | receipts read on-chain; README verify block run verbatim | E-002, E-005, E-014 |
| Open a book with no admin step; Reactive confirms in 1–2 s | fresh wallets on production (open flow and film take) | E-005, E-008, E-012 |
| Latency: 24/24 printed, fields equal the origin receipt, median 1 s, max 3 s | `npm run harness:latency` | E-009 |
| Refusals: look-alike "USDC" never printed; owner's forged `record` reverts `NotAuthorized` | `isSource(lookalike)=false`; live `cast call` revert; mined tx status 0 | E-004, E-014 |
| Contracts source-verified, exact match (Sourcify both; Blockscout AnnalBook) | Sourcify v2 API | E-010 |
| Watcher funded: AnnalReactive 10.89 lREACT, debt 0; AnnalBook debt 0 on the proxy (≈ 740 payments of runway) | cast reads | E-011, E-014 |
| App in production: job-first hero, statement pages, in-browser receipt check across fallback RPCs (demo book 3/3), link previews, app icon, no sideways scroll at 360–1440 | headless browser on production, console clean | E-013, E-014 |
| README is the proof surface; every factual sentence has a verified claims row (C-1…C-10) | links 200; verify block verbatim; clean-clone `forge test` 21 passed | E-014 |
| Submission film 2:29.8, real transactions on camera, own score and effects, exact captions | contact sheet, 0 silences, plays logged out | E-012, E-014 |
| Gate: lint (0 warnings), typecheck, build, forge fmt/lint/build, 21 tests | `npm run gate` | every commit today |

## Deployed
| What | Network | Address / URL | Last checked |
|---|---|---|---|
| AnnalReactive | Reactive Lasna (5318007) | `0x653B62A39Aea06998c152b48F150175B2645c8Bd` | 2026-11-21 15:12 UTC |
| AnnalBook | Base Sepolia (84532) | `0x653B62A39Aea06998c152b48F150175B2645c8Bd` (0.00394 ETH, debt 0) | 2026-11-21 15:12 UTC |
| LookalikeUSDC (demo only) | Base Sepolia | `0x4D2579b6E0f6273618Cd95Ff57Ae07653E9106Ca` | 2026-11-19 |
| Web app | Vercel production (`lekan6/annal`) | https://annal-sooty.vercel.app (c27678c) | 2026-11-21 15:20 UTC |
| Demo book (3 lines) | — | `0xa7D557BF0C7312EAF186a6A81159a3650aA77444` | 2026-11-21 |
| Lived-in book (31 lines) | — | `0x219B05463962bCc922f1ce3d7fB0374BD501bDD5` | 2026-11-21 |
| Film | YouTube, unlisted | https://youtu.be/Hb0ndXJAirs | 2026-11-21 |

## Broken, limited or unverified
- CI is manual-only (D-011, billing lock); the gate of record is `npm run gate` locally.
- Basescan (Etherscan) shows AnnalBook unverified (needs an API key); links use Blockscout instead.
- The book page scrolls 13 px sideways at 320 px wide (the dot-matrix total); clean from 360.
- Anyone can open a book, and zero-value USDC transfers to a watched wallet cost the shared watcher (C-10, from source; not exercised on-chain).
- Captions attached to the new video: unverified (the project lead's step).
- This machine's terminal can't reach Vercel's IPs; production checks run through the browser.

## Where things are
- Submission draft: `internal/SUBMISSION.md` · benchmark: `internal/benchmarks/2026-11-21-7ca9898.md` · film source: `internal/film/` (shoot, compose, sfx, score, render; `FILM_CHROME` = Playwright's headless shell).
- Latest decisions: D-011 (CI manual, source verified), D-012 (UI pass), D-013 (benchmark fixes, hero leads with the job, not-doing list).
