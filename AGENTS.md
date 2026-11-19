# Annal — build rules and pinned context

One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it.

**Read `docs/STATE.md` first.** It is the current truth: what works, what's deployed, what's next.
Research and strategy live in `internal/` (gitignored). The verified facts about every dependency live in `docs/CONTEXT.md`. Read it before touching an integration.

## Repo layout

```
src/            Next.js app (App Router): the statement pages, server-rendered from the chain
contracts/      Foundry: AnnalReactive (Reactive Lasna) + AnnalBook (Base Sepolia)
harness/        TypeScript scripts that send real payments, measure each loop and capture evidence [M1]
docs/           STATE, PLAN, DECISIONS, EVIDENCE, CONTEXT (see the protocol below)
internal/       research, strategy, film, audits (gitignored, never commit)
```

Run everything from the root: `npm run dev` · `npm run lint` · `npm run typecheck` · `npm run build` · `npm run gate:contracts` · `npm run gate` (all of it).

## Pinned versions

Looked up on 2026-11-19, never from memory. Re-check before any upgrade.

| | Pinned |
|---|---|
| Node | 26.x (local 26.7.0; current LTS line 26, latest 26.13.1) |
| Next.js | 16.4.6, from `create-next-app@latest` on 2026-11-19. **Next 14 and 15 APIs must not appear.** |
| React | 19.3.0 |
| TypeScript | 5.9.3 (the version eslint-config-next accepts) |
| ESLint | 9.39.5 |
| Tailwind CSS | 4.3.3 |
| Solidity | 0.8.29 (what Reactive Omni targets) |
| Foundry | 1.8.3 locally and in CI. 1.10.0 shipped 2026-11-19 and isn't adopted yet |
| forge-std | v1.17.0 (submodule) |
| reactive-lib-omni | commit `3ade0dcf1d27e67e5783ef807e73a1b9e0c0cce8` (2026-05-21, submodule). **The pre-Omni `reactive-lib` (RVM, `vmOnly`, dual deployment) must never appear** |

## Rules

1. **No mocks, no fake data, no demo mode.** Every rendered value comes from a real source. **AnnalBook on Base Sepolia is authoritative for lines.** The origin chain's transaction receipt is authoritative for whether a line is true. Lasna is authoritative for the reactive contract's health (reserves, debt). The only stand-in allowed is the system-contract recorder inside `contracts/test/`, which never reaches the app.
2. **Verify every contract and SDK call before writing it.** Solidity: `contracts/lib/reactive-lib-omni/src/**` and the docs pages cited in `docs/CONTEXT.md`. TypeScript: the installed `.d.ts` in `node_modules` (viem etc.). If a call can't be verified, stop and say so.
3. **Phase-gated.** Build the current milestone only, then stop for confirmation. Milestones and exit criteria are in `docs/PLAN.md`; the current one is in `docs/STATE.md`.
4. **Every write persists, and the UI shows the persisted row.** A line appears only once it's read back from AnnalBook, never from a pending transaction or a local guess.
5. **Tests cover failure paths:** forged writes, the wrong reactive contract, unknown tokens, duplicate deliveries, unopened books. The happy path alone doesn't close a milestone.
6. **No secrets in the repo.** The deployer is the Foundry keystore account `annal-deployer`. Scripts take `--account "$ANNAL_ACCOUNT" --password-file "$ANNAL_PW_FILE"`. Never a private key in an env file, a commit or a log. Blank-valued names only in `.env.example`.
7. **Never cut scope silently.** Cuts are the project lead's decision. Present the tradeoff on technical merit (trust model, what a judge can verify, latency) and record an accepted cut in `docs/DECISIONS.md`.
8. **No owner, no admin.** AnnalBook and AnnalReactive have no privileged role. Any change that adds one breaks the thesis and needs a DECISIONS entry first.

## Domain rules

- Amounts stay `bigint` in USDC base units (6 decimals) from the chain to the formatter. Format only at render time. No floats.
- Every rendered line shows its origin chain, payer, amount and a link to the origin transaction, and carries the result of the receipt re-check (`checked` / `mismatch` / `unchecked`). Never claim `checked` without having read the receipt.
- Time is read from block timestamps. Base Sepolia blocks are 200 ms, so never use block counts as time.
- Chain IDs, addresses and RPCs come from one module that mirrors `docs/CONTEXT.md`. No hard-coded address anywhere else.

## Frontend conventions

- Direction is set by `impeccable shape` at M0 and recorded in DECISIONS before any UI code. Until then the starter's floor stands: server-rendered thesis h1, link previews, signature component in the first HTML.
- Fonts through `next/font` only. Never `<link>` tags to font CDNs.
- Every animation checks `prefers-reduced-motion`.
- Async calls wrap in `try/catch` with a shared error state. A failure never strands a flow mid-action.

## Verification before any gate

| Part | Gate |
|---|---|
| App | `npm run lint -- --max-warnings=0` · `npm run typecheck` · `npm run build` |
| Contracts | `forge fmt --check` · `forge lint --deny warnings` · `forge build --sizes` · `forge test` (run from `contracts/`, or `npm run gate:contracts`) |

All green before any milestone closes. CI runs the same on every push, plus a gitleaks scan of the whole history.

## Where things live
| Concern | File |
|---|---|
| Current truth: what works, what's deployed, what's next | docs/STATE.md (read it first) |
| Time left and current phase | the clock line printed at session start (.claude/hooks/clock.mjs) |
| Milestones, the build window and its checkpoints | docs/PLAN.md |
| Work items | the checklist in docs/PLAN.md (sprint profile) |
| Why we chose what we chose | docs/DECISIONS.md (append-only) |
| Proof that things work, and every public claim it backs | docs/EVIDENCE.md (raw captures in docs/evidence/) |
| Demo script, video script, submission draft | docs/RUNOFSHOW.md, docs/VIDEO.md, internal/SUBMISSION.md |
| Verified facts about dependencies, and traps | docs/CONTEXT.md. Read it before touching any integration. |
| Research, strategy | internal/ (gitignored) |

## Operating protocol
- **Start:** read docs/STATE.md and the clock line, then the open work items for the current milestone and the last 3 entries of docs/DECISIONS.md. Say the next action back before starting.
- **Work:** one item at a time. A small commit to main that passes the gate, with the evidence in the message.
- **Commit messages are public from the first commit.** Say what changed and why, plainly. No competitor names or strategy, no remarks about judges, sponsors or other teams, no keys or private URLs, and no claim the claims table hasn't verified.
- **Parallel agents** only on independent items with their own acceptance criteria, each in its own git worktree, each merged only when its gate is green. Never two agents on the demo path at once.
- **Before publishing** a post, README change, submission or video: every factual sentence in it has a `verified` row in the claims table in docs/EVIDENCE.md, re-checked against live state today.
- **Finish** (or `/foundation handoff`): append EVIDENCE and DECISIONS, update CONTEXT and the claims table, close work items with evidence, rewrite docs/STATE.md, commit.
- **Truth rule:** never write a claim into STATE, README, an issue or a commit that wasn't verified this session. Write "unverified" instead.
- **Decisions:** never relitigate an accepted decision without new evidence; supersede it with a new entry.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
