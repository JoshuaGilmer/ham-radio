import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATS, ORGS, STORAGE_LABEL, orgById, type StorageKind } from "@/data";
import { computeMatches, fmtHour, type SignalForm as SignalFormValues } from "@/engine";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM – 8 PM
const NETWORK_SIZE = ORGS.length - 1; // everyone but the poster

function F({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div>
      <Label className="mb-1.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">{label}</Label>
      {children}
      {error ? <p className="text-crit mt-1 text-xs">{error}</p> : null}
    </div>
  );
}

/* Buckets an exclusion reason so the preview can say *why* the reach is small,
   without ever ordering or ranking the orgs themselves. */
function reasonBucket(reason: string): string {
  if (reason.startsWith("too far")) return "out of range";
  if (reason.startsWith("no ")) return "no matching storage";
  if (reason.startsWith("closed")) return "closed during window";
  if (reason.startsWith("not opted")) return "not opted into category";
  return "other";
}

const URGENCY: Record<string, { label: string; cls: string }> = {
  "24": { label: "hot — under a day", cls: "bg-crit-soft text-crit" },
  "48": { label: "tightening", cls: "bg-warn-soft text-warn" },
  "72": { label: "calm — three days", cls: "bg-ok-soft text-ok" },
};

export function SignalForm({
  orgName,
  personaId,
  onSubmit,
  onCancel,
}: {
  orgName: string;
  personaId: string;
  onSubmit: (v: SignalFormValues) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState("dairy");
  const [qty, setQty] = useState("120");
  const [storageReq, setStorageReq] = useState<StorageKind>("cold");
  const [expiresHrs, setExpiresHrs] = useState("72");
  const [pickupStart, setPickupStart] = useState(13);
  const [pickupEnd, setPickupEnd] = useState(18);
  const [nextDist, setNextDist] = useState("Wed 10 AM — can't absorb this");

  /* ---------- validation ---------- */

  const qtyNum = Number(qty);
  const qtyError =
    qty.trim() === ""
      ? "Enter a quantity."
      : !Number.isFinite(qtyNum) || qtyNum <= 0
        ? "Quantity must be a positive number."
        : undefined;
  const windowError = pickupEnd <= pickupStart ? "Pickup window must end after it starts." : undefined;
  const nextDistError = nextDist.trim() === "" ? "Required — it is why this food cannot wait." : undefined;
  const isValid = !qtyError && !windowError && !nextDistError;

  /* ---------- live match preview: physical compatibility only ---------- */

  const preview = useMemo(() => {
    if (windowError) return null;
    const matches = computeMatches({ posterId: personaId, category, storageReq, pickupStart, pickupEnd });
    const hits = matches.filter((m) => m.ok);
    const counts = new Map<string, number>();
    for (const m of matches) {
      if (m.ok) continue;
      for (const b of new Set(m.reasons.map(reasonBucket))) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    return {
      n: hits.length,
      names: hits.map((m) => orgById(m.orgId).name),
      excluded: [...counts.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [personaId, category, storageReq, pickupStart, pickupEnd, windowError]);

  const urgency = URGENCY[expiresHrs];

  return (
    <Card className="mb-4 gap-0 p-5">
      <h3 className="font-display mb-4 font-bold">Put out a signal — as {orgName}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <F label="Category">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </F>
        <F label="Quantity (lbs)" error={qtyError}>
          <Input type="number" min={1} value={qty} aria-invalid={!!qtyError} onChange={(e) => setQty(e.target.value)} />
        </F>
        <F label="Storage requirement">
          <Select value={storageReq} onValueChange={(v) => setStorageReq(v as StorageKind)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="dry">Dry</SelectItem>
              <SelectItem value="cold">Refrigerated</SelectItem>
              <SelectItem value="frozen">Frozen</SelectItem>
            </SelectContent>
          </Select>
        </F>
        <F label="Expires within">
          <div className="flex items-center gap-2">
            <Select value={expiresHrs} onValueChange={setExpiresHrs}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 hrs</SelectItem>
                <SelectItem value="48">48 hrs</SelectItem>
                <SelectItem value="72">72 hrs</SelectItem>
              </SelectContent>
            </Select>
            {urgency ? (
              <span className={`${urgency.cls} shrink-0 rounded px-2 py-1 font-mono text-[9px] tracking-widest uppercase`}>
                {urgency.label}
              </span>
            ) : null}
          </div>
        </F>
        <F label="Pickup window (today)" error={windowError}>
          <div className="flex gap-2">
            <Select value={String(pickupStart)} onValueChange={(v) => setPickupStart(Number(v))}>
              <SelectTrigger className="w-full" aria-invalid={!!windowError}><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{fmtHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(pickupEnd)} onValueChange={(v) => setPickupEnd(Number(v))}>
              <SelectTrigger className="w-full" aria-invalid={!!windowError}><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{fmtHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </F>
        <F label="Next distribution" error={nextDistError}>
          <Input value={nextDist} aria-invalid={!!nextDistError} onChange={(e) => setNextDist(e.target.value)} />
        </F>
      </div>

      {/* Live fan-out preview — shows the broadcast before it happens. */}
      <div className="bg-muted/40 mt-5 rounded-md border p-4">
        {preview === null ? (
          <p className="text-muted-foreground text-sm">Fix the pickup window to see who would be notified.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-mono text-[9px] tracking-widest text-muted-foreground uppercase">This will notify</span>
              <b className={`font-display text-lg ${preview.n === 0 ? "text-crit" : "text-ok"}`}>
                {preview.n} of {NETWORK_SIZE}
              </b>
              <span className="text-muted-foreground text-sm">orgs — all at once, no ranking.</span>
            </div>

            {preview.n > 0 ? (
              <p className="mt-2 text-sm">{preview.names.join(" · ")}</p>
            ) : (
              <p className="text-crit mt-2 text-sm">
                No physically compatible org right now — <b>send it anyway</b>. If nobody claims it before your pickup
                window closes it escalates loudly to the CFBCA agency-relations desk with verified{" "}
                <a className="text-freeze underline" href="https://www.211connectsalabama.org" target="_blank" rel="noopener noreferrer">
                  211
                </a>{" "}
                links. A dead signal is never silent.
              </p>
            )}

            {preview.excluded.length > 0 ? (
              <p className="text-muted-foreground mt-2 font-mono text-[10px]">
                excluded: {preview.excluded.map(([b, c]) => `${c} ${b}`).join(" · ")}
              </p>
            ) : null}

            <p className="text-muted-foreground mt-2 text-xs">
              Filter gates physical compatibility only — {STORAGE_LABEL[storageReq].toLowerCase()} storage, distance,
              open hours, opted-in category. It never scores need or ranks recipients.
            </p>
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button disabled={!isValid} onClick={() => onSubmit({ category, qty, storageReq, expiresHrs, pickupStart, pickupEnd, nextDist })}>
          Send the signal
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <span className="text-xs text-muted-foreground">
          The next-distribution field is the point: this food can&apos;t wait for your own line.
        </span>
      </div>
    </Card>
  );
}
