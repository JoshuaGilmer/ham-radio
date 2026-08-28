import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orgById } from "@/data";
import type { Signal } from "@/engine";
import { composeSignalSms } from "./composer";
import { PROVIDERS } from "./providers";
import type { OutboxEntry } from "./types";

/**
 * Presenter tooling: text a judge a real SMS for the signal on screen.
 * Opt-in by construction — a human picks the signal, supplies the number,
 * attests consent, and presses send. Nothing is automatic.
 */
const DEFAULT_RELAY = "https://ham-radio-relay.vercel.app/api/send";
const PREFS_KEY = "hamradio-comms-prefs-v1";

/** Forgiving phone entry → E.164. "205-306-5895", "(205) 306 5895", "12053065895" all → +12053065895. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return digits ? "+" + digits : "";
}
const isE164 = (p: string) => /^\+\d{11,15}$/.test(p);

// Presenter convenience: provider/phone/relay persist per-browser so the demo
// opens prefilled after a rehearsal. The token is deliberately NOT persisted —
// it stays in memory only and is re-pasted each session.
function loadPrefs(): { providerId: string; phone: string; endpoint: string } {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { providerId: "simulated", phone: "", endpoint: DEFAULT_RELAY, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return { providerId: "simulated", phone: "", endpoint: DEFAULT_RELAY };
}

export function CommsPanel({ signals }: { signals: Signal[] }) {
  const prefs = loadPrefs();
  const [open, setOpen] = useState(false);
  const [providerId, setProviderIdRaw] = useState(prefs.providerId);
  const [phone, setPhoneRaw] = useState(prefs.phone);
  const [key, setKey] = useState(""); // memory only — never persisted
  const [endpoint, setEndpointRaw] = useState(prefs.endpoint); // relay URL for server-side-secret providers

  const savePrefs = (next: Partial<{ providerId: string; phone: string; endpoint: string }>) => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ providerId, phone, endpoint, ...next }));
    } catch {
      /* storage unavailable */
    }
  };
  const setProviderId = (v: string) => {
    setProviderIdRaw(v);
    savePrefs({ providerId: v });
  };
  const setPhone = (v: string) => {
    setPhoneRaw(v);
    savePrefs({ phone: v });
  };
  const setEndpoint = (v: string) => {
    setEndpointRaw(v);
    savePrefs({ endpoint: v });
  };
  const [consent, setConsent] = useState(false);
  const [signalId, setSignalId] = useState<string>("latest");
  const [sending, setSending] = useState(false);
  const [outbox, setOutbox] = useState<OutboxEntry[]>([]);

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0];
  const target = signalId === "latest" ? signals[0] : signals.find((s) => String(s.id) === signalId);
  const body = useMemo(() => (target ? composeSignalSms(target) : ""), [target]);

  const normalizedPhone = normalizePhone(phone);
  const phoneOk = isE164(normalizedPhone);
  const ready =
    !!target &&
    consent &&
    (provider.id === "simulated" ||
      (phoneOk && (!provider.needsKey || !!key.trim()) && (!provider.needsEndpoint || !!endpoint.trim())));

  const doSend = async () => {
    if (!ready || !target) return;
    setSending(true);
    const result = await provider.send({ to: normalizedPhone, body, key: key.trim(), endpoint: endpoint.trim() || undefined });
    setOutbox((o) => [
      { atWallClock: new Date().toLocaleTimeString(), provider: provider.label, to: provider.id === "simulated" ? "(on-screen)" : normalizedPhone, body, result },
      ...o,
    ]);
    setSending(false);
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-8">
      <button
        className="font-mono text-[11px] font-semibold tracking-widest text-muted-foreground uppercase hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        {open ? "▾" : "▸"} Presenter tools — SMS demo
      </button>

      {open && (
        <Card className="mt-2 gap-0 p-5">
          <p className="mb-4 text-xs text-muted-foreground">
            Text a judge the signal on screen. Every message is prefixed as demo/synthetic. API keys live in memory only — this page can
            keep no secrets. Default provider is simulated and sends nothing.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-1.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Provider</Label>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">{provider.hint}</p>
            </div>
            <div>
              <Label className="mb-1.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Signal</Label>
              <Select value={signalId} onValueChange={setSignalId}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest signal</SelectItem>
                  {signals.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      #{s.id} · {s.category} · {orgById(s.posterId).name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {provider.id !== "simulated" && (
              <div>
                <Label className="mb-1.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Judge&apos;s phone</Label>
                <Input placeholder="205-555-1234" value={phone} aria-invalid={!!phone.trim() && !phoneOk} onChange={(e) => setPhone(e.target.value)} />
                {phone.trim() && !phoneOk && <p className="mt-1 text-xs text-crit">Enter a full number, e.g. 205-306-5895.</p>}
                {phoneOk && normalizedPhone !== phone.trim() && (
                  <p className="mt-1 text-xs text-muted-foreground">Will send to {normalizedPhone}</p>
                )}
              </div>
            )}
            {provider.needsKey && (
              <div>
                <Label className="mb-1.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">
                  {provider.needsEndpoint ? "Relay token (memory only)" : "API key (memory only)"}
                </Label>
                <Input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} />
              </div>
            )}
            {provider.needsEndpoint && (
              <div>
                <Label className="mb-1.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Relay URL</Label>
                <Input placeholder="https://<your-relay>.vercel.app/api/send" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
              </div>
            )}
          </div>

          <div className="mt-4">
            <Label className="mb-1.5 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Message preview</Label>
            <div className="rounded border bg-secondary p-3 font-mono text-xs leading-relaxed break-words">
              {body || "No signals yet — post one on the board first."}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              The recipient agreed to receive this demo text
            </label>
            <Button size="sm" disabled={!ready || sending} onClick={doSend}>
              {sending ? "Sending…" : provider.id === "simulated" ? "Simulate send" : "Send SMS"}
            </Button>
          </div>

          {outbox.length > 0 && (
            <div className="mt-5">
              <h4 className="mb-2 font-mono text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Outbox</h4>
              <div className="flex flex-col gap-2">
                {outbox.map((e, i) => (
                  <div key={i} className="rounded border p-2.5 text-xs">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          e.result.ok
                            ? "border-ok bg-ok-soft font-mono text-[10px] tracking-wider text-ok"
                            : "border-crit bg-crit-soft font-mono text-[10px] tracking-wider text-crit"
                        }
                      >
                        {e.result.ok ? "SENT" : "FAILED"}
                      </Badge>
                      <span className="font-mono text-muted-foreground">
                        {e.atWallClock} · {e.provider} → {e.to}
                      </span>
                      <span className="text-muted-foreground">{e.result.detail}</span>
                    </div>
                    <div className="font-mono break-words text-foreground/80">{e.body}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
