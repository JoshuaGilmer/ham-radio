import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ORGS, STORAGE_LABEL, distMiles, orgById } from "@/data";
import { fmtHour, lastConfirmedInfo, type AppState } from "@/engine";

const toneClass = {
  ok: "border-ok bg-ok-soft text-ok",
  warn: "border-warn bg-warn-soft text-warn",
  crit: "border-crit bg-crit-soft text-crit",
};

export function NetworkTab({ state }: { state: AppState }) {
  const me = orgById(state.persona);
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Twelve synthetic partner orgs. Profiles are self-maintained by the org that benefits — a stale profile means you stop receiving free
        food. Claiming a signal re-confirms your profile automatically.
      </p>
      <div className="flex flex-col gap-2.5">
        {ORGS.map((o) => {
          const lc = lastConfirmedInfo(o, state);
          return (
            <Card key={o.id} className="gap-0 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="font-display font-bold">
                  {o.name}
                  {o.id === state.persona && (
                    <Badge className="ml-2 border-freeze bg-freeze-soft font-mono text-[10px] tracking-wider text-freeze" variant="outline">
                      YOU
                    </Badge>
                  )}
                </span>
                <Badge className={cn("font-mono text-[10px] tracking-wider", toneClass[lc.tone])} variant="outline">
                  {lc.label.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-soft">
                <span>{o.who}</span>
                <span>{o.storage.map((s) => STORAGE_LABEL[s]).join(" · ")}</span>
                <span>
                  open {fmtHour(o.hours[0])}–{fmtHour(o.hours[1])}
                </span>
                <span>travels {o.radius} mi</span>
                {o.id !== state.persona && <span>{distMiles(me, o).toFixed(1)} mi from you</span>}
                {o.needs.length > 0 && <span>standing need: {o.needs.join(", ")}</span>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
