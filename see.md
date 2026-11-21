Audit and refine the UI, typography, and micro-interactions of this Next.js 16 + Tailwind CSS v4 app without changing its warm paper-receipt aesthetic, layout structure, or color identity.

1. PACKAGE & ICON UPGRADES:
- Install `@phosphor-icons/react`, `@number-flow/react`, `motion`, and `sonner`.
- Replace `lucide-react` imports with `@phosphor-icons/react` (use `/dist/ssr` for Server Components). Use `weight="bold"` or `weight="duotone"` so icon stroke weights match our heavy display typography. Remove `lucide-react` once replaced.
- Add `<Toaster />` from `sonner` in the root layout (styled to match our dark `#111` ink cards) and trigger crisp toast feedback whenever a user clicks "Copy link", copies a wallet/contract address, or copies the `cast call` CLI snippet.

2. CRITICAL VISUAL & TYPOGRAPHY FIXES:
- **Sticky Navbar Overlap**: The floating top navbar currently lets scrolled headlines and receipt rows bleed behind the nav links. Give the navbar pill a high-opacity solid/frosted surface (e.g. `bg-[#FAF6EE]/95` with a crisp `1px` border and subtle shadow) and add `scroll-mt-24` to section anchors so jumped sections never tuck under the header.
- **Heading Letter-Spacing**: Loosen the overly tight negative `letter-spacing` on medium headings (`h2`/`h3` under 36px)—specifically in the "Your landlord", "Your accountant", and "A visa officer" cards where words currently run together (`Yourlandlord`). Reserve tight negative tracking (`-0.03em` to `-0.04em`) strictly for hero display headings (`48px+`).
- **Receipt Monospace Contrast**: Darken the muted monospace metadata on the white paper receipt cards (`from 0x4713...691E · 22:09:03 UTC` and `WATCHING · THE NEXT PAYMENT PRINTS HERE`) from pale gray to at least `#525252` so it stays readable on screen and when printed.
- **Verified Stamp Spacing**: On the `/book/[address]` receipt card, add vertical breathing room between the last transaction row and the `TOTAL RECEIVED` divider so the rotated `VERIFIED 3/3 IN YOUR BROWSER` stamp sits cleanly without overlapping the row border.
- **Verify Contract Addresses**: Check why `AnnalReactive` (Reactive Lasna) and `AnnalBook` (Base Sepolia) display the exact same address (`0x653B62A3...45c8Bd`) in the "Two contracts. No owner." section and the book sidebar. If they are two different deployed contracts in our config/constants, fix the display bug; if they share a deterministic CREATE2 address, add a subtle tooltip or caption explaining why.

3. SUBTLE MOTION & LIVE COUNTERS:
- Wrap the big pixel-dot USDC totals (`1.00`, `3.00`) and print-time metrics (`1 s`, `3 s`) with `@number-flow/react` while preserving the existing dot-matrix font family.
- Use `motion` (`motion/react`) for subtle receipt-line entry animations when new payments appear and smooth layout transitions when selecting a row to inspect in the right-hand timeline panel.

Redesign the transaction rows inside the center "Annal register" receipt card (`/book/[address]`) so each entry is visually distinct, scannable, and clearly linked to the right-hand inspector panel:

1. DISTINCT ENTRY CARDS / LEDGER BANDS:
- Give each transaction entry (`No. 003`, `No. 002`, `No. 001`) clear visual boundaries instead of floating on a plain white background:
  - Wrap each entry in a crisp bordered sub-card (`rounded-xl border border-neutral-200 bg-[#FAF8F3]/70 p-4`) with `space-y-3` vertical spacing between entries, OR separate entries with perforated/dashed receipt dividers (`border-b border-dashed border-neutral-300 py-5`) and alternating subtle warm-paper tinting.
- Add a subtle left accent bar (`border-l-4`) matching the chain's brand color (periwinkle for Ethereum, blue for Base, magenta for Unichain) so you can scan chains down the ledger at a glance.

