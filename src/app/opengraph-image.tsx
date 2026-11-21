import { DEMO_BOOK } from "@/lib/annal";
import { readBookCached, type BookState } from "@/lib/book";
import { OG_SIZE, ogCard } from "@/lib/og-card";
import site from "@/lib/site.json";

// The landing page's link preview: the demo book's real receipt beside the thesis.
export const alt = `${site.name}: ${site.thesis}`;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  let book: BookState | null = null;
  try {
    book = await readBookCached(DEMO_BOOK);
  } catch {
    book = null; // chain unreachable: thesis only, never a made-up figure
  }
  return ogCard(book, "site");
}
