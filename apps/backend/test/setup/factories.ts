import { TrackEventInput } from "@doem/shared";
import { randomUUID } from "node:crypto";

const defaults = { name: "My Website", domain: "example.com", timezone: "UTC" };
export const buildTrackEventInput = (
  overrides: Partial<TrackEventInput> = {}
): TrackEventInput => ({
  eventId: randomUUID(),
  websiteId: randomUUID(),
  visitorId: randomUUID(),
  sessionId: randomUUID(),
  eventName: "page_view",
  properties: { plan: "free" },
  url: "https://example.com/pricing",
  title: "Pricing",
  referrer: "https://google.com",
  timestamp: Date.now(),
  ...overrides
});

export const buildWebsiteInput = (overrides: Partial<typeof defaults> = {}) => ({
  ...defaults,
  ...overrides
});
