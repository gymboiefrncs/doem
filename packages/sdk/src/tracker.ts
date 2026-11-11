import { getOrCreateSession } from "./session";
import { getVisitorId } from "./visitor";

export interface TrackEvent {
  eventId: string;
  websiteId: string;
  visitorId: string;
  sessionId: string;
  eventName: string;
  properties?: Record<string, unknown>;
  url: string;
  title?: string;
  referrer?: string;
  timestamp: number;
}

interface TrackerConfig {
  websiteId: string;
}

export const createTracker = (config: TrackerConfig) => {
  const visitorId = getVisitorId(config.websiteId);

  const createEvent = (eventName: string, properties?: Record<string, unknown>): TrackEvent => {
    const session = getOrCreateSession(config.websiteId);

    return {
      eventId: crypto.randomUUID(),
      websiteId: config.websiteId,
      visitorId,
      sessionId: session.sessionId,
      eventName,
      properties,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer || undefined,
      timestamp: Date.now()
    };
  };

  return {
    track(eventName: string, properties?: Record<string, unknown>): TrackEvent {
      return createEvent(eventName, properties);
    }
  };
};
