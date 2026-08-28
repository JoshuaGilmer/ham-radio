import { beforeEach, describe, expect, test } from "vitest";
import { HOLD_MIN, ORGS, orgById } from "./data";
import {
  advanceClock,
  claimSignal,
  computeMatches,
  confirmSignal,
  effectiveOrg,
  freshState,
  lastConfirmedInfo,
  loadScenario,
  loadState,
  pickupSignal,
  postSignal,
  type AppState,
  type SignalForm,
} from "./engine";

// The default demo signal: Ray's dairy, refrigerated, pickup 1–6 PM.
const dairySignal = {
  posterId: "ray",
  category: "dairy",
  storageReq: "cold" as const,
  pickupStart: 13,
  pickupEnd: 18,
};

function stateWith(overrides: AppState["profileOverrides"]): AppState {
  return { ...freshState(), profileOverrides: overrides };
}

describe("profileOverrides", () => {
  test("freshState starts with no profile overrides", () => {
    expect(freshState().profileOverrides).toEqual({});
  });

  test("effectiveOrg returns the seed org untouched when no override exists", () => {
    expect(effectiveOrg("mock", freshState())).toEqual(orgById("mock"));
  });

  test("effectiveOrg merges a partial override over the seed org", () => {
    const s = stateWith({ mock: { radius: 1, needs: ["eggs"] } });
    const o = effectiveOrg("mock", s);
    expect(o.radius).toBe(1);
    expect(o.needs).toEqual(["eggs"]);
    // untouched fields come from the seed
    expect(o.name).toBe(orgById("mock").name);
    expect(o.storage).toEqual(orgById("mock").storage);
  });

  test("computeMatches sees overrides: a radius override excludes a previously compatible org", () => {
    const seedMatch = computeMatches(dairySignal, freshState()).find((m) => m.orgId === "mock");
    expect(seedMatch?.ok).toBe(true);

    const s = stateWith({ mock: { radius: 1 } });
    const m = computeMatches(dairySignal, s).find((x) => x.orgId === "mock");
    expect(m?.ok).toBe(false);
    expect(m?.reasons.join(" ")).toContain("too far");
  });

  test("computeMatches sees overrides: an override can make an incompatible org compatible", () => {
    const seedMatch = computeMatches(dairySignal, freshState()).find((m) => m.orgId === "demo");
    expect(seedMatch?.ok).toBe(false);

    const s = stateWith({
      demo: { storage: ["dry", "cold"], hours: [9, 17], cats: ["dairy", "dry goods", "canned"] },
    });
    const m = computeMatches(dairySignal, s).find((x) => x.orgId === "demo");
    expect(m?.ok).toBe(true);
    expect(m?.reasons).toEqual([]);
  });

  test("computeMatches sees a poster override: moving the poster strands distant orgs", () => {
    const s = stateWith({ ray: { x: 100, y: 100 } });
    const m = computeMatches(dairySignal, s).find((x) => x.orgId === "mock");
    expect(m?.ok).toBe(false);
    expect(m?.reasons.join(" ")).toContain("too far");
  });

  test("lastConfirmedInfo reads an overridden confirmedDaysAgo", () => {
    const seed = lastConfirmedInfo(orgById("notr"), freshState());
    expect(seed.tone).toBe("crit");

    const s = stateWith({ notr: { confirmedDaysAgo: 0 } });
    const info = lastConfirmedInfo(orgById("notr"), s);
    expect(info.days).toBe(0);
    expect(info.tone).toBe("ok");
  });
});

describe("loadState migration", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    // minimal localStorage stand-in for the node test environment
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
  });

  test("backfills profileOverrides on saved states from older builds", () => {
    const old = { ...freshState() } as Record<string, unknown>;
    delete old.profileOverrides;
    store.set("hamradio-demo-v1", JSON.stringify(old));
    expect(loadState().profileOverrides).toEqual({});
  });
});

/* ---------- P0 #2: the matching/escalation proof suite ---------- */

const dairyForm: SignalForm = {
  category: "dairy",
  qty: "120",
  storageReq: "cold",
  expiresHrs: "72",
  pickupStart: 13,
  pickupEnd: 18,
  nextDist: "Wed (can't absorb)",
};

function postedState(form: SignalForm = dairyForm): AppState {
  return postSignal(freshState(), form);
}

