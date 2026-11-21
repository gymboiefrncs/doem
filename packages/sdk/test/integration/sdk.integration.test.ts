import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initialize } from "../../src/client";

const API_URL = "http://localhost:3000/api/v1";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

const fetchMock = vi.fn();

const sentEvents = () =>
  fetchMock.mock.calls.map(([, init]) => JSON.parse((init as RequestInit).body as string));

describe("SDK integration", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    document.title = "Test Page";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("sends a tracked event to the API with the persisted visitor and session", () => {
    const client = initialize({ websiteId: "site-1" });

    const event = client.track("button_click", { plan: "pro" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/events`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );

    const [sent] = sentEvents();
    expect(sent).toMatchObject({
      websiteId: "site-1",
      eventName: "button_click",
      properties: { plan: "pro" },
      url: window.location.href,
      title: "Test Page",
      timestamp: Date.now()
    });
    expect(sent.eventId).toBe(event.eventId);
    expect(sent.visitorId).toBe(localStorage.getItem("doem:visitor:site-1"));
    expect(sent.sessionId).toBe(JSON.parse(localStorage.getItem("doem:session:site-1")!).sessionId);
  });

  it("keeps the same visitor and session across events and re-initialization", () => {
    initialize({ websiteId: "site-1" }).track("first");
    vi.advanceTimersByTime(5 * 60 * 1000);
    initialize({ websiteId: "site-1" }).track("second");

    const [first, second] = sentEvents();

    expect(second.visitorId).toBe(first.visitorId);
    expect(second.sessionId).toBe(first.sessionId);
    expect(second.eventId).not.toBe(first.eventId);
  });

  it("starts a new session after inactivity but keeps the visitor", () => {
    const client = initialize({ websiteId: "site-1" });

    client.track("first");
    vi.advanceTimersByTime(SESSION_TIMEOUT_MS + 1);
    client.track("second");

    const [first, second] = sentEvents();

    expect(second.visitorId).toBe(first.visitorId);
    expect(second.sessionId).not.toBe(first.sessionId);
  });

  it("keeps visitors and sessions separate per website", () => {
    initialize({ websiteId: "site-1" }).track("a");
    initialize({ websiteId: "site-2" }).track("b");

    const [a, b] = sentEvents();

    expect(a.visitorId).not.toBe(b.visitorId);
    expect(a.sessionId).not.toBe(b.sessionId);
  });

  it("logs and still returns the event when the API responds with an error", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const client = initialize({ websiteId: "site-1" });

    const event = client.track("button_click");
    await vi.advanceTimersByTimeAsync(0);

    expect(event.eventName).toBe("button_click");
    expect(consoleError).toHaveBeenCalledWith("[DOEM] Failed to send event:", expect.any(Error));
    expect(consoleError.mock.calls[0][1]).toHaveProperty("message", "Failed to send event: 500");
  });
});
