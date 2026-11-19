import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAddress, isAddress } from "viem";
import { BookView } from "@/components/book-view";
import { DEMO_BOOK } from "@/lib/annal";
import { readBookCached } from "@/lib/book";
import { shortHex } from "@/lib/format";
import site from "@/lib/site.json";

type Params = { params: Promise<{ address: string }>; searchParams: Promise<{ opened?: string }> };

export function generateStaticParams() {
  return [{ address: DEMO_BOOK }];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { address } = await params;
  if (!isAddress(address)) return { title: site.name };
  const short = shortHex(getAddress(address));
  return {
    title: `Income book · ${short} · ${site.name}`,
    description: `Every Circle USDC payment to ${short} on Ethereum, Base and Unichain Sepolia, copied from each payment's own log by Reactive Network.`,
  };
}

async function Book({ params, searchParams }: Params) {
  const [{ address }, { opened }] = await Promise.all([params, searchParams]);
  if (!isAddress(address)) notFound();
  const book = await readBookCached(getAddress(address));
  return <BookView initial={book} demo={false} fast={opened === "1"} />;
}

function Pending() {
  return (
    <main className="counter">
      <div className="rail rail-left" />
      <div className="roll-wrap">
        <div className="roll">
          <div className="roll-empty">
            <strong>Reading the book from Base Sepolia…</strong>
          </div>
          <div className="roll-end" />
        </div>
      </div>
    </main>
  );
}

export default function BookPage(props: Params) {
  return (
    <Suspense fallback={<Pending />}>
      <Book {...props} />
    </Suspense>
  );
}
