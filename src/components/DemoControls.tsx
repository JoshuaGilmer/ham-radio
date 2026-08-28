import { Button } from "@/components/ui/button";
import { loadScenario, type AppState } from "@/engine";

/** One-click scenario seeding so the judge demo is never hand-assembled live. */
export function DemoControls({ onLoad }: { onLoad: (s: AppState) => void }) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 font-mono text-[11px]"
        title="Seed Scenario A: Ray's dairy signal posted, viewing as Mock Creek — one tap from claiming"
        onClick={() => onLoad(loadScenario("happy"))}
      >
        Scenario A
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 font-mono text-[11px]"
        title="Seed Scenario B: unclaimed signal at 5:50 PM — one +15m click from escalating"
        onClick={() => onLoad(loadScenario("noTakers"))}
      >
        Scenario B
      </Button>
    </>
  );
}
