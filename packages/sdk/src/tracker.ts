import { createBatcher } from "./batcher";
import { openDatabase } from "./idb";
import { getOrCreateSession } from "./session";
import { createStorage } from "./storage";
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

export const createTracker = async (config: TrackerConfig) => {
  const db = await openDatabase();
  const visitorId = getVisitorId(config.websiteId);
  const transport = createTransport({ apiUrl: config.apiUrl });
  const storage = createStorage(db);
  const batcher = createBatcher(storage, transport);

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

  const track = (eventName: string, properties?: Record<string, unknown>): TrackEvent => {
    const event = createEvent(eventName, properties);
    batcher.addEvent(event).catch((error) => {
      console.error("[DOEM] Failed to add event to batcher:", error);
    });
    return event;
  };

  const trackPageView = (properties?: Record<string, unknown>): TrackEvent => {
    return track("page_view", properties);
  };

  return {
    track,
    trackPageView
  };
};
