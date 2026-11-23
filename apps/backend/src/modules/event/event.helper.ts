import { TrackEventBatchInput, TrackEventBatchResponse } from "@doem/shared";
import { eventKey, SessionRow, VisitorRow } from "./event.repository.js";

type IndexedEvents = { event: TrackEventBatchInput["events"][number]; index: number };
type ValidEventSessions = { validEvents: IndexedEvents[]; sessions: Map<string, SessionRow> };

export const filterByWebsite = (
  items: IndexedEvents[],
  existing: Set<string>,
  rejections: Map<number, string>
): IndexedEvents[] =>
  items.filter(({ event, index }) => {
    if (existing.has(event.websiteId)) return true;
    rejections.set(index, "Website not found.");
    return false;
  });

export const filterBySessionOwnership = (
  items: IndexedEvents[],
  rejections: Map<number, string>
): ValidEventSessions => {
  const sessions = new Map<string, SessionRow>();
  const validEvents: IndexedEvents[] = [];

  for (const item of items) {
    const { event, index } = item;
    const key = eventKey(event.websiteId, event.sessionId);
    const existingSession = sessions.get(key);

    if (existingSession && existingSession.visitorId !== event.visitorId) {
      rejections.set(index, "Session does not belong to the specified visitor.");
      continue;
    }

    if (!existingSession) {
      sessions.set(key, {
        websiteId: event.websiteId,
        visitorId: event.visitorId,
        sessionId: event.sessionId
      });
    }

    validEvents.push(item);
  }
  return { validEvents, sessions };
};

export const collectVisitors = (items: IndexedEvents[]): Map<string, VisitorRow> => {
  const visitors = new Map<string, VisitorRow>();

  for (const { event } of items) {
    const key = eventKey(event.websiteId, event.visitorId);

    visitors.set(key, {
      websiteId: event.websiteId,
      visitorId: event.visitorId
    });
  }
  return visitors;
};

export const filterByValidatedSessions = (
  items: IndexedEvents[],
  validSessions: Set<string>,
  rejections: Map<number, string>
): IndexedEvents[] =>
  items.filter(({ event, index }) => {
    const key = eventKey(event.websiteId, event.sessionId);
    if (validSessions.has(key)) return true;
    rejections.set(index, "Session does not belong to the specified visitor.");
    return false;
  });

export const buildResponse = (
  events: TrackEventBatchInput["events"],
  rejections: Map<number, string>
): TrackEventBatchResponse => {
  const result = events.map((event, index) => {
    const rejectionReason = rejections.get(index);

    return rejectionReason
      ? { eventId: event.eventId, status: "rejected" as const, reason: rejectionReason }
      : { eventId: event.eventId, status: "accepted" as const };
  });

  return {
    received: events.length,
    accepted: events.length - rejections.size,
    rejected: rejections.size,
    result
  };
};
