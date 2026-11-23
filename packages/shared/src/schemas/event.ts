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

export const trackEventBatchSchema = z.object({
  events: z.array(trackEventSchema).min(1, "At least one event is required").max(10)
});

export const trackEventBatchResponseSchema = z.object({
  received: z.number().int().positive(),
  accepted: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
  result: z.array(
    z.discriminatedUnion("status", [
      z.object({
        eventId: z.uuid(),
        status: z.literal("accepted")
      }),
      z.object({
        eventId: z.uuid(),
        status: z.literal("rejected"),
        reason: z.string()
      })
    ])
  )
});

export const trackEventResponseSchema = z.object({
  accepted: z.literal(true),
  duplicate: z.boolean()
});

export type TrackEventResponse = z.infer<typeof trackEventResponseSchema>;
export type TrackEventInput = z.infer<typeof trackEventSchema>;
export type TrackEventBatchInput = z.infer<typeof trackEventBatchSchema>;
export type TrackEventBatchResponse = z.infer<typeof trackEventBatchResponseSchema>;
