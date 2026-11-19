import { getOrCreateSession } from "./session";
import { createTransport } from "./transport";
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
  apiUrl: string;
}

export const createTracker = (config: TrackerConfig) => {
  const visitorId = getVisitorId(config.websiteId);
  const transport = createTransport({ apiUrl: config.apiUrl });

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
      const event = createEvent(eventName, properties);
      transport.send(event).catch((error) => {
        console.error("[DOEM] Failed to send event:", error);
      });
      return event;
    }
  };
};
