# Annal: the submission film

**Limit:** under 3:00 (DoraHacks submission rule). **Target: 2:40**, leaving 20 s of margin.
**Judged from:** the submission only; the film is the demo. Rubric: Execution (reactive txs and callbacks on-chain), Integration (the reactive contract does real work), Usefulness (a problem real users have), Craft. Track: Set It and Forget It ("is this something you'd actually leave running?").
**Thesis, verbatim:** *One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it.*
**Tagline for the end card:** *Nobody types in this book.*
**Built with:** the film system in `internal/film/` (shoot → narration → captions → score → Remotion composition → master), content replaced, machinery kept.

Every spoken or captioned sentence carries a claim ID from [`EVIDENCE.md`](EVIDENCE.md). A sentence without a verified row is cut, not softened. Numbers that move (block, balances, delay of the live payment) are read off the captured frame, never typed from this page.

---

## Shot list

| # | Chapter (band title) | Time | Length |
|---|---|---|---|
| 0 | Hook card | 0:00 | 0:08 |
| 1 | The claim | 0:08 | 0:12 |
| 2 | How it works | 0:20 | 0:15 |
| 3 | Open a book | 0:35 | 0:25 |
| 4 | A payment prints itself | 1:00 | 0:30 |
| 5 | Follow the line | 1:30 | 0:20 |
| 6 | What it refuses | 1:50 | 0:25 |
| 7 | The reader has no wallet | 2:15 | 0:12 |
| 8 | Measured | 2:27 | 0:08 |
| 9 | End card | 2:35 | 0:05 |
| | **Total** | | **2:40** |

---

### 0 · Hook card (0:00–0:08)

**Frame:** ink background, amber type, no UI. Two lines, then two big figures in Doto.
> Paid in USDC on three chains.
> Can you prove it to your landlord?

Figures: **3** chains · **0** people who can edit the book.

**Voice:** "You're paid in USDC on three chains. Can you prove that income to someone who doesn't trust you?"
Claims: C-1 (three chains), C-2 (nobody can write a line).

### 1 · The claim (0:08–0:20)

**Shot:** the landing page in a browser frame, live URL `annal-sooty.vercel.app` in the address bar. Hold on the hero: the newest real payment set in dot-matrix ("1.00 USDC landed in the book N s after its block") beside the receipt card. Camera eases in on the thesis line.
**Caption / voice:**
- "Annal keeps one income book for every chain you're paid on."
- "Every line is copied from the payment's own log, and links back to it."

**Label:** `LIVE · annal-sooty.vercel.app`
Claims: C-1. The hero figure is read from the frame (C-4 wording: "seconds after its block").

### 2 · How it works (0:20–0:35)

**Shot:** the landing's flow diagram (the real mechanism: Ethereum, Base and Unichain Sepolia → Reactive on Lasna → the book on Base Sepolia), dots travelling. Camera pans left to right along the flow.
**Voice:**
- "A reactive contract on Lasna watches Circle's USDC on Ethereum, Base and Unichain for payments to your wallet."
- "When one lands, it calls back the book on Base Sepolia. Nothing else can write there."

Claims: C-1, C-2. Diagram is the real flow (README "How it works").

### 3 · Open a book (0:35–1:00): one continuous take

**Shot:** a fresh wallet (no book). Cursor clicks "Open your book" → the transaction is sent → the page lands on the new book showing "Opened · waiting for Reactive" → within about two seconds the status flips to **"Reactive is watching this wallet"**. Do not cut around the wait.
**Camera:** zoom to the status pill as it flips.
**Voice:**
- "Opening a book is one transaction. That's the only thing you ever do."
- "Seconds later, Reactive confirms it's watching. Nobody pressed a button."

**Label:** `real transaction · Base Sepolia` and, during the flip, `confirmed by Reactive · Lasna`
Proof cutaway (1 s): the `open()` tx on the explorer.
Claims: C-8 / E-008 (open → watching in 2 s on production, no admin step).

### 4 · A payment prints itself (1:00–1:30): the moment

**Shot:** split stage. Left, a terminal (large font, no paths to keys, no `.env`) runs one `cast send` of 1 USDC on **Unichain Sepolia** to the wallet. Right, the book. A beat after the terminal returns, **line No. 001 feeds out of the printer**: "Unichain Sepolia · printed in N s", tick mark. Then a second payment on **Base Sepolia** prints as No. 002.
**Camera:** start wide on both panes, push in on the roll as the line prints, hold 2 s.
**Voice:**
- "A client pays on Unichain."
- (line prints) "It's in the book. Written on Base, copied from Unichain's log."
- "Pay on Base, and it prints there too. Same book."

**Labels:** `real payments · Circle test USDC`, then the delay as read from the line (e.g. `printed 1 s after its block`).
Claims: C-1, C-4 ("seconds after its block"). Never send live on Ethereum Sepolia here (12 s blocks); its line appears in shot 5 from the demo book.

### 5 · Follow the line (1:30–1:50)

**Shot:** the demo book (3 lines, one per chain). Cursor opens line No. 003 (Ethereum Sepolia). The drawer shows the three steps: Paid on Ethereum Sepolia, Read by Reactive on Lasna, Written on Base Sepolia, with tx hashes, ending in the emerald "Checked in your browser" verdict. Cursor clicks the Lasna transaction; a pop-up window shows it on Reactscan.
**Camera:** zoom into the drawer until it fills the frame.
**Voice:**
- "Every line opens to its trail: the payment, the reactive transaction on Lasna, and the callback that wrote it."
- "And the reader's own browser checks it against the origin chain's receipt."