describe("computeMatches exclusion gates", () => {
  const matches = computeMatches(dairySignal, freshState());
  const byId = (id: string) => matches.find((m) => m.orgId === id)!;

  test("distance: an org outside its own travel radius is excluded with a 'too far' reason", () => {
    // synt is 5.0 mi from ray but only travels 4 — everything else about it is compatible
    const m = byId("synt");
    expect(m.ok).toBe(false);
    expect(m.reasons).toHaveLength(1);
    expect(m.reasons[0]).toContain("too far");
    expect(m.reasons[0]).toContain("5.0 mi");
  });

  test("storage: an org without the required storage kind is excluded for it", () => {
    expect(byId("demo").reasons.join(" ")).toContain("no refrigerated storage");
  });

  test("category: an org not opted into the category is excluded for it — and only it", () => {
    // plac is close enough, refrigerated, and open — dairy opt-in is its single failure
    const m = byId("plac");
    expect(m.ok).toBe(false);
    expect(m.reasons).toEqual(["not opted into dairy"]);
  });

  test("hours: closing exactly when the window opens counts as closed (edge-touching)", () => {
    // demo is open 9–13 and the window is 13–18: touching, not overlapping
    expect(byId("demo").reasons.join(" ")).toContain("closed during window");
  });

  test("hours: opening exactly when the window ends counts as closed (edge-touching)", () => {
    // synt opens at 15; give it radius via override so hours is the only gate left
    const s: AppState = { ...freshState(), profileOverrides: { synt: { radius: 10 } } };
    const m = computeMatches({ ...dairySignal, pickupStart: 13, pickupEnd: 15 }, s).find((x) => x.orgId === "synt")!;
    expect(m.ok).toBe(false);
    expect(m.reasons).toEqual(["closed during window (open 3 PM–8 PM)"]);
  });
});

describe("no rationing", () => {
  test("every physically compatible org is included simultaneously — no ranking, no waves, no need scoring", () => {
    const matches = computeMatches(dairySignal, freshState());
    // every org except the poster gets a decision…
    expect(matches.map((m) => m.orgId).sort()).toEqual(
      ORGS.filter((o) => o.id !== "ray").map((o) => o.id).sort()
    );
    // …and ALL compatible orgs are ok at once — this is the guardrail proof
    const ok = matches.filter((m) => m.ok).map((m) => m.orgId).sort();
    expect(ok).toEqual(["iron", "mock", "samp", "stnd", "test"]);
    // every exclusion is explained; no match carries a score or rank
    for (const m of matches) {
      if (!m.ok) expect(m.reasons.length).toBeGreaterThan(0);
      else expect(m.reasons).toEqual([]);
    }
  });
});

