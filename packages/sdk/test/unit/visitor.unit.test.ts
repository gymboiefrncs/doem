import { beforeEach, describe, expect, it } from "vitest";

import { getVisitorId } from "../../src/visitor";

const WEBSITE_ID = "test-website-id";
const visitorKey = (websiteId: string) => `doem:visitor:${websiteId}`;

describe("getVisitorId", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generates a visitor ID and stores it in localStorage", () => {
    const visitorId = getVisitorId(WEBSITE_ID);

    expect(visitorId).toBeDefined();
    expect(localStorage.getItem(visitorKey(WEBSITE_ID))).toBe(visitorId);
  });

  it("returns the same visitor ID when one already exists", () => {
    const first = getVisitorId(WEBSITE_ID);
    const second = getVisitorId(WEBSITE_ID);

    expect(second).toBe(first);
  });

  it("generates different visitor IDs for different websites", () => {
    expect(getVisitorId("website-1")).not.toBe(getVisitorId("website-2"));
  });
});
