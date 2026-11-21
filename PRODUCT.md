# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
**Primary:** a freelancer paid in USDC by clients on several chains (Ethereum, Base and Unichain Sepolia on testnet). From time to time they have to prove their income to someone who doesn't trust a screenshot or a spreadsheet: a landlord, an accountant, a visa or loan officer. Their job is to hand over one statement covering every chain, and have the reader believe it without trusting them.

**Secondary: developers evaluating the integration**, often with a few minutes to spare. They need to see the reactive transaction and the callback it triggered, and whether the reactive contract does real work.

**Reader of a shared book:** whoever receives the link. They have no wallet and no crypto background, and they want to know whether the numbers are real.

## Product Purpose
Annal keeps one income book per wallet, across chains. The owner opens it once with a single transaction. From then on, every Circle USDC payment to that wallet on any source chain is copied into the book by Reactive Network, straight from the payment's own log, and each line links back to the transaction it came from.

Success means a reader trusts the statement because they can check it, not because they trust the owner.

## Positioning
Off-chain trackers and explorers can already *show* payments across chains. What they can't offer is a book nobody can write in: lines arrive only through Reactive's callback proxy, from one ownerless reactive contract, for a fixed set of real USDC contracts. The owner can't add, edit or delete a line, and a look-alike token named "USDC" is never written. Without Reactive's subscription to events on many chains and its cross-chain callback, this would need a trusted indexer server, which is exactly what the reader can't trust.

## Operating Context
- **Opening:** connect a wallet on Base Sepolia, press "Open my book" (one transaction). Within about a second Reactive confirms it's watching that wallet on every source chain.
- **Living with it:** nothing to run. Payments land as lines about 1–3 seconds after their block.
- **Sharing:** each book has a public URL, `/book/<address>`. The owner sends it to the reader. The reader needs no wallet; the page re-checks every line against the origin chain's receipt in their browser.
- **Evaluating:** a reviewer opens a demo book by link, follow any line to its origin transaction, the Lasna reactive transaction and the Base Sepolia callback, and can open a book themselves with a testnet wallet.

## Capabilities and Constraints
- Sources fixed at deployment: Circle USDC on Ethereum Sepolia (11155111), Base Sepolia (84532), Unichain Sepolia (1301). The book lives on Base Sepolia. The reactive contract runs on Reactive Lasna. Testnet only.
- Each line: origin chain, payer, amount (USDC, 6 decimals), origin block, origin tx hash, log index, and the time it was written. Running total per wallet.
- Book states: not opened → opened (waiting for Reactive) → watching. Reactive contract health: funded, or in debt (an indebted contract silently stops writing).
- Line check states: checked (the origin receipt holds the matching log), mismatch, unchecked (not yet read).
- Native ETH payments emit no logs and are never recorded. Only USDC is recorded.
- The book records payments, not why they were made. A self-payment from a second wallet is recorded like any other.
- No completeness promise: if the reactive contract runs out of funds, payments made meanwhile are missed.
- **Terminology:** "book" (never "dashboard" or "portfolio"), "line" (one payment), "open a book", "watching", "copied from the payment's log". Chains by their plain names.

## Brand Commitments
- Name: **Annal** (a record of events, written down as they happen).
- Thesis, verbatim on every surface: "One income book for every chain you're paid on. Every line is copied from the payment's own log, and links back to it." Copy near it must name the three chains (claims table C-1).
- Must not resemble the operator's other entry, Ripcord (a trading tool for Uniswap v4 exits).

## Evidence on Hand
- Live contracts: AnnalReactive (Lasna) and AnnalBook (Base Sepolia), both `0x653B62A39Aea06998c152b48F150175B2645c8Bd`.
- A real demo book: `0xa7D557BF0C7312EAF186a6A81159a3650aA77444`, with 3 lines (1 USDC each from Base, Unichain and Ethereum Sepolia), a look-alike USDC payment that was never written, and a refused forged write. Full transaction hashes in `docs/EVIDENCE.md`, raw receipts in `docs/evidence/`.
- Latency so far: n = 1 per chain (1 s, 1 s, 3 s). No public latency figure until ≥ 20 runs.
- No users, testimonials or partners exist. Never imply any.

## Product Principles
1. **Checkable beats claimed.** Every number on screen can be followed to the transaction it came from, and the page says whether it has checked it.
2. **Nobody writes, including us.** No owner, admin or "add entry" affordance anywhere, in contracts or UI.
3. **The reader has no wallet.** A shared book must make sense to someone who has never used crypto.
4. **Set it once.** Opening is one action; after that the product asks nothing of its owner.
5. **Say the limits.** Testnet only, USDC only, no completeness guarantee if Reactive is unfunded.

## Accessibility & Inclusion
The shared statement must be readable on a phone, printable, and usable without JavaScript for the core content (the lines themselves are server-rendered from the chain).