2. ACTIVE SELECTION SYNC WITH RIGHT INSPECTOR:
- Highlight whichever row is currently selected/inspected in the right-hand `No. XXX · 1.00 USDC` dark card with an active state (`border-neutral-900 bg-amber-50/60 ring-1 ring-neutral-900/10`) and a small `"INSPECTING"` pill badge.
- Clicking any row header should both toggle its inline proof drawer and select it in the right-hand inspector panel.

3. CLEANER EXPANDED PROOF DRAWER:
- Inside the expanded area (`Paid on...`, `Read by Reactive Network...`, `Written to this book...`), group the 3 verification steps into a recessed inset panel (`rounded-lg bg-neutral-100/90 border border-neutral-200/80 p-3.5`) with a vertical timeline connector line linking the three hollow dots.
- Style the `"Checked in your browser..."` summary note at the bottom of the drawer as a crisp emerald-tinted verification footer (`bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 rounded-md px-3 py-2`) so the proof status reads cleanly at a glance instead of blending into the next row.

Add lightweight filtering and bulk expand/collapse controls to the top of the center "Annal register" receipt card (`/book/[address]`) so books with many payments stay fast to scan and audit:

1. REGISTER TOOLBAR (Above the receipt rows, below `WATCHING · THE NEXT PAYMENT PRINTS HERE`):
- Add a clean, compact utility bar with `border-y border-dashed border-neutral-300 py-2.5 my-3 flex flex-wrap items-center justify-between gap-2`:
  - **Left side — Chain Filter Pills**: `All (3)`, `Ethereum`, `Base`, `Unichain` (dynamically showing counts per chain). Style inactive pills as `text-xs font-mono px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200` and the active pill as `bg-neutral-900 text-white`.
  - **Right side — Bulk Toggle**: A single subtle monospace button (`Expand all` / `Collapse all`) that expands or collapses all currently visible receipt rows in one click.

2. FILTER BEHAVIOR & TOTALS SYNC:
- Filtering the register by chain should only filter the visible receipt rows (keep the `TOTAL RECEIVED` block at the bottom showing the full multi-chain book total, or display a small `"Filtered subtotal: X.XX USDC"` line above `TOTAL RECEIVED` when a specific chain filter is active so auditors never confuse a filtered view with the full statement).
- Ensure keyboard accessibility and smooth `motion` height/opacity transitions when rows expand or collapse.

Refine the color hierarchy across the entire app so it strictly follows a cohesive 3-color core palette—Warm Amber (`#F7C348`), Ink Black (`#0E0E0E`), and Warm Receipt Paper (`#FAF8F3`)—while reserving bright colors strictly for semantic states (blockchain networks and verification/warnings):

1. REPLACE THE FULL-BLEED HOT PINK SECTION:
- Locate the fraud/spoofing comparison section ("Explorers said 500 USDC. Annal printed nothing.") and replace its full-bleed hot pink (`#FF4791`) background with Ink Black (`#0E0E0E`) or Warm Receipt Paper (`#FAF8F3`) so it flows naturally from the surrounding sections without visual fatigue.
- Keep the red/rose accent (`#E11D48` / `#FF4791`) strictly as a semantic warning color inside that section: for the `"SPOOFED / NOT PRINTED"` status badge, the strikethrough line on `500 USDC`, and the warning border on the fake explorer card.

2. UNIFY DECORATIVE ICON BADGES:
- In the audience/use-case cards ("Your landlord", "Your accountant", "A visa officer"), replace the unrelated multi-colored icon boxes (purple, green, orange) with a unified brand treatment: solid Ink Black (`#0E0E0E`) icon containers with Warm Amber (`#F7C348`) or Warm Paper (`#FAF8F3`) icons.
- Audit all non-network badges and decorative pills so bright colors are never used purely for decoration.

3. RESERVE ACCENT COLORS STRICTLY FOR SEMANTIC MEANING:
- Keep **Periwinkle** (Ethereum), **Blue** (Base), and **Magenta** (Unichain) exclusive to chain pills, chain filter buttons, and chain timeline markers.
- Keep **Emerald** exclusive to verified proof states (`VERIFIED 3/3 IN YOUR BROWSER` and browser verification checks), and **Crimson/Rose** exclusive to rejected/unprinted spoof warnings.