**Label:** `Ethereum Sepolia → Lasna → Base Sepolia · real transactions`
Claims: C-1 ("links back"), E-005 loop 4, E-007 (in-browser receipt check).

### 6 · What it refuses (1:50–2:15): the reversal

**Shot A (12 s):** the demo book's "Seen by explorers, not printed": `500.00 "USDC"`, struck. Cut in the landing's explorer-vs-book comparison: the explorer list shows the 500 "USDC" first; the book side shows it struck with the **NOT PRINTED** stamp. Land the stamp with a short hit in the score (minor chord).
**Voice:**
- "Someone sent this wallet 500 of a token called USD Coin. Every explorer lists it."
- "The book printed nothing. Reactive only listens to Circle's contracts."

**Shot B (13 s):** terminal: the owner calls `record` directly with a forged line → `NotAuthorized`. Then the mined, reverted transaction on the explorer (status: failed). Land a red **REFUSED** stamp.
**Voice:**
- "And the owner can't write a line either. The chain refuses it."
- "There's no owner and no admin. Nobody types in this book."

**Labels:** `look-alike token · real transfer`, `forged write · reverted on-chain`
Claims: C-3 / E-004 (look-alike never written), C-2 / E-004 + E-006 (forged record reverted `NotAuthorized`; no owner or admin).

### 7 · The reader has no wallet (2:15–2:27)

**Shot:** a phone frame with the same book link opened from a QR (the share card's dot QR), no wallet. The roll loads with **"Verified 3/3 in your browser"**; then the Print button → the paper statement.
**Voice:**
- "Your landlord opens a link. No wallet, no trust in you. Just lines they can check, or print."

Claims: E-007 (statement page, receipt check in the browser), D-012 (print statement). C-6 is not needed here.

### 8 · Measured (2:27–2:35)

**Frame:** real numbers set large on ink, from E-009 and E-011:
- **24 / 24** payments printed · **0** missed
- median **1 s**, slowest **3 s**, block to line
- about **0.015 lREACT** per payment

**Voice:** "Twenty-four real payments across three chains: all printed, a median of one second after the block."
**Label:** `harness/latency.ts · docs/evidence/harness/`
Claims: C-4 (verified wording), C-7.

### 9 · End card (2:35–2:40)

Annal mark. **Nobody types in this book.** Under it, the thesis in small type, then:
`annal-sooty.vercel.app` · `github.com/ola-akanbi/annal` · `testnet: Lasna · Base, Unichain, Ethereum Sepolia`
**Voice:** the thesis, verbatim, as the last words.

---

## Capture plan

| Shot | State before capture | Action |
|---|---|---|
| 1, 2 | landing, hard-refreshed, the hero showing the newest real payment | cursor still; camera only |
| 3 | a **fresh** wallet with ~0.0005 Base Sepolia ETH and no book | click "Open your book"; capture until "watching" settles + 2 s |
| 4 | the book from shot 3, empty and watching; terminal ready | `cast send` on Unichain, then on Base, from `annal-deployer` (keystore; the password-file path stays off screen) |
| 5 | demo book `0xa7D5…7444`, all lines collapsed, stamp showing | open No. 003, click its Lasna tx |
| 6A | demo book scrolled to "Seen by explorers"; landing's comparison section | camera only |
| 6B | terminal | `cast call … record(…) --from <demo wallet>` (the read-only forgery) + the explorer page of `0x7e5721dc…` (the mined forgery, status 0) |
| 7 | phone viewport (390 × 844), no wallet | load the book, wait for 3/3, press Print |

The wallet in shot 3 signs inside the page with a test key the browser generates (as in E-008); it is labelled "test wallet" and its key is never shown or logged. If a browser-wallet extension is available at capture time, use it instead and show its confirm dialog.

**Before every take:** browser at 100 %, bookmarks bar hidden, notifications off, console clean. One throwaway take first.

## Never on screen

`.env*`, the keystore directory, the password-file path or contents, any private key or seed, wallet recovery screens, the Vercel dashboard, personal browser profiles.

## Deliberately not in this video

- Architecture beyond the one flow diagram (the README has it, with line-level permalinks).
- Contract source and tests (README "Verify without trusting this README" and the 21 tests).
- Cost breakdown beyond the one number in shot 8.
- Source verification badges, the 404 page, link previews, the chain filters.
- Anything about other entries or other projects.

## Claims check before recording

- [ ] Every sentence above maps to a `verified` row (C-1 qualified: the three chains are named in shot 2 and the end card)
- [ ] No "audited", "secure", "production-ready", yield, or roadmap promises
- [ ] The live delay in shot 4 is read off the line, not from the 24-run median
- [ ] Re-run the README verify block on the morning of recording (the demo book still reads 3 lines, 3.00 USDC)
- [ ] AnnalReactive ≥ 1 lREACT, debt 0; AnnalBook debt 0 on the proxy

## After rendering

```bash
ffmpeg -i out/film.mp4 -vf "fps=12/160,scale=640:-1,tile=3x4:padding=6:color=white" -frames:v 1 sheet.png
ffmpeg -ss 10 -i out/film.mp4 -frames:v 1 at-10s.png      # the hook and the claim by 0:10
ffmpeg -i out/film.mp4 -af silencedetect=n=-40dB:d=0.35 -f null - 2>&1 | grep -c silence_start
```

Then `/benchmark judge` on the rendered film, upload (unlisted, anyone with the link), play it in a private window, and embed the link at the top of the README.
