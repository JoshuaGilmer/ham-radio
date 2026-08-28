import { STORAGE_LABEL, orgById } from "@/data";
import { fmtClock, fmtHour, type Signal } from "@/engine";

// Every outbound message is explicitly labeled as demo/synthetic — guardrail, not garnish.
const DEMO_PREFIX = "[HAM RADIO DEMO - synthetic data]";

const STATUS_LINE: Record<Signal["status"], (s: Signal) => string> = {
  posted: (s) => `OPEN - ${s.matches.filter((m) => m.ok).length} compatible orgs notified`,
  claimed: (s) => `CLAIMED by ${s.claim ? orgById(s.claim.orgId).name : "?"} (pending poster confirmation)`,
  confirmed: (s) => `CONFIRMED - transfer agreed by both parties${s.transport ? `, ${s.transport.toLowerCase()}` : ""}`,
  picked_up: () => "RESOLVED - picked up",
  escalated: () => "ESCALATED - no takers in time, routed to CFBCA desk",
};

export function composeSignalSms(signal: Signal): string {
  const poster = orgById(signal.posterId);
  const parts = [
    DEMO_PREFIX,
    `Signal #${signal.id}: ${signal.qty} lbs ${signal.category} (${STORAGE_LABEL[signal.storageReq].toLowerCase()}), expires in ${signal.expiresHrs} hrs.`,
    `Pickup ${fmtHour(signal.pickupStart)}-${fmtHour(signal.pickupEnd)}.`,
    `From ${poster.name}, posted ${fmtClock(signal.postedAt)} (demo clock).`,
    `Status: ${STATUS_LINE[signal.status](signal)}.`,
  ];
  return parts.join(" ").slice(0, 320);
}
