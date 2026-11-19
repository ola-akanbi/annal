import { Landing } from "@/components/landing";
import { SiteNav } from "@/components/site-nav";
import { DEMO_BOOK } from "@/lib/annal";
import { readBookCached } from "@/lib/book";

// The landing page is the live ticker: its headline is the demo book's newest real payment.
// Read on the server (cached about a minute) so the first HTML is complete; then it goes live.
export default async function Home() {
  const book = await readBookCached(DEMO_BOOK);
  return (
    <>
      <SiteNav />
      <main className="landing-page">
        <Landing initial={book} />
      </main>
    </>
  );
}
