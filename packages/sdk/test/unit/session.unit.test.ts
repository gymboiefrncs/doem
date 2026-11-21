import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getOrCreateSession } from "../../src/session";

const WEBSITE_ID = "test-website-id";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const sessionKey = `doem:session:${WEBSITE_ID}`;

describe("getOrCreateSession", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates and persists a new session when none exists", () => {
    const session = getOrCreateSession(WEBSITE_ID);

    expect(session).toEqual({
      sessionId: expect.any(String),
      lastActivity: Date.now()
    });
    expect(JSON.parse(localStorage.getItem(sessionKey)!)).toEqual(session);
  });

  it("reuses the session and refreshes lastActivity while it is active", () => {
    const first = getOrCreateSession(WEBSITE_ID);

    vi.advanceTimersByTime(10 * 60 * 1000);
    const second = getOrCreateSession(WEBSITE_ID);

    expect(second.sessionId).toBe(first.sessionId);
    expect(second.lastActivity).toBe(first.lastActivity + 10 * 60 * 1000);
    expect(JSON.parse(localStorage.getItem(sessionKey)!)).toEqual(second);
  });

  it("keeps the session at exactly the timeout boundary", () => {
    const first = getOrCreateSession(WEBSITE_ID);

    vi.advanceTimersByTime(SESSION_TIMEOUT_MS);
    const second = getOrCreateSession(WEBSITE_ID);

    expect(second.sessionId).toBe(first.sessionId);
  });

  it("creates a new session once the timeout has passed", () => {
    const first = getOrCreateSession(WEBSITE_ID);

    vi.advanceTimersByTime(SESSION_TIMEOUT_MS + 1);
    const second = getOrCreateSession(WEBSITE_ID);

    expect(second.sessionId).not.toBe(first.sessionId);
  });

  it.each([
    ["invalid JSON", "{invalid-json"],
    ["null", "null"],
    ["a non-object", "123"],
    ["an empty object", "{}"],
    ["a missing lastActivity", JSON.stringify({ sessionId: "abc" })],
    ["a missing sessionId", JSON.stringify({ lastActivity: Date.now() })],
    ["wrong field types", JSON.stringify({ sessionId: 123, lastActivity: "invalid" })]
  ])("creates a new session when stored data is %s", (_label, stored) => {
    localStorage.setItem(sessionKey, stored);

    const session = getOrCreateSession(WEBSITE_ID);

    expect(session).toEqual({
      sessionId: expect.any(String),
      lastActivity: Date.now()
    });
    expect(session.sessionId).not.toBe("");
  });
});
