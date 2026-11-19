import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TrackEvent } from "../../src/tracker";
import { createTransport } from "../../src/transport";

const apiUrl = "http://localhost:3000/api/v1";

const event: TrackEvent = {
  eventId: "event-id",
  websiteId: "test-website-id",
  visitorId: "visitor-id",
  sessionId: "session-id",
  eventName: "button_click",
  properties: { plan: "pro" },
  url: "http://localhost:3000/",
  title: "Test Page",
  referrer: undefined,
  timestamp: 1767225600000
};

describe("createTransport", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs the event as JSON to the events endpoint", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    const transport = createTransport({ apiUrl });

    await transport.send(event);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${apiUrl}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
  });

  it("throws with the status code when the server responds with an error", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const transport = createTransport({ apiUrl });

    await expect(transport.send(event)).rejects.toThrow("Failed to send event: 500");
  });

  it("rejects when the network request fails", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));
    const transport = createTransport({ apiUrl });

    await expect(transport.send(event)).rejects.toThrow("fetch failed");
  });
});
