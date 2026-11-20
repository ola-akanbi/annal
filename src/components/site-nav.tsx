import Link from "next/link";
import { BookOpen, ShieldCheck, Wallet, Workflow } from "lucide-react";
import { DEMO_BOOK } from "@/lib/annal";
import { AnnalMark } from "./marks";


/** The site header: glass over whatever field sits under it. */
export function SiteNav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo" aria-label="Annal, home">
          <AnnalMark size={32} />
          <span>Annal</span>
        </Link>
        <nav aria-label="Main" className="nav-links">
          <Link href="/#how">
            <Workflow aria-hidden strokeWidth={2.2} />
            How it works
          </Link>
          <Link href={`/book/${DEMO_BOOK}`}>
            <BookOpen aria-hidden strokeWidth={2.2} />
            Live book
          </Link>
          <Link href="/#trust">
            <ShieldCheck aria-hidden strokeWidth={2.2} />
            Why trust it
          </Link>
        </nav>
        <Link href="/#open" className="nav-cta">
          <Wallet aria-hidden strokeWidth={2.2} />
          Open your book
        </Link>
      </div>
    </header>
  );
}

