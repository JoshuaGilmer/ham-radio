import { DAYS, HOLD_MIN, ORGS, STORAGE_LABEL, distMiles, orgById, type Org, type StorageKind } from "./data";

export interface Match {
  orgId: string;
  ok: boolean;
  reasons: string[];
  miles: number;
}

export interface Claim {
  orgId: string;
  at: number;
  holdUntil: number;
}

export interface LogEntry {
  at: number;
  msg: string;
}

export type SignalStatus = "posted" | "claimed" | "confirmed" | "picked_up" | "escalated";

export interface Signal {
  id: number;
  posterId: string;
  category: string;
  qty: string;
  storageReq: StorageKind;
  expiresHrs: string;
  pickupStart: number;
  pickupEnd: number;
  nextDist: string;
  postedAt: number;
  postedDay: number;
  status: SignalStatus;
  claim: Claim | null;
  transport: string | null;
  matches: Match[];
  log: LogEntry[];
}

export interface AppState {
  clock: number; // demo-minutes since Monday 00:00
  persona: string;
  seq: number;
  signals: Signal[];
  confirmed: Record<string, number>; // orgId -> clock when profile last confirmed in-demo
  profileOverrides: Record<string, Partial<Org>>; // orgId -> in-demo edits merged over the seed org
}

const LS_KEY = "hamradio-demo-v1";
// Bump when AppState's shape changes: any save that doesn't match resets to a
// fresh demo instead of wedging the board with a stale structure.
const STATE_VERSION = 2;

export function freshState(): AppState {
  return { clock: 9 * 60, persona: "ray", seq: 47, signals: [], confirmed: {}, profileOverrides: {} };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const { v, ...parsed } = JSON.parse(raw) as AppState & { v?: number };
      if (v === STATE_VERSION) return parsed;
    }
  } catch {
    /* storage unavailable — run in-memory */
  }
  return freshState();
}

export function saveState(s: AppState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...s, v: STATE_VERSION }));
  } catch {
    /* storage unavailable — demo still works in-memory */
  }
}

/* ---------- formatting ---------- */

export function fmtClock(mins: number): string {
  const day = DAYS[Math.min(6, Math.floor(mins / 1440))];
  const m = mins % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${day} ${h12}:${mm < 10 ? "0" : ""}${mm} ${ap}`;
}

export function fmtHour(h: number): string {
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ap}`;
}

/** The org as the demo currently sees it: profile overrides merged over the seed data. */
export function effectiveOrg(id: string, s: Pick<AppState, "profileOverrides">): Org {
  const base = orgById(id);
  const ov = s.profileOverrides[id];
  return ov ? { ...base, ...ov } : base;
}

export function lastConfirmedInfo(o: Org, s: AppState): { days: number; label: string; tone: "ok" | "warn" | "crit" } {
  const eff = effectiveOrg(o.id, s);
  const inDemo = s.confirmed[o.id];
  const ageMins = inDemo !== undefined ? s.clock - inDemo : eff.confirmedDaysAgo * 1440 + (s.clock - 9 * 60);
  const days = Math.floor(ageMins / 1440);
  const tone = days <= 3 ? "ok" : days <= 10 ? "warn" : "crit";
  return { days, label: days < 1 ? "profile confirmed today" : `profile confirmed ${days}d ago`, tone };
}

/* ---------- matching: a physical-compatibility gate. It never scores need. ---------- */

export function computeMatches(
  sig: Pick<Signal, "posterId" | "storageReq" | "pickupStart" | "pickupEnd" | "category">,
  s: Pick<AppState, "profileOverrides"> = { profileOverrides: {} }
): Match[] {
  const poster = effectiveOrg(sig.posterId, s);
  return ORGS.filter((base) => base.id !== sig.posterId).map((base) => {
    const o = effectiveOrg(base.id, s);
    const reasons: string[] = [];
    const d = distMiles(poster, o);
    if (d > o.radius) reasons.push(`too far (${d.toFixed(1)} mi, travels ${o.radius})`);
    if (!o.storage.includes(sig.storageReq)) reasons.push(`no ${STORAGE_LABEL[sig.storageReq].toLowerCase()} storage`);
    if (!(o.hours[0] < sig.pickupEnd && o.hours[1] > sig.pickupStart))
      reasons.push(`closed during window (open ${fmtHour(o.hours[0])}–${fmtHour(o.hours[1])})`);
    if (!o.cats.includes(sig.category)) reasons.push(`not opted into ${sig.category}`);
    return { orgId: o.id, ok: reasons.length === 0, reasons, miles: d };
  });
}

/* ---------- state transitions (pure) ---------- */

