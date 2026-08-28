import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ORGS, orgById } from "@/data";
import {
  advanceClock,
  claimSignal,
  confirmSignal,
  fmtClock,
  freshState,
  loadState,
  pickupSignal,
  postSignal,
  saveState,
  type AppState,
  type SignalForm as SignalFormValues,
} from "@/engine";
import { ClaimDialog } from "@/components/ClaimDialog";
import { DemoControls } from "@/components/DemoControls";
import { CommsPanel } from "@/comms/CommsPanel";
import { NetworkTab } from "@/components/NetworkTab";
import { SignalForm } from "@/components/SignalForm";
import { SignalTicket } from "@/components/SignalTicket";

export default function App() {
  const [state, setState] = useState<AppState>(loadState);
  const [showForm, setShowForm] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  useEffect(() => saveState(state), [state]);

  const me = orgById(state.persona);
  const mine = state.signals.filter((f) => f.posterId === state.persona);
  const incoming = state.signals.filter((f) => {
    if (f.posterId === state.persona) return false;
    const m = f.matches.find((x) => x.orgId === state.persona);
    const involved = f.claim?.orgId === state.persona;
    return (m?.ok && f.status !== "picked_up" && f.status !== "escalated") || involved;
  });

  const submitSignal = (v: SignalFormValues) => {
    setState((s) => postSignal(s, v));
    setShowForm(false);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 border-b border-warn bg-warn-soft px-3 py-1.5 text-center font-mono text-[11px] font-semibold tracking-widest text-warn">
        DEMO — EVERY ORGANIZATION, NUMBER, AND SIGNAL ON THIS SCREEN IS SYNTHETIC. NOTHING HERE IS LIVE AVAILABILITY.
      </div>

      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b bg-card px-5 py-3">
        <span className="font-display text-xl font-extrabold tracking-tight">
          Ham Radio<span className="text-primary">.</span>
        </span>
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-[10px] tracking-widest text-muted-foreground uppercase">Demo clock</span>
          <span className="min-w-[8.5ch] rounded border bg-secondary px-2 py-1 text-center font-semibold tabular-nums">
            {fmtClock(state.clock)}
          </span>
          <Button variant="outline" size="sm" className="h-7 px-2 font-mono text-[11px]" onClick={() => setState((s) => advanceClock(s, 15))}>
            +15m
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 font-mono text-[11px]" onClick={() => setState((s) => advanceClock(s, 60))}>
            +1h
          </Button>
          <DemoControls onLoad={setState} />
        </div>
        <div className="grow" />
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Viewing as</span>
        <Select
          value={state.persona}
          onValueChange={(v) => {
            setState((s) => ({ ...s, persona: v }));
            setShowForm(false);
          }}
        >
          <SelectTrigger className="h-8 max-w-64 font-mono text-xs font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORGS.map((o) => (
              <SelectItem key={o.id} value={o.id} className="font-mono text-xs">
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" className="h-7 font-mono text-[11px]" onClick={() => setState(freshState())}>
          Reset demo
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-4 pb-16">
        <Tabs defaultValue="board">
          <TabsList className="mb-3">
            <TabsTrigger value="board" className="font-display font-bold">
              Board
            </TabsTrigger>
            <TabsTrigger value="network" className="font-display font-bold">
              Network
            </TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            {showForm ? (
              <SignalForm orgName={me.name} personaId={state.persona} profileOverrides={state.profileOverrides} onSubmit={submitSignal} onCancel={() => setShowForm(false)} />
            ) : (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Button onClick={() => setShowForm(true)}>+ Put out a signal</Button>
                <span className="text-xs text-muted-foreground">~60 seconds. Only physically compatible orgs get pinged.</span>
              </div>
            )}

            <h2 className="font-display mt-6 mb-2.5 font-bold">Incoming — matched to you ({incoming.length})</h2>
            {incoming.length ? (
              <div className="flex flex-col gap-4">
                {incoming.map((f) => (
                  <SignalTicket
                    key={f.id}
                    signal={f}
                    mine={false}
                    personaId={state.persona}
                    clock={state.clock}
                    onOpenClaim={setClaimingId}
                    onConfirm={(id) => setState((s) => confirmSignal(s, id))}
                    onPickup={(id) => setState((s) => pickupSignal(s, id))}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
                No incoming signals match your profile right now. You are only ever pinged about food you can physically store, near you,
                during hours you are open.
              </div>
            )}

            <h2 className="font-display mt-8 mb-2.5 font-bold">Your signals ({mine.length})</h2>
            {mine.length ? (
              <div className="flex flex-col gap-4">
                {mine.map((f) => (
                  <SignalTicket
                    key={f.id}
                    signal={f}
                    mine
                    personaId={state.persona}
                    clock={state.clock}
                    onOpenClaim={setClaimingId}
                    onConfirm={(id) => setState((s) => confirmSignal(s, id))}
                    onPickup={(id) => setState((s) => pickupSignal(s, id))}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
                Nothing posted. When inventory outruns your distribution schedule, put out a signal instead of working the phone tree.
              </div>
            )}
          </TabsContent>

          <TabsContent value="network">
            <NetworkTab state={state} />
          </TabsContent>
        </Tabs>
      </main>

      <CommsPanel signals={state.signals} />

      <footer className="mx-auto max-w-5xl px-5 pb-12 text-xs text-muted-foreground">
        <p>
          Ham Radio · Claude Impact Lab, Birmingham AI. Org-to-org only — no client data. Humans confirm both ends of every transfer; the
          filter gates physical compatibility only and never scores need.
        </p>
        <p className="mt-1.5">
          Verified links (real):{" "}
          <a className="text-freeze underline" href="https://www.211connectsalabama.org" target="_blank" rel="noopener noreferrer">
            211 Connects Alabama
          </a>{" "}
          ·{" "}
          <a className="text-freeze underline" href="https://feedingal.org" target="_blank" rel="noopener noreferrer">
            Community Food Bank of Central Alabama
          </a>{" "}
          ·{" "}
          <a className="text-freeze underline" href="https://gracekleincommunity.com" target="_blank" rel="noopener noreferrer">
            Grace Klein / FeedBHM volunteer drivers
          </a>
        </p>
      </footer>

      {claimingId !== null && (
        <ClaimDialog
          org={me}
          signal={state.signals.find((f) => f.id === claimingId)}
          open
          onCancel={() => setClaimingId(null)}
          onClaim={(transport) => {
            setState((s) => claimSignal(s, claimingId, transport));
            setClaimingId(null);
          }}
        />
      )}
    </div>
  );
}
