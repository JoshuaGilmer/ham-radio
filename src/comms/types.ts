export interface SmsMessage {
  to: string; // E.164-ish phone number, presenter-supplied
  body: string;
  key: string; // provider API key / relay token, held in memory only — never persisted
  endpoint?: string; // relay URL, for providers whose secret must live server-side
}

export interface SmsResult {
  ok: boolean;
  detail: string;
}

export interface SmsProvider {
  id: string;
  label: string;
  needsKey: boolean;
  needsEndpoint?: boolean;
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
