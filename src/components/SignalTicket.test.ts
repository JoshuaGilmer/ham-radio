import { describe, expect, test } from "vitest";
import { holdTone } from "./SignalTicket";

// The hold chip's urgency thresholds (Chris's lane): ok above 15 demo-minutes,
// warn at 15 and under, crit at 5 and under — boundaries inclusive.
describe("holdTone", () => {
  test("comfortable hold is ok", () => {
    expect(holdTone(30)).toBe("ok");
    expect(holdTone(16)).toBe("ok");
  });

  test("15 demo-minutes and under is warn", () => {
    expect(holdTone(15)).toBe("warn");
    expect(holdTone(6)).toBe("warn");
  });

  test("5 demo-minutes and under is crit", () => {
    expect(holdTone(5)).toBe("crit");
    expect(holdTone(1)).toBe("crit");
    expect(holdTone(0)).toBe("crit");
  });
});