describe("signal lifecycle", () => {
  test("postSignal creates a posted signal and logs the simultaneous fan-out", () => {
    const s = postedState();
    const sig = s.signals[0];
    expect(sig.status).toBe("posted");
    expect(sig.log[1].msg).toBe("5 of 11 orgs notified simultaneously (physical-compatibility filter)");
  });

  test("post → claim → confirm → picked up, with a real hold and both humans saying yes", () => {
    let s = postedState();
    const id = s.signals[0].id;

    s = claimSignal({ ...s, persona: "mock" }, id, "Claimer picks up");
    let sig = s.signals[0];
    expect(sig.status).toBe("claimed");
    expect(sig.claim).toMatchObject({ orgId: "mock", holdUntil: s.clock + HOLD_MIN });
    expect(sig.transport).toBe("Claimer picks up");
    // claiming re-confirms the claimer's profile — that's how the network stays fresh
    expect(s.confirmed.mock).toBe(s.clock);

    s = confirmSignal({ ...s, persona: "ray" }, id);
    expect(s.signals[0].status).toBe("confirmed");

    s = pickupSignal(s, id);
    expect(s.signals[0].status).toBe("picked_up");
  });

  test("an expired hold reopens the signal to all matched orgs", () => {
    let s = postedState();
    const id = s.signals[0].id;
    s = claimSignal({ ...s, persona: "mock" }, id, "Claimer picks up");
    s = advanceClock(s, HOLD_MIN);
    const sig = s.signals[0];
    expect(sig.status).toBe("posted");
    expect(sig.claim).toBeNull();
    expect(sig.log.at(-1)!.msg).toContain("reopened");
  });

  test("a confirmed transfer survives the hold expiring", () => {
    let s = postedState();
    const id = s.signals[0].id;
    s = claimSignal({ ...s, persona: "mock" }, id, "Claimer picks up");
    s = confirmSignal(s, id);
    s = advanceClock(s, HOLD_MIN * 2);
    expect(s.signals[0].status).toBe("confirmed");
  });

  test("an unclaimed signal escalates exactly when its pickup window closes", () => {
    let s = postedState(); // posted Mon 9:00, window ends 18:00
    s = advanceClock(s, 8 * 60 + 59);
    expect(s.signals[0].status).toBe("posted");
    s = advanceClock(s, 1); // Mon 18:00 on the dot
    const sig = s.signals[0];
    expect(sig.status).toBe("escalated");
    expect(sig.log.at(-1)!.msg).toContain("escalated");
  });

  test("an active claim protects a signal past window close — until the hold lapses", () => {
    let s = postedState();
    const id = s.signals[0].id;
    s = advanceClock(s, 8 * 60 + 45); // Mon 17:45
    s = claimSignal({ ...s, persona: "mock" }, id, "Claimer picks up"); // hold until 18:15
    s = advanceClock(s, 20); // 18:05 — window closed, hold active
    expect(s.signals[0].status).toBe("claimed");
    s = advanceClock(s, 10); // 18:15 — hold lapses, reopens, window already shut
    expect(s.signals[0].status).toBe("escalated");
  });

  test("invalid transitions are no-ops", () => {
    let s = postedState();
    const id = s.signals[0].id;

    // confirming or picking up an unclaimed signal changes nothing
    expect(confirmSignal(s, id).signals[0]).toEqual(s.signals[0]);
    expect(pickupSignal(s, id).signals[0]).toEqual(s.signals[0]);

    // a second claim can't steal an active hold
    s = claimSignal({ ...s, persona: "mock" }, id, "Claimer picks up");
    const stolen = claimSignal({ ...s, persona: "iron" }, id, "Poster drops off");
    expect(stolen.signals[0].claim?.orgId).toBe("mock");

    // picking up before the poster confirms is a no-op
    expect(pickupSignal(s, id).signals[0].status).toBe("claimed");
  });
});

describe("loadScenario", () => {
  test("happy path: signal posted, matches computed, presenter lands one tap from claiming", () => {
    const s = loadScenario("happy");
    expect(s.signals).toHaveLength(1);
    const sig = s.signals[0];
    expect(sig.status).toBe("posted");
    // the presenter persona is a matched org, not the poster — ready to claim
    expect(s.persona).not.toBe(sig.posterId);
    expect(sig.matches.find((m) => m.orgId === s.persona)?.ok).toBe(true);
    expect(sig.matches.filter((m) => m.ok).length).toBeGreaterThan(0);
  });

  test("no takers: signal still posted, exactly one +15m click from escalating", () => {
    const s = loadScenario("noTakers");
    expect(s.signals).toHaveLength(1);
    expect(s.signals[0].status).toBe("posted");
    // the poster is watching their own board when it escalates
    expect(s.persona).toBe(s.signals[0].posterId);
    expect(advanceClock(s, 15).signals[0].status).toBe("escalated");
  });

  test("scenarios are pure: two loads produce identical states", () => {
    expect(loadScenario("happy")).toEqual(loadScenario("happy"));
    expect(loadScenario("noTakers")).toEqual(loadScenario("noTakers"));
  });
});

describe("posting after the window has closed", () => {
  test("a signal posted past its own pickup window escalates immediately and loudly", () => {
    const s = postSignal({ ...freshState(), clock: 19 * 60 }, dairyForm); // Mon 7 PM, window 1-6 PM
    const sig = s.signals[0];
    expect(sig.status).toBe("escalated");
    expect(sig.log.at(-1)!.msg).toContain("already closed");
  });

  test("posting exactly at window close also escalates immediately", () => {
    const s = postSignal({ ...freshState(), clock: 18 * 60 }, dairyForm);
    expect(s.signals[0].status).toBe("escalated");
  });

  test("posting one minute before window close stays posted", () => {
    const s = postSignal({ ...freshState(), clock: 18 * 60 - 1 }, dairyForm);
    expect(s.signals[0].status).toBe("posted");
  });
});
