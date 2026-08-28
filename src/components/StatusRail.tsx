import { cn } from "@/lib/utils";
import type { Signal } from "@/engine";

interface Step {
  label: string;
  tone: "idle" | "on" | "now" | "done" | "crit";
}

const toneClass: Record<Step["tone"], string> = {
  idle: "bg-card text-muted-foreground border-border",
  on: "bg-freeze-soft text-freeze border-freeze",
  now: "bg-accent text-accent-foreground border-primary motion-safe:animate-pulse",
  done: "bg-ok-soft text-ok border-ok",
  crit: "bg-crit-soft text-crit border-crit",
};

export function StatusRail({ signal }: { signal: Signal }) {
  let steps: Step[];
  if (signal.status === "escalated") {
    steps = [
      { label: "POSTED", tone: "on" },
      { label: "NO TAKERS", tone: "crit" },
      { label: "ESCALATED · CFBCA DESK", tone: "crit" },
    ];
  } else {
    const order = ["posted", "claimed", "confirmed", "picked_up"] as const;
    const labels = { posted: "POSTED", claimed: "CLAIMED · HOLD", confirmed: "CONFIRMED", picked_up: "PICKED UP" };
    const idx = order.indexOf(signal.status as (typeof order)[number]);
    steps = order.map((s, i) => ({
      label: labels[s],
      tone: i < idx ? "on" : i === idx ? (s === "picked_up" ? "done" : "now") : "idle",
    }));
  }
  return (
    <div className="flex flex-wrap items-center px-4 pt-3 font-mono text-[10px] font-semibold tracking-wider">
      {steps.map((s, i) => (
        <span key={s.label} className="flex items-center">
          {i > 0 && <span className="px-1.5 text-muted-foreground">→</span>}
          <span className={cn("whitespace-nowrap border px-2 py-1 first:rounded-l", toneClass[s.tone], i === 0 && "rounded-l", i === steps.length - 1 && "rounded-r")}>
            {s.label}
          </span>
        </span>
      ))}
    </div>
  );
}
