import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HOLD_MIN, ORGS, STORAGE_LABEL, orgById } from "@/data";
import { fmtClock, fmtHour, type Signal } from "@/engine";
import { StatusRail } from "./StatusRail";

function Field({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "hot" | "cold" }) {
  return (
    <div className="min-w-0">
      <span className="block font-mono text-[9px] tracking-widest text-muted-foreground uppercase">{label}</span>
      <span className={cn("text-sm font-bold", tone === "hot" && "text-primary", tone === "cold" && "text-freeze")}>{value}</span>
    </div>
  );
}

export function SignalTicket({
  signal,
  mine,
  personaId,
  clock,
  onOpenClaim,
  onConfirm,
  onPickup,
}: {
  signal: Signal;
  mine: boolean;
  personaId: string;
  clock: number;
  onOpenClaim: (id: number) => void;
  onConfirm: (id: number) => void;
  onPickup: (id: number) => void;
}) {
  const poster = orgById(signal.posterId);
  const nOk = signal.matches.filter((m) => m.ok).length;
  const holdLeft = signal.status === "claimed" && signal.claim ? Math.max(0, signal.claim.holdUntil - clock) : 0;
  const claimer = signal.claim ? orgById(signal.claim.orgId) : null;
  const myMatch = signal.matches.find((m) => m.orgId === personaId);
  const iAmClaimer = signal.claim?.orgId === personaId;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden rounded-lg py-0",
        signal.status === "claimed" && "border-primary",
        signal.status === "escalated" && "border-crit"
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-secondary px-4 py-2 font-mono text-[11px] tracking-wide">
        <span className="font-semibold">
          SIGNAL #{signal.id} · {fmtClock(signal.postedAt)}
        </span>
        <span className="text-muted-foreground">{mine ? "SENT BY YOU" : `FROM ${poster.name.toUpperCase()}`}</span>
      </div>

      <StatusRail signal={signal} />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 p-4 sm:grid-cols-4">
        <Field label="Category" value={signal.category} />
        <Field label="Quantity" value={`${signal.qty} lbs`} />
        <Field label="Storage req." value={STORAGE_LABEL[signal.storageReq]} tone={signal.storageReq === "dry" ? undefined : "cold"} />
        <Field label="Expires" value={`${signal.expiresHrs} hrs`} tone="hot" />
        <Field label="Next distribution" value={signal.nextDist} />
        <Field label="Pickup window" value={`${fmtHour(signal.pickupStart)}–${fmtHour(signal.pickupEnd)} today`} />
        <Field label="Matched & notified" value={`${nOk} of ${ORGS.length - 1} orgs`} />
        {signal.transport && <Field label="Who moves it" value={signal.transport} />}
      </div>

      {signal.status === "posted" && !mine && myMatch?.ok && (
        <div className="flex flex-wrap items-center gap-3 border-t border-dashed px-4 py-2.5">
          <Button size="sm" onClick={() => onOpenClaim(signal.id)}>
            Claim — holds {HOLD_MIN} min
          </Button>
          <span className="text-xs text-muted-foreground">Ignoring this costs you nothing; unclaimed signals escalate on their own.</span>
        </div>
      )}

      {signal.status === "claimed" && claimer && mine && (
        <>
          <div className="flex flex-wrap items-center gap-3 border-t border-dashed px-4 py-2.5 text-sm">
            <span>
              <b>{claimer.name}</b> claimed · hold expires in <b>{holdLeft} min</b> (demo clock)
            </span>
            <Button size="sm" onClick={() => onConfirm(signal.id)}>
              Confirm transfer
            </Button>
          </div>
          {claimer.needs.length > 0 && (
            <div className="mx-4 mb-3 rounded border border-freeze bg-freeze-soft px-3 py-2 text-sm">
              <span className="mr-2 font-mono text-[9px] font-semibold tracking-widest text-freeze">SUGGESTION</span>
              {claimer.name} has a standing need for <b>{claimer.needs[0]}</b> — send some along on the trip?
            </div>
          )}
        </>
      )}

      {signal.status === "claimed" && iAmClaimer && (
        <div className="border-t border-dashed px-4 py-2.5 text-sm">
          You claimed this. Waiting on <b>{poster.name}</b> to confirm · hold expires in <b>{holdLeft} min</b>.
        </div>
      )}

      {signal.status === "confirmed" && (mine || iAmClaimer) && (
        <div className="flex flex-wrap items-center gap-3 border-t border-dashed px-4 py-2.5 text-sm">
          <span>Transfer confirmed by both parties.</span>
          <Button size="sm" variant="outline" onClick={() => onPickup(signal.id)}>
            Mark picked up
          </Button>
        </div>
      )}

      {signal.status === "picked_up" && (
        <div className="flex flex-wrap items-center gap-3 border-t border-dashed px-4 py-2.5">
          <Badge className="border-ok bg-ok-soft font-mono text-[10px] tracking-wider text-ok" variant="outline">
            RESOLVED
          </Badge>
          <span className="text-xs text-muted-foreground">This signal auto-expires from the board — nothing persists as availability data.</span>
        </div>
      )}

      {signal.status === "escalated" && (
        <div className="border-t border-crit bg-crit-soft px-4 py-3 text-sm">
          <b className="text-crit">Nobody could take this in time.</b> A dead signal is loud, never silent — it goes to a human desk with
          verified links:
          <ul className="mt-1.5 list-disc pl-5">
            <li>
              CFBCA agency-relations desk —{" "}
              <a className="text-freeze underline" href="https://feedingal.org" target="_blank" rel="noopener noreferrer">
                feedingal.org
              </a>{" "}
              (verified)
            </li>
            <li>
              Dial 211 or{" "}
              <a className="text-freeze underline" href="https://www.211connectsalabama.org" target="_blank" rel="noopener noreferrer">
                211connectsalabama.org
              </a>{" "}
              (verified)
            </li>
            <li>
              Volunteer drivers —{" "}
              <a className="text-freeze underline" href="https://gracekleincommunity.com" target="_blank" rel="noopener noreferrer">
                Grace Klein / FeedBHM
              </a>{" "}
              (verified)
            </li>
          </ul>
        </div>
      )}

      {mine && signal.status !== "picked_up" && (
        <div className="border-t border-dashed px-4 py-3">
          <h4 className="mb-2 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Who was notified — and why others were not
          </h4>
          {signal.matches.map((m) => {
            const o = orgById(m.orgId);
            return (
              <div key={m.orgId} className="flex flex-wrap items-baseline gap-2.5 py-0.5 text-sm">
                <span className="min-w-56 font-bold">{o.name}</span>
                {m.ok ? (
                  <Badge className="border-ok bg-ok-soft font-mono text-[10px] tracking-wider text-ok" variant="outline">
                    NOTIFIED · {m.miles.toFixed(1)} MI
                  </Badge>
                ) : (
                  <>
                    <Badge className="border-border bg-secondary font-mono text-[10px] tracking-wider text-muted-foreground" variant="outline">
                      NOT PINGED
                    </Badge>
                    <span className="text-xs text-muted-foreground">{m.reasons.join(" · ")}</span>
                  </>
                )}
              </div>
            );
          })}
          <p className="mt-2 text-xs text-muted-foreground">
            All compatible orgs were notified at the same moment. The filter checks physical compatibility only — storage, distance, hours,
            category opt-in. It never scores need.
          </p>
        </div>
      )}
    </Card>
  );
}
