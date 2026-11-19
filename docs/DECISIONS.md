# Decisions
Append-only. To change a decision, add a new entry that supersedes it.

## D-001 · Build Annal for the Set It and Forget It track · 2026-11-19 · accepted
**Context:** Reactive Omni Buildathon, three tracks (Every Second Counts $2,000/$250, Set It and Forget It $2,000/$250, Reactive Meets AI $1,000). Rubric: four equal criteria scored 1–5 (Execution, Integration, Usefulness, Craft). Execution requires reactive transactions and their callbacks on-chain.
**Decision:** Annal, an income book across chains. One ownerless reactive contract on Lasna watches Circle USDC `Transfer` events to registered wallets on Ethereum Sepolia, Base Sepolia and Unichain Sepolia, and writes each one as a line in a book on Base Sepolia. Each line carries the origin chain ID, transaction hash and log index. Thesis: "One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it."
**Alternatives:**
- A reserve router in Every Second Counts. Rejected on fit: it doesn't use Reactive's watch-every-chain subscription as directly.
- A price alert for LP positions. Rejected: an alert needs an off-chain notifier, which removes the point of using Reactive.
- An AI event interpreter. Rejected: the AI track's prize pool is half the size, and the model would only be decoration.
- A plain portfolio viewer. Rejected: off-chain trackers already do that for free. A book that only on-chain events can write is something they can't offer.
**Consequences:**
- The book must have no owner-controlled write path.
- The reactive contract must be ownerless and source-verified.
- The UI must re-check every line against the origin chain.
- Revisit if the M0 spike shows subscriptions can't deliver from two or more origin chains.
**Evidence:** internal/research/DOSSIER.md (Decision, Thesis, §2, §4, §7).

## D-002 · Testnet only: Lasna + Ethereum/Base/Unichain Sepolia · 2026-11-19 · accepted
**Context:** The track allows Reactive mainnet or Lasna. The project lead asked for testnet.
**Decision:** Reactive Lasna (5318007) for the reactive contract. Base Sepolia (84532) holds the book. Origins are Ethereum Sepolia (11155111), Base Sepolia and Unichain Sepolia (1301), using Circle's testnet USDC.
**Alternatives:** Mainnet, rejected because it spends real funds and wasn't requested.
**Consequences:** The limits section must say testnet only. Evidence needs durable captures, because testnets can reset.
**Evidence:** Chain IDs and callback proxy bytecode checked 2026-11-19 (docs/CONTEXT.md).

## D-003 · Stack: Next.js app at the root, Foundry contracts, TypeScript harness · 2026-11-19 · accepted
**Context:** Judges and AI screens read the server-rendered HTML first, and the statement has to be linkable per wallet.
**Decision:**
- The Next.js app from `~/Documents/hackathons/_starter/start.sh` sits at the repo root (server-rendered thesis, link previews, CI, first-screen audit).
- Solidity 0.8.29 + Foundry in `contracts/`, on `reactive-lib-omni`.
- A TypeScript harness in `harness/` sends real payments and measures and captures each loop.
**Alternatives:** A Vite SPA, as Ripcord used. Rejected: it renders nothing without JavaScript.
**Consequences:** `contracts/` and `harness/` are excluded from the web app's lint and typecheck, and each has its own gate.
**Evidence:** Starter README; reactive-contracts.mdx (`pragma solidity ^0.8.29`).

## D-004 · Deployer key in an encrypted Foundry keystore outside the repo · 2026-11-19 · accepted
**Decision:** Testnet deployer `0x4713b56012F67a84114D6a65Cd8924E7850b691E`, keystore account `annal-deployer`. The password file lives outside the repo in the operator's home directory. Scripts use `--account annal-deployer --password-file "$ANNAL_PW_FILE"`. No private key in any env file, commit or log.
**Consequences:** The key is testnet only and never funded on mainnet.

## D-005 · Repo private until submission week · 2026-11-19 · accepted
**Context:** Rules: "Repositories need to be public and open-source by the time you submit." The idea is in an open lane, and competitors can copy it during the window.
**Decision:** `github.com/ola-akanbi/annal` stays private until the M4 freeze (2026-12-03 20:00 UTC), then goes public with an MIT licence before M5. Remote over HTTPS, with a repo-local `url.insteadOf` so pushes use the `ola-akanbi` credentials.
**Consequences:** CI on a private repo depends on the account's Actions minutes. The first run failed at startup with zero jobs (run 44621076324), cause not yet known. Until it's fixed, the local gate (`npm run gate`) is the gate of record. Revisit if Actions can't run privately: making the repo public earlier is the alternative.

## D-006 · Repo public from now on · 2026-11-19 · accepted · supersedes D-005
**Context:** The project lead asked to make the repo public. The private repo's Actions runs failed at startup with zero jobs (D-005).
**Decision:** `github.com/ola-akanbi/annal` is public and MIT-licensed from 2026-11-19. The rules require public and open source by submission, so this only brings that forward.
**Consequences:** Every commit message and file is visible to competitors and judges from now on (protocol: commit messages are public). Strategy stays in `internal/` (gitignored). CI should now run on public-repo minutes; the next push confirms it.

## D-007 · Visual world: the Register Roll · 2026-11-19 · accepted
**Context:** The statement page is a Read surface: a skeptical reader with no wallet must trust and check it. Impeccable's roll (seed:c8c4210e20f0a980) assigned candidate 6 of 7 grounded directions.
**Decision:** The project lead chose the assigned Register Roll on the decision page: a thermal till roll on a dark register-green counter, numbered printed lines, tick and strike check marks, tabular figures, the total as the only display figure, one roll-end pink accent. Direction contract: `.impeccable/surfaces/src-app-book-address-page-tsx.md`. Sketch: `.impeccable/mocks/decision/assigned.html`.
**Alternatives:** Passbook (Impeccable's pick; closest to the familiar leather-ledger look). The category-standard bank portal (looks editable, like every bank). Six catalog challengers, all declined, each donating one discipline (numbering, arrival, single display figure, marks for state, tabular figures, palette commitment).
**Consequences:** Code-led build (Read surfaces always are). No crypto-dashboard devices anywhere. The final review audits the build against the sketch and contract, and DESIGN.md is written from the built world at finish.
