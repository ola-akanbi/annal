import { readLastState } from "@/lib/last-read";
import { SignatureLive } from "./signature-live";

// Server half: reads the last real state, so the component is in the first HTML response.
export async function Signature() {
  const last = await readLastState();
  const readAt = new Date(last.readAt);
  const label = `As of ${readAt.toUTCString().replace(" GMT", " UTC")} · ${last.source}`;
  return <SignatureLive initial={last} label={label} />;
}
