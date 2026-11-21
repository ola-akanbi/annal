import Link from "next/link";
import { DEMO_BOOK } from "@/lib/annal";
import { SiteNav } from "@/components/site-nav";

export default function NotFound() {
  return (
    <>
      <SiteNav />
      <main className="nf">
        <div className="nf-slip">
          <p className="nf-code" aria-hidden>
            404
          </p>
          <h1>No book at this address.</h1>
          <p>
            A book link ends in a wallet address: <code>/book/0x</code> followed by 40 hexadecimal characters. Check the
            link you were sent, or look at a real one.
          </p>
          <div className="nf-actions">
            <Link className="key" href={`/book/${DEMO_BOOK}`}>
              See the demo book
            </Link>
            <Link className="key key-quiet" href="/">
              How Annal works
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
