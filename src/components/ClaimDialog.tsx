import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { STORAGE_LABEL, distMiles, orgById, type Org } from "@/data";
import { fmtHour, type Signal } from "@/engine";

const TRANSPORT_OPTIONS = ["We pick it up", "Poster drops off", "Volunteer driver (FeedBHM)"];

export function ClaimDialog({
  org,
  signal,
  open,
  onCancel,
  onClaim,
}: {
  org: Org;
  signal?: Signal;
  open: boolean;
  onCancel: () => void;
  onClaim: (transport: string) => void;
}) {
  const [transport, setTransport] = useState(TRANSPORT_OPTIONS[0]);
  const poster = signal ? orgById(signal.posterId) : null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Quick check before you claim</DialogTitle>
          <DialogDescription>
            Claiming re-confirms your profile — that&apos;s how the network stays fresh without anyone maintaining a directory.
          </DialogDescription>
        </DialogHeader>

        {/* What you are claiming — the "yes" should be fully informed. */}
        {signal && poster ? (
          <div className="bg-muted/40 rounded-md border p-3 text-sm">
            <p className="mb-1 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">You are claiming</p>
            <p>
              <b>
                {signal.qty} lbs {signal.category}
              </b>{" "}
              · {STORAGE_LABEL[signal.storageReq]} · expires in {signal.expiresHrs} hrs
            </p>
            <p className="text-muted-foreground mt-0.5">
              Pickup {fmtHour(signal.pickupStart)}–{fmtHour(signal.pickupEnd)} today · from {poster.name} ·{" "}
              {distMiles(poster, org).toFixed(1)} mi away
            </p>
          </div>
        ) : null}

        <div className="text-sm">
          <p className="mb-1 font-mono text-[9px] tracking-widest text-muted-foreground uppercase">Your profile on file</p>
          <div className="flex justify-between border-b border-dashed py-1.5">
            <span className="text-muted-foreground">Storage</span>
            <b>{org.storage.map((s) => STORAGE_LABEL[s]).join(" · ")}</b>
          </div>
          <div className="flex justify-between border-b border-dashed py-1.5">
            <span className="text-muted-foreground">Open today</span>
            <b>
              {fmtHour(org.hours[0])}–{fmtHour(org.hours[1])}
            </b>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-muted-foreground">Will travel</span>
            <b>{org.radius} mi</b>
          </div>
        </div>
        <div>
          <Label className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Who moves it?</Label>
          <RadioGroup value={transport} onValueChange={setTransport} className="gap-2">
            {TRANSPORT_OPTIONS.map((t) => (
              <div key={t} className="flex items-center gap-2">
                <RadioGroupItem value={t} id={`t-${t}`} />
                <Label htmlFor={`t-${t}`} className="cursor-pointer text-sm font-normal">
                  {t === "Volunteer driver (FeedBHM)" ? (
                    <>
                      Need a volunteer driver →{" "}
                      <a
                        className="text-freeze underline"
                        href="https://gracekleincommunity.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        FeedBHM
                      </a>
                    </>
                  ) : (
                    t
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onClaim(transport)}>Profile is right — claim it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
