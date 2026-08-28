export interface SmsMessage {
  to: string; // E.164-ish phone number, presenter-supplied
  body: string;
  key: string; // provider API key, held in memory only — never persisted
}

export interface SmsResult {
  ok: boolean;
  detail: string;
}

export interface SmsProvider {
  id: string;
  label: string;
  needsKey: boolean;
  hint: string;
  send(msg: SmsMessage): Promise<SmsResult>;
}

export interface OutboxEntry {
  atWallClock: string; // real wall-clock time of the send attempt (comms are real-world)
  provider: string;
  to: string;
  body: string;
  result: SmsResult;
}
