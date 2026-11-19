// Regenerates src/lib/abi.ts from Foundry's build output, so the app can never drift from the contracts.
import fs from "node:fs";
const pick = (f, names) => JSON.parse(fs.readFileSync(f, "utf8")).abi.filter((x) => names.includes(x.name));
const book = pick("contracts/out/AnnalBook.sol/AnnalBook.json", [
  "open", "openedAt", "watchingSince", "totalReceived", "lineCount", "lines", "lineAt", "isSource",
  "BookOpened", "WatchingConfirmed", "LineWritten", "AlreadyOpened",
]);
const rc = pick("contracts/out/AnnalReactive.sol/AnnalReactive.json", ["watching", "Copied", "Watching"]);
fs.writeFileSync(
  "src/lib/abi.ts",
  "// Generated from contracts/out by `npm run abi` — do not edit by hand.\n" +
    "// Source of truth: contracts/src/AnnalBook.sol and contracts/src/AnnalReactive.sol.\n\n" +
    `export const annalBookAbi = ${JSON.stringify(book, null, 2)} as const;\n\n` +
    `export const annalReactiveAbi = ${JSON.stringify(rc, null, 2)} as const;\n`,
);
console.log(`abi.ts: ${book.length} book entries, ${rc.length} reactive entries`);
