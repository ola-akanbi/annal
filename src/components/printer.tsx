import type { WatchState } from "./watch";

/** The register's print head the roll feeds out of. The LED follows the watcher's real state. */
export function PrinterHead({ watch, block }: { watch: WatchState; block: string }) {
  return (
    <div className="printer" data-state={watch.kind}>
      <div className="printer-top">
        <span className="printer-led" aria-hidden />
        <span className="printer-name">Annal register</span>
        <span className="printer-block">blk {Number(block).toLocaleString("en-US")}</span>
      </div>
      <div className="printer-slot" aria-hidden />
    </div>
  );
}
