export type StorageKind = "dry" | "cold" | "frozen";

export interface Org {
  id: string;
  name: string;
  who: string;
  x: number; // miles, abstract grid
  y: number;
  radius: number; // how far they'll travel, miles
  storage: StorageKind[];
  hours: [number, number]; // open hours, 24h
  cats: string[];
  needs: string[];
  confirmedDaysAgo: number; // seeded profile age
}

export const CATS = ["dairy", "produce", "meat", "prepared", "dry goods", "canned"];

export const STORAGE_LABEL: Record<StorageKind, string> = {
  dry: "Dry",
  cold: "Refrigerated",
  frozen: "Frozen",
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const HOLD_MIN = 30;

// Synthetic network. Every org, number, and signal in this demo is invented —
// names are deliberately, obviously fictional per the Impact Lab guardrails.
export const ORGS: Org[] = [
  { id: "ray",  name: "Fauxfield Church Pantry",    who: "Ray — volunteer coordinator", x: 0,   y: 0,  radius: 8,  storage: ["dry", "cold"],           hours: [8, 18],  cats: CATS,                                    needs: ["rice"],        confirmedDaysAgo: 2 },
  { id: "mock", name: "Mock Creek Ministries",      who: "Deb — pantry lead",           x: 2,   y: 1,  radius: 10, storage: ["dry", "cold", "frozen"], hours: [9, 17],  cats: ["dairy", "produce", "meat", "dry goods"], needs: ["rice"],      confirmedDaysAgo: 3 },
  { id: "samp", name: "Sampletown Community Fridge", who: "Otis — fridge steward",      x: 1.5, y: -1, radius: 5,  storage: ["cold"],                  hours: [7, 21],  cats: ["dairy", "produce", "prepared"],        needs: [],              confirmedDaysAgo: 1 },
  { id: "demo", name: "Demo Heights Food Shelf",    who: "Gwen — shelf manager",        x: 4,   y: 3,  radius: 6,  storage: ["dry"],                   hours: [9, 13],  cats: ["dry goods", "canned"],                 needs: ["canned veg"],  confirmedDaysAgo: 12 },
  { id: "plac", name: "Placebo Park Pantry",        who: "Hal — Saturday crew",         x: -3,  y: 2,  radius: 4,  storage: ["dry", "cold"],           hours: [10, 16], cats: ["produce", "dry goods"],                needs: [],              confirmedDaysAgo: 5 },
  { id: "test", name: "Testerson Table",            who: "Marisol — director",          x: 6,   y: -2, radius: 12, storage: ["dry", "cold", "frozen"], hours: [9, 17],  cats: CATS,                                    needs: ["cooking oil"], confirmedDaysAgo: 0 },
  { id: "notr", name: "Notreal North Pantry",       who: "Ed — part-time",              x: -7,  y: 6,  radius: 3,  storage: ["dry"],                   hours: [9, 12],  cats: ["dry goods"],                           needs: [],              confirmedDaysAgo: 30 },
  { id: "synt", name: "Synthetic Springs Shelter",  who: "Priya — kitchen lead",        x: 3,   y: -4, radius: 4,  storage: ["cold"],                  hours: [15, 20], cats: ["prepared", "dairy"],                   needs: [],              confirmedDaysAgo: 4 },
  { id: "iron", name: "Imaginary Iron Fridge",      who: "Coach T — volunteer",         x: -1,  y: -2, radius: 6,  storage: ["cold", "frozen"],        hours: [6, 22],  cats: ["dairy", "meat", "prepared"],           needs: ["bread"],       confirmedDaysAgo: 1 },
  { id: "pret", name: "Pretend Valley Co-op",       who: "June — buyer",                x: 8,   y: 8,  radius: 15, storage: ["dry", "cold"],           hours: [9, 17],  cats: ["produce", "dry goods"],                needs: [],              confirmedDaysAgo: 9 },
  { id: "blue", name: "Blueprint Baptist Pantry",   who: "Rev. Okafor",                 x: -2,  y: 5,  radius: 5,  storage: ["dry"],                   hours: [8, 11],  cats: ["dry goods", "canned"],                 needs: [],              confirmedDaysAgo: 7 },
  { id: "stnd", name: "Stand-In Shepherd Kitchen",  who: "Lena — chef",                 x: 0.5, y: 3,  radius: 7,  storage: ["cold"],                  hours: [11, 19], cats: ["prepared", "produce", "dairy"],        needs: ["eggs"],        confirmedDaysAgo: 2 },
];

export function orgById(id: string): Org {
  const o = ORGS.find((x) => x.id === id);
  if (!o) throw new Error("unknown org " + id);
  return o;
}

export function distMiles(a: Org, b: Org): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
