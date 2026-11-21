import Link from "next/link";
import { BookOpenIcon, FlowArrowIcon, ShieldCheckIcon, WalletIcon } from "@phosphor-icons/react/dist/ssr";
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
            <FlowArrowIcon aria-hidden weight="bold" />
            How it works
          </Link>
          <Link href={`/book/${DEMO_BOOK}`}>
            <BookOpenIcon aria-hidden weight="bold" />
            Live book
          </Link>
          <Link href="/#trust">
            <ShieldCheckIcon aria-hidden weight="bold" />
            Why trust it
          </Link>
        </nav>
        <Link href="/#open" className="nav-cta">
          <WalletIcon aria-hidden weight="bold" />
          Open your book
        </Link>
      </div>
    </header>
  );
}