function tick(s: AppState): AppState {
  const signals = s.signals.map((f) => {
    let next = f;
    if (next.status === "claimed" && next.claim && s.clock >= next.claim.holdUntil) {
      next = {
        ...next,
        status: "posted",
        claim: null,
        transport: null,
        log: [...next.log, { at: s.clock, msg: "Claim hold expired — reopened to all matched orgs" }],
      };
    }
    const windowEnd = next.postedDay * 1440 + next.pickupEnd * 60;
    if (next.status === "posted" && s.clock >= windowEnd) {
      next = {
        ...next,
        status: "escalated",
        log: [...next.log, { at: s.clock, msg: "Pickup window closed with no confirmed transfer — escalated" }],
      };
    }
    return next;
  });
  return { ...s, signals };
}

export function advanceClock(s: AppState, mins: number): AppState {
  return tick({ ...s, clock: s.clock + mins });
}

export interface SignalForm {
  category: string;
  qty: string;
  storageReq: StorageKind;
  expiresHrs: string;
  pickupStart: number;
  pickupEnd: number;
  nextDist: string;
}

export function postSignal(s: AppState, form: SignalForm): AppState {
  const seq = s.seq + 1;
  const matches = computeMatches({ posterId: s.persona, ...form }, s);
  const n = matches.filter((m) => m.ok).length;
  const postedDay = Math.floor(s.clock / 1440);
  // A window that's already shut can't silently escalate on the next tick —
  // a dead signal is loud from the moment it's sent.
  const alreadyClosed = s.clock >= postedDay * 1440 + form.pickupEnd * 60;
  const sig: Signal = {
    id: seq,
    posterId: s.persona,
    ...form,
    postedAt: s.clock,
    postedDay,
    status: alreadyClosed ? "escalated" : "posted",
    claim: null,
    transport: null,
    matches,
    log: [
      { at: s.clock, msg: "Signal sent" },
      { at: s.clock, msg: `${n} of ${ORGS.length - 1} orgs notified simultaneously (physical-compatibility filter)` },
      ...(alreadyClosed
        ? [{ at: s.clock, msg: "Pickup window had already closed when this signal was sent — escalated immediately" }]
        : []),
    ],
  };
  return { ...s, seq, signals: [sig, ...s.signals] };
}

export function claimSignal(s: AppState, id: number, transport: string): AppState {
  const signals = s.signals.map((f) => {
    if (f.id !== id || f.status !== "posted") return f;
    return {
      ...f,
      status: "claimed" as const,
      claim: { orgId: s.persona, at: s.clock, holdUntil: s.clock + HOLD_MIN },
      transport,
      log: [
        ...f.log,
        { at: s.clock, msg: `${orgById(s.persona).name} claimed — held ${HOLD_MIN} min for poster confirmation. Transport: ${transport}` },
      ],
    };
  });
  // claiming re-confirms your profile — that's how the network stays fresh
  return { ...s, signals, confirmed: { ...s.confirmed, [s.persona]: s.clock } };
}

export function confirmSignal(s: AppState, id: number): AppState {
  const signals = s.signals.map((f) =>
    f.id === id && f.status === "claimed"
      ? { ...f, status: "confirmed" as const, log: [...f.log, { at: s.clock, msg: "Poster confirmed transfer — both humans said yes" }] }
      : f
  );
  return { ...s, signals };
}

/* ---------- demo scenarios: seeded mid-story so the demo is never hand-assembled live ---------- */

export type ScenarioName = "happy" | "noTakers";

export function loadScenario(name: ScenarioName): AppState {
  if (name === "happy") {
    // Ray posted the default dairy signal at 9:14 AM; the presenter lands as
    // Mock Creek with the signal on their board, one tap from claiming.
    const posted = postSignal(
      { ...freshState(), clock: 9 * 60 + 14 },
      {
        category: "dairy",
        qty: "120",
        storageReq: "cold",
        expiresHrs: "72",
        pickupStart: 13,
        pickupEnd: 18,
        nextDist: "Wed (can't absorb)",
      }
    );
    return { ...posted, persona: "mock" };
  }
  // No takers: Ray's prepared-food signal has sat unclaimed all day. The clock
  // lands at 5:50 PM — one +15m click past the 6 PM window close, straight into
  // the escalation screen.
  const posted = postSignal(freshState(), {
    category: "prepared",
    qty: "60",
    storageReq: "cold",
    expiresHrs: "8",
    pickupStart: 13,
    pickupEnd: 18,
    nextDist: "None today",
  });
  return advanceClock(posted, 8 * 60 + 50);
}

export function pickupSignal(s: AppState, id: number): AppState {
  const signals = s.signals.map((f) =>
    f.id === id && f.status === "confirmed"
      ? { ...f, status: "picked_up" as const, log: [...f.log, { at: s.clock, msg: "Marked picked up" }] }
      : f
  );
  return { ...s, signals };
}
