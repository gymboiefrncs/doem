import { z } from "zod";

export const trackEventSchema = z.object({
  eventId: z.uuid(),
  websiteId: z.uuid(),
  visitorId: z.uuid(),
  sessionId: z.uuid(),
  eventName: z.string().min(1, "Event name is required"),
  properties: z.record(z.string(), z.unknown()).optional(),
  url: z.string().url(),
  title: z.string().optional(),
  referrer: z.string().optional(),
  timestamp: z.number().int().positive()
});

export const trackEventResponseSchema = z.object({
  accepted: z.literal(true),
  duplicate: z.boolean()
});

export type TrackEventResponse = z.infer<typeof trackEventResponseSchema>;
export type TrackEventInput = z.infer<typeof trackEventSchema>;
