import { beforeEach, describe, expect, test } from "vitest";
import { orgById } from "./data";
import {
  computeMatches,
  effectiveOrg,
  freshState,
  lastConfirmedInfo,
  loadState,
  type AppState,
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
