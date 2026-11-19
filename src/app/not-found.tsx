import Link from "next/link";
import site from "@/lib/site.json";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-24 sm:px-8">
      <p className="text-sm opacity-70">{site.name}</p>
      <h1 className="mt-2 text-3xl font-semibold">There&rsquo;s nothing at this address.</h1>
      <Link href="/" className="mt-6 inline-block underline underline-offset-4">
        Back to {site.name}
      </Link>
    </main>
  );
}
