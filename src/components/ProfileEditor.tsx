import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { STORAGE_LABEL, type Org, type StorageKind } from "@/data";
import { fmtHour } from "@/engine";

/**
 * The editable slice of a profile. Deliberately narrower than `Partial<Org>`
 * (which is what the engine stores): capability only — what an org can
 * physically take, when it is open, how far it will travel, and what it is
 * standing-order short on. No need, urgency, or priority field, ever.
 */
export type ProfileOverride = Pick<Org, "storage" | "hours" | "radius" | "needs">;

export function profileOf(o: Org): ProfileOverride {
  return { storage: [...o.storage], hours: [o.hours[0], o.hours[1]], radius: o.radius, needs: [...o.needs] };
}

const STORAGE_KINDS: StorageKind[] = ["dry", "cold", "frozen"];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

const fieldLabel = "mb-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase";

/**
 * Self-editing for the org you are currently viewing as. Capability only —
 * storage, hours, travel radius, standing needs. Never need or priority.
 * Saving also re-confirms the profile, which is the whole incentive story:
 * the org that benefits from being reachable is the org that keeps it true.
 */
export function ProfileEditor({
  org,
  open,
  edited,
  onCancel,
  onSave,
  onRevert,
}: {
  org: Org;
  open: boolean;
  edited: boolean;
  onCancel: () => void;
  onSave: (next: ProfileOverride) => void;
  onRevert: () => void;
}) {
  const [draft, setDraft] = useState<ProfileOverride>(() => profileOf(org));
  const [needsText, setNeedsText] = useState(() => org.needs.join(", "));

  const toggleStorage = (k: StorageKind) =>
    setDraft((d) => ({
      ...d,
      storage: d.storage.includes(k) ? d.storage.filter((s) => s !== k) : STORAGE_KINDS.filter((s) => s === k || d.storage.includes(s)),
    }));

  const setHour = (which: 0 | 1, value: number) =>
    setDraft((d) => ({ ...d, hours: which === 0 ? [value, d.hours[1]] : [d.hours[0], value] }));

  const needs = needsText
    .split(",")
    .map((n) => n.trim().toLowerCase())
    .filter(Boolean);

  const errors: string[] = [];
  if (draft.storage.length === 0) errors.push("Pick at least one storage type — with none, nothing can ever match you.");
  if (draft.hours[0] >= draft.hours[1]) errors.push("Closing time has to be after opening time.");
  if (!Number.isFinite(draft.radius) || draft.radius <= 0) errors.push("Travel radius has to be greater than zero.");
  if (draft.radius > 60) errors.push("Travel radius over 60 mi is outside the metro — check that number.");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Your profile — {org.name}</DialogTitle>
          <DialogDescription>
            This is what the compatibility filter reads on the next signal. Keep it true and you keep getting food you can actually take.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div>
            <Label className={fieldLabel}>Storage you have</Label>
            <div className="flex flex-wrap gap-2">
              {STORAGE_KINDS.map((k) => {
                const on = draft.storage.includes(k);
                return (
                  <Button
                    key={k}
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-pressed={on}
                    onClick={() => toggleStorage(k)}
                    className={cn("font-mono text-xs", on && "border-freeze bg-freeze-soft text-freeze")}
                  >
                    {on ? "✓ " : ""}
                    {STORAGE_LABEL[k]}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="min-w-48 grow">
              <Label className={fieldLabel}>Open hours</Label>
              <div className="flex items-center gap-2">
                <Select value={String(draft.hours[0])} onValueChange={(v) => setHour(0, Number(v))}>
                  <SelectTrigger className="h-9 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)} className="font-mono text-xs">
                        {fmtHour(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">–</span>
                <Select value={String(draft.hours[1])} onValueChange={(v) => setHour(1, Number(v))}>
                  <SelectTrigger className="h-9 font-mono text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)} className="font-mono text-xs">
                        {fmtHour(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-40">
              <Label className={fieldLabel} htmlFor="pe-radius">
                Will travel
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="pe-radius"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  className="font-mono text-sm"
                  value={Number.isFinite(draft.radius) ? draft.radius : ""}
                  onChange={(e) => setDraft((d) => ({ ...d, radius: e.target.value === "" ? NaN : Number(e.target.value) }))}
                />
                <span className="font-mono text-xs text-muted-foreground">mi</span>
              </div>
            </div>
          </div>

          <div>
            <Label className={fieldLabel} htmlFor="pe-needs">
              Standing needs — what you are always short on
            </Label>
            <Input
              id="pe-needs"
              className="font-mono text-sm"
              placeholder="rice, eggs, bread"
              value={needsText}
              onChange={(e) => setNeedsText(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Comma separated. Shown to posters so a pickup can go out with a backhaul instead of an empty trunk.
            </p>
            {needs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {needs.map((n) => (
                  <Badge key={n} variant="outline" className="border-freeze bg-freeze-soft font-mono text-[10px] text-freeze">
                    {n}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <p className="rounded-md border border-dashed bg-secondary/50 p-2.5 text-xs text-muted-foreground">
            A profile describes what you can <b>physically</b> take. There is no field here for need, urgency, or priority — the filter never
            ranks orgs against each other, and every matched org is notified at the same moment.
          </p>

          {errors.length > 0 && (
            <ul className="rounded-md border border-crit bg-crit-soft p-2.5 text-xs text-crit">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between sm:gap-2">
          {edited ? (
            <Button variant="ghost" size="sm" className="font-mono text-[11px]" onClick={onRevert}>
              Revert to seeded profile
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button disabled={errors.length > 0} onClick={() => onSave({ ...draft, needs })}>
              Save &amp; re-confirm
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
