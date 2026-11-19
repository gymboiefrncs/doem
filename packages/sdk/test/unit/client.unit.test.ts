import { beforeEach, describe, expect, it, vi } from "vitest";

import { initialize } from "../../src/client";
import { createTracker } from "../../src/tracker";

vi.mock("../../src/tracker", () => ({
  createTracker: vi.fn(() => ({ track: vi.fn() }))
}));

describe("initialize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when websiteId is missing", () => {
    expect(() => initialize({ websiteId: undefined })).toThrow("[DOEM] websiteId is required");
    expect(createTracker).not.toHaveBeenCalled();
  });

  it("creates a tracker with the default API URL", () => {
    const websiteId = "test-website-id";

    const result = initialize({ websiteId });

    expect(createTracker).toHaveBeenCalledWith({
      websiteId,
      apiUrl: "http://localhost:3000/api/v1"
    });
    expect(result).toHaveProperty("track");
  });
});
