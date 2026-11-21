import { isAddress } from "viem";
import { readBookCached, type BookState } from "@/lib/book";
import { OG_SIZE, ogCard } from "@/lib/og-card";
import site from "@/lib/site.json";

// A shared book's link preview: that wallet's own total and newest lines, read from AnnalBook.
export const alt = `${site.name}: an income book copied from each payment's own log`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  let book: BookState | null = null;
  if (isAddress(address)) {
    try {
      book = await readBookCached(address);
    } catch {
      book = null;
    }
  }
  // An unopened or empty book has no receipt to show: fall back to the site card.
  return ogCard(book && book.lines.length > 0 ? book : null, book && book.lines.length > 0 ? "book" : "site");
}

