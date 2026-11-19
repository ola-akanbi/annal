import { Signature } from "@/components/signature";
import site from "@/lib/site.json";

// The signature component's source is re-read about once a minute (see readLastState), and every
// visitor gets HTML that's already filled.
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-24">
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">{site.thesis}</h1>
      <p className="mt-6 max-w-2xl text-lg text-pretty opacity-80">{site.lede}</p>
      <Signature />
    </main>
  );
}
