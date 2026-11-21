# Annal: live demo run of show

**Thesis in one line:** *One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it.*

Target: **about 3 minutes**, then Q&A. The event reviews the submission (repo, addresses, transaction hashes, a video under three minutes) and announces no live round, so this script exists for a call or a demo day if one is offered, and it is the spine of [`VIDEO.md`](VIDEO.md). Every value on screen is live; read numbers off the screen, never from this page.

**The one moment:** a payment sent on another chain prints itself onto the roll a second or two later, while everyone watches. Slow down there.

**The reversal:** a token named "USD Coin" lands in the wallet, every explorer lists it, and the book prints nothing. Then the owner tries to write a line by hand and the chain refuses.

---

## Pre-flight (before the call)

- [ ] AnnalReactive funded and owing nothing: `cast balance 0x653B62A39Aea06998c152b48F150175B2645c8Bd --rpc-url https://lasna-rpc.rnk.dev/ --ether` (≥ 1 lREACT) and `debt(address)` on `0x8888…8888` returns 0
- [ ] AnnalBook owes nothing on the Base Sepolia callback proxy: `debt(address)` on `0x476F44b11F5C942c58f4c8E3d0300E5710743585` returns 0
- [ ] The deployer (`annal-deployer`) holds ≥ 3 USDC and gas on Base Sepolia and Unichain Sepolia
- [ ] A fresh demo wallet with a little Base Sepolia ETH and **no book yet** (`openedAt` = 0), in a browser wallet on Base Sepolia
- [ ] Tab 1: https://annal-sooty.vercel.app (landing, hard-refreshed). Tab 2: the demo book https://annal-sooty.vercel.app/book/0xa7D557BF0C7312EAF186a6A81159a3650aA77444, with the "Verified 3/3" stamp showing. Tab 3: https://lasna.reactscan.net/address/0x653B62A39Aea06998c152b48F150175B2645c8Bd
- [ ] Console clean on every tab (no CORS, no 429, no failed requests)
- [ ] Terminal at 18 pt, `cd` into the repo, the two `cast send` commands below typed and ready, history cleared. **No `.env`, keystore path or password file on screen.**
- [ ] Phone on cellular with the demo book open (for the "no wallet" beat)
- [ ] Backup: the rendered film and `docs/media/` screenshots open in a fourth tab

---

## Cold open: the problem (0:00–0:20)

> "If you're paid in USDC on three chains, proving your income to a landlord means three explorers and a screenshot anyone could edit. And every explorer will happily list a fake token called USDC."

## Act 1: set it once (0:20–1:20), the emotional beat

1. **Open a book.** Tab 1 → "Open your book" → the wallet asks for one transaction on Base Sepolia → confirm. The app lands on the new book.
   > "That's the only thing the owner ever does. One transaction."
2. **Reactive confirms on its own.** Within a couple of seconds the status flips to "Reactive is watching this wallet".
   > "Nobody pressed anything. A reactive contract on Lasna saw the book open and subscribed to Circle's USDC on Ethereum, Base and Unichain for this wallet."
3. **The moment: a payment prints itself.** In the terminal:
   ```bash
   cast send 0x31d0220469e10c4E71834a79b1f276d740d3768F "transfer(address,uint256)" <demo wallet> 1000000 \
     --rpc-url https://sepolia.unichain.org --account annal-deployer --password-file <pw file>
   ```
   Switch back to the book. Line No. 001 feeds out of the printer with "Unichain Sepolia · printed in N s". **Pause. Let them see it.**
   > "Paid on Unichain. Written into the book on Base. Nobody typed it."
4. **Follow the line.** Click the line. The drawer shows three transactions: paid on Unichain, read by Reactive on Lasna, written on Base Sepolia. Click the Lasna transaction: Reactscan opens on the reactive transaction.
   > "Every line links back to the log it was copied from."

## Act 2: what it refuses, and it's real (1:20–2:30)

5. **The reversal.** Tab 2, the demo book. Scroll to "Seen by explorers, not printed": `500.00 "USDC"` struck through, "calls itself USDC, but it isn't Circle's USDC".
   > "Someone sent this wallet 500 of a token named USD Coin. Explorers list it. The book printed nothing. Reactive only listens to Circle's contracts, and the book refuses any other source."
6. **The forged write.** In the terminal, as the demo wallet, the read-only version of the forgery:
   ```bash
   cast call 0x653B62A39Aea06998c152b48F150175B2645c8Bd \
     "record(address,address,address,uint256,uint256,address,uint256,uint256,uint256)" \
     0x653B62A39Aea06998c152b48F150175B2645c8Bd <demo wallet> <demo wallet> 1000000000 84532 \
     0x036CbD53842c5426634e7929541eC2318f3dCF7e 1 1 0 --from <demo wallet> --rpc-url https://sepolia.base.org
   ```
   It reverts with `NotAuthorized`.
   > "Not even the owner can write a line. The contracts have no owner and no admin."
7. **The reader.** The phone: the same book, no wallet, "Verified 3/3 in your browser".
   > "The landlord opens a link. Their own browser fetches each payment's receipt from its chain and ticks it."

## Close: the thesis (2:30–3:00)

> "One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it."

Limits, in one breath before questions: *"Testnet only, USDC only, no audit. If the watcher runs out of lREACT, payments made meanwhile aren't printed, and the book says so."*

---

## If something breaks

- **Wifi drops:** the pre-opened tabs still show the demo book; switch to the rendered film at the same beat.
- **The live payment is slow to print:** stay on the book. It re-reads every few seconds. If nothing after 15 s, check Tab 3 (Reactscan) for the reactive transaction and narrate the trail from the demo book's existing lines instead.
- **Ethereum Sepolia:** don't send live on it; its 12 s blocks stall the moment. The demo book already holds a Sepolia line (log index 223) to click.
- **An RPC returns 429:** switch to the film; reloading only extends the limit.
- **The wallet won't switch to Base Sepolia:** use a wallet already on Base Sepolia (pre-flight), or skip step 1 and open the demo book.
