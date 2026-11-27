import type { TrackEvent } from "./tracker";

export interface StoredEvent {
  websiteId: string;
  eventId: string;
  batchId: string | null;
  payload: TrackEvent;
  createdAt: number;
}

export interface StoredBatch {
  batchId: string;
  websiteId: string;
  eventIds: string[];
  status: "pending" | "sending" | "retry";
  attemptCount: number;
  createdAt: number;
  nextAttemptAt: number | null;
}
