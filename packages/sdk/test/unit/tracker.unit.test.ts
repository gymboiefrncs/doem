import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTracker } from "../../src/tracker";

const { send } = vi.hoisted(() => ({
  send: vi.fn().mockResolvedValue(undefined)
}));

vi.mock("../../src/visitor", () => ({
  getVisitorId: vi.fn(() => "mock-visitor-id")
}));

vi.mock("../../src/session", () => ({
  getOrCreateSession: vi.fn(() => ({ sessionId: "mock-session-id", lastActivity: 0 }))
}));

vi.mock("../../src/transport", () => ({
  createTransport: vi.fn(() => ({ send }))
}));

const config = {
  websiteId: "test-website-id",
  apiUrl: "http://localhost:3000/api/v1"
};

const NOW = new Date("2026-01-01T00:00:00.000Z");

describe("createTracker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubGlobal("crypto", { randomUUID: () => "mock-event-id" });
    document.title = "Test Page";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("track", () => {
    it("exposes a track function", () => {
      const tracker = createTracker(config);
      expect(tracker).toHaveProperty("track");
    });

    it("builds a complete event from the current page state", () => {
      const tracker = createTracker(config);

      const event = tracker.track("button_click", { plan: "pro" });

      expect(event).toEqual({
        eventId: "mock-event-id",
        websiteId: config.websiteId,
        visitorId: "mock-visitor-id",
        sessionId: "mock-session-id",
        eventName: "button_click",
        properties: { plan: "pro" },
        url: window.location.href,
        title: "Test Page",
        referrer: undefined,
        timestamp: NOW.getTime()
      });
    });

    it("sends the same event it returns through the transport", () => {
      const tracker = createTracker(config);

      const event = tracker.track("button_click", { plan: "pro" });

      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith(event);
    });

    it("includes the referrer when the document has one", () => {
      vi.spyOn(document, "referrer", "get").mockReturnValue("https://example.com/");
      const tracker = createTracker(config);

      const event = tracker.track("page_view");

      expect(event.referrer).toBe("https://example.com/");
    });

    it("logs and still returns the event when the transport rejects", async () => {
      const error = new Error("boom");
      send.mockRejectedValueOnce(error);
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const tracker = createTracker(config);

      const event = tracker.track("button_click");
      await vi.advanceTimersByTimeAsync(0);

      expect(event.eventName).toBe("button_click");
      expect(consoleError).toHaveBeenCalledWith("[DOEM] Failed to send event:", error);
    });
  });
});
