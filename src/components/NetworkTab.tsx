import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProfileEditor, type ProfileOverride } from "@/components/ProfileEditor";
import { cn } from "@/lib/utils";
import { ORGS, STORAGE_LABEL, distMiles, type Org } from "@/data";
import { effectiveOrg, fmtHour, lastConfirmedInfo, type AppState } from "@/engine";

const toneClass = {
  ok: "border-ok bg-ok-soft text-ok",
  warn: "border-warn bg-warn-soft text-warn",
  crit: "border-crit bg-crit-soft text-crit",
};

type SortKey = "distance" | "stale" | "name";

const SORT_LABEL: Record<SortKey, string> = {
  distance: "Nearest first",
  stale: "Stalest profile first",
  name: "Name (A–Z)",
};

export function NetworkTab({ state, setState }: { state: AppState; setState: (updater: (s: AppState) => AppState) => void }) {
  const [editing, setEditing] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("distance");

  // Every org is read through the engine's override resolution, so an edit is
  // visible here and to computeMatches at the same instant.
  const me = effectiveOrg(state.persona, state);
  const myConfirm = lastConfirmedInfo(me, state);
  const isEdited = (id: string) => state.profileOverrides[id] !== undefined;

  const confirmProfile = (id: string) => setState((s) => ({ ...s, confirmed: { ...s.confirmed, [id]: s.clock } }));

  const saveProfile = (next: ProfileOverride) => {
    setState((s) => ({
      ...s,
      profileOverrides: { ...s.profileOverrides, [s.persona]: next },
      confirmed: { ...s.confirmed, [s.persona]: s.clock }, // editing is confirming — that is the incentive
    }));
    setEditing(false);
  };

  const revert = () => {
    setState((s) => {
      const next = { ...s.profileOverrides };
      delete next[s.persona];
      return { ...s, profileOverrides: next, confirmed: { ...s.confirmed, [s.persona]: s.clock } };
    });
    setEditing(false);
  };

  const sorted = useMemo(() => {
    const rest = ORGS.filter((o) => o.id !== me.id).map((o) => effectiveOrg(o.id, state));
    const by: Record<SortKey, (a: Org, b: Org) => number> = {
      distance: (a, b) => distMiles(me, a) - distMiles(me, b),
      stale: (a, b) => lastConfirmedInfo(b, state).days - lastConfirmedInfo(a, state).days,
      name: (a, b) => a.name.localeCompare(b.name),
    };
    return [me, ...rest.sort(by[sort])];
  }, [me, sort, state]);

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Twelve synthetic partner orgs. Profiles are self-maintained by the org that benefits — a stale profile means you stop receiving free
        food. Claiming a signal re-confirms your profile automatically; so does editing it.
      </p>

      {myConfirm.tone !== "ok" && (
        <Card className={cn("mb-4 gap-0 p-4", myConfirm.tone === "crit" ? "border-crit bg-crit-soft" : "border-warn bg-warn-soft")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={cn("font-display font-bold", myConfirm.tone === "crit" ? "text-crit" : "text-warn")}>
                Your profile is {myConfirm.days} days old.
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                Posters see that age. The longer it sits, the more likely someone works around you instead of pinging you.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => confirmProfile(me.id)}>
                Still right — confirm it
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                Something changed
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Edit your profile
        </Button>
        <span className="text-xs text-muted-foreground">You can only edit {me.name} — the org you are viewing as.</span>
        <div className="grow" />
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="h-8 w-52 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
              <SelectItem key={k} value={k} className="font-mono text-xs">
                {SORT_LABEL[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <CompatibilityMap me={me} orgs={sorted} hoverId={hoverId} onHover={setHoverId} />

      <div className="flex flex-col gap-2.5">
        {sorted.map((o) => {
          const lc = lastConfirmedInfo(o, state);
          const mine = o.id === state.persona;
          const miles = distMiles(me, o);
          const reaches = miles <= o.radius;
          return (
            <Card
              key={o.id}
              onMouseEnter={() => setHoverId(o.id)}
              onMouseLeave={() => setHoverId(null)}
              className={cn("gap-0 p-4", hoverId === o.id && "ring-2 ring-freeze")}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="font-display font-bold">
                  {o.name}
                  {mine && (
                    <Badge className="ml-2 border-freeze bg-freeze-soft font-mono text-[10px] tracking-wider text-freeze" variant="outline">
                      YOU
                    </Badge>
                  )}
                  {isEdited(o.id) && (
                    <Badge className="ml-2 border-ok bg-ok-soft font-mono text-[10px] tracking-wider text-ok" variant="outline">
                      SELF-UPDATED
                    </Badge>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  {mine && lc.tone !== "ok" && (
                    <Button size="xs" variant="outline" className="font-mono text-[10px]" onClick={() => confirmProfile(o.id)}>
                      Confirm profile
                    </Button>
                  )}
                  <Badge className={cn("font-mono text-[10px] tracking-wider", toneClass[lc.tone])} variant="outline">
                    {lc.label.toUpperCase()}
                  </Badge>
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-soft">
                <span>{o.who}</span>
                <span>{o.storage.map((s) => STORAGE_LABEL[s]).join(" · ")}</span>
                <span>
                  open {fmtHour(o.hours[0])}–{fmtHour(o.hours[1])}
                </span>
                <span>travels {o.radius} mi</span>
                {!mine && (
                  <span className={reaches ? undefined : "text-crit"}>
                    {miles.toFixed(1)} mi from you{reaches ? "" : " — out of their range"}
                  </span>
                )}
              </div>

              <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">takes {o.cats.join(" · ")}</div>

              {o.needs.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Standing needs</span>
                  {o.needs.map((n) => (
                    <Badge key={n} variant="outline" className="border-freeze bg-freeze-soft font-mono text-[10px] text-freeze">
                      {n}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {editing && (
        <ProfileEditor
          key={me.id}
          org={me}
          open
          edited={isEdited(me.id)}
          onCancel={() => setEditing(false)}
          onSave={saveProfile}
          onRevert={revert}
        />
      )}
    </div>
  );
}

/* ---------- compatibility mini-map ----------
 * Makes "too far (5.0 mi, travels 4)" legible at a glance. Positions come from
 * the abstract x/y grid in data.ts — this is not a map of Birmingham and no
 * real address is ever plotted.
 */

const VB = 300;
const C = VB / 2;
const USABLE = C - 34;

/** Label offset pushed radially outward from the centre of the map. */
function labelAnchor(dx: number, dy: number): { dx: number; dy: number; anchor: "start" | "middle" | "end" } {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? { dx: 9, dy: 3, anchor: "start" } : { dx: -9, dy: 3, anchor: "end" };
  }
  return dy >= 0 ? { dx: 0, dy: 16, anchor: "middle" } : { dx: 0, dy: -9, anchor: "middle" };
}

interface Plotted {
  org: Org;
  cx: number;
  cy: number;
  miles: number;
  reaches: boolean;
  label: { x: number; y: number; anchor: "start" | "middle" | "end"; show: boolean };
}

function CompatibilityMap({
  me,
  orgs,
  hoverId,
  onHover,
}: {
  me: Org;
  orgs: Org[];
  hoverId: string | null;
  onHover: (id: string | null) => void;
}) {
  const others = orgs.filter((o) => o.id !== me.id);
  const spread = Math.max(me.radius, ...others.map((o) => Math.max(Math.abs(o.x - me.x), Math.abs(o.y - me.y))), 1);
  const scale = USABLE / spread;
  const step = spread <= 6 ? 2 : spread <= 12 ? 4 : 5;
  const rings: number[] = [];
  for (let r = step; r <= spread; r += step) rings.push(r);
  if (rings.length === 0) rings.push(Math.max(1, Math.round(spread)));

  // Greedy label placement: nearest orgs get their label first, and a label that
  // would collide with one already placed is dropped (its dot still carries a
  // tooltip and lights up with its card on hover). Keeps edge-of-network
  // personas, where everything bunches to one side, readable.
  // The YOU marker and its label are reserved first — nothing overprints them.
  const boxes: { x0: number; x1: number; y0: number; y1: number }[] = [
    { x0: C - 12, x1: C + 12, y0: C - 12, y1: C + 12 },
    { x0: C - 10, x1: C + 10, y0: C + 15, y1: C + 27 },
  ];
  const placed = others
    .map((o) => ({ o, miles: distMiles(me, o), cx: C + (o.x - me.x) * scale, cy: C - (o.y - me.y) * scale }))
    .sort((a, b) => a.miles - b.miles);
  // Reserve every dot before placing any label, so no label overprints a dot.
  placed.forEach((p) => boxes.push({ x0: p.cx - 6, x1: p.cx + 6, y0: p.cy - 6, y1: p.cy + 6 }));

  const plotted: Plotted[] = placed.map(({ o, miles, cx, cy }) => {
    const off = labelAnchor(cx - C, cy - C);
    const x = cx + off.dx;
    const y = cy + off.dy;
    const w = o.id.length * 5.2;
    const x0 = off.anchor === "start" ? x : off.anchor === "end" ? x - w : x - w / 2;
    const box = { x0: x0 - 1, x1: x0 + w + 1, y0: y - 8, y1: y + 2 };
    const clash = boxes.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0);
    if (!clash) boxes.push(box);
    return { org: o, cx, cy, miles, reaches: miles <= o.radius, label: { x, y, anchor: off.anchor, show: !clash } };
  });

  return (
    <Card className="mb-4 gap-0 p-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <svg
          viewBox={`0 0 ${VB} ${VB}`}
          role="img"
          aria-label="Partner orgs plotted by distance from you"
          className="w-full max-w-[320px] shrink-0"
        >
          {rings.map((r) => (
            <circle key={r} cx={C} cy={C} r={r * scale} className="fill-none stroke-border" strokeWidth={1} />
          ))}
          <text x={C} y={C - rings[rings.length - 1] * scale - 5} textAnchor="middle" className="fill-muted-foreground font-mono" fontSize={8}>
            {rings[rings.length - 1]} mi
          </text>

          <circle cx={C} cy={C} r={me.radius * scale} className="fill-none stroke-freeze" strokeWidth={1.5} strokeDasharray="4 3" />

          {plotted.map((p) => {
            const hot = hoverId === p.org.id;
            return (
              <g key={p.org.id} onMouseEnter={() => onHover(p.org.id)} onMouseLeave={() => onHover(null)}>
                <title>{`${p.org.name} — ${p.miles.toFixed(1)} mi away, travels ${p.org.radius} mi`}</title>
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={hot ? 6.5 : 4.5}
                  className={p.reaches ? "fill-ok stroke-ok" : "fill-none stroke-crit"}
                  strokeWidth={1.5}
                />
                {(p.label.show || hot) && (
                  <text
                    x={p.label.x}
                    y={p.label.y}
                    textAnchor={p.label.anchor}
                    fontSize={8}
                    className={cn("font-mono", hot ? "fill-foreground font-bold" : "fill-muted-foreground")}
                  >
                    {p.org.id.toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}

          <g>
            <title>{`${me.name} — you`}</title>
            <circle cx={C} cy={C} r={5.5} className="fill-primary" />
            <circle cx={C} cy={C} r={10} className="fill-none stroke-primary" strokeWidth={1} opacity={0.5} />
            <text x={C} y={C + 24} textAnchor="middle" fontSize={8.5} className="fill-primary font-mono font-bold">
              YOU
            </text>
          </g>
        </svg>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          <p className="font-mono text-[10px] tracking-widest uppercase">Who can reach you</p>
          <span className="flex items-center gap-2">
            <svg width="12" height="12" aria-hidden="true" className="shrink-0">
              <circle cx="6" cy="6" r="4.5" className="fill-ok" />
            </svg>
            Will travel far enough to collect from you
          </span>
          <span className="flex items-center gap-2">
            <svg width="12" height="12" aria-hidden="true" className="shrink-0">
              <circle cx="6" cy="6" r="4" className="fill-none stroke-crit" strokeWidth="1.5" />
            </svg>
            Out of their own travel range — never pinged
          </span>
          <span className="flex items-center gap-2">
            <svg width="20" height="12" aria-hidden="true" className="shrink-0">
              <line x1="0" y1="6" x2="20" y2="6" className="stroke-freeze" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            Your travel radius ({me.radius} mi)
          </span>
          <p className="mt-1 leading-relaxed">
            Distance is one of four physical gates — storage, radius, open hours, opted-in category. None of them is a judgement about need.
          </p>
        </div>
      </div>
    </Card>
  );
}
