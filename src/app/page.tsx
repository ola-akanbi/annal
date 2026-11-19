import { BookView } from "@/components/book-view";
import { DEMO_BOOK } from "@/lib/annal";
import { readBookCached } from "@/lib/book";

// The demo book: a real wallet with real payments. Read on the server (cached about a minute) so
// the first HTML is the filled statement; the page then re-reads the chain live.
export default async function Home() {
  const book = await readBookCached(DEMO_BOOK);
  return <BookView initial={book} demo fast={false} />;
}
