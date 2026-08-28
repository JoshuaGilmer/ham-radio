import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATS, type StorageKind } from "@/data";
import { fmtHour, type SignalForm as SignalFormValues } from "@/engine";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM – 8 PM

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">{label}</Label>
      {children}
    </div>
  );
}

export function SignalForm({ orgName, onSubmit, onCancel }: { orgName: string; onSubmit: (v: SignalFormValues) => void; onCancel: () => void }) {
  const [category, setCategory] = useState("dairy");
  const [qty, setQty] = useState("120");
  const [storageReq, setStorageReq] = useState<StorageKind>("cold");
  const [expiresHrs, setExpiresHrs] = useState("72");
  const [pickupStart, setPickupStart] = useState(13);
  const [pickupEnd, setPickupEnd] = useState(18);
  const [nextDist, setNextDist] = useState("Wed 10 AM — can't absorb this");

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
        <F label="Quantity (lbs)">
          <Input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
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
          <Select value={expiresHrs} onValueChange={setExpiresHrs}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 hrs</SelectItem>
              <SelectItem value="48">48 hrs</SelectItem>
              <SelectItem value="72">72 hrs</SelectItem>
            </SelectContent>
          </Select>
        </F>
        <F label="Pickup window (today)">
          <div className="flex gap-2">
            <Select value={String(pickupStart)} onValueChange={(v) => setPickupStart(Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{fmtHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(pickupEnd)} onValueChange={(v) => setPickupEnd(Number(v))}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {HOURS.map((h) => (
                  <SelectItem key={h} value={String(h)}>{fmtHour(h)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </F>
        <F label="Next distribution">
          <Input value={nextDist} onChange={(e) => setNextDist(e.target.value)} />
        </F>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button
          onClick={() =>
            onSubmit({
              category,
              qty: qty || "?",
              storageReq,
              expiresHrs,
              pickupStart,
              pickupEnd: pickupEnd > pickupStart ? pickupEnd : pickupStart + 1,
              nextDist: nextDist || "—",
            })
          }
        >
          Send the signal
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <span className="text-xs text-muted-foreground">The next-distribution field is the point: this food can&apos;t wait for your own line.</span>
      </div>
    </Card>
  );
}
