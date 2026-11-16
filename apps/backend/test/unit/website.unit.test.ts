import { beforeEach, describe, expect, it, vi } from "vitest";
import { websiteService } from "../../src/modules/website/website.service.js";
import { hashSecret } from "../../src/utils/crypto.js";

const mockInsert = vi.fn();

const mockRepo = {
  insert: mockInsert
};

const tokenSecret = "test-token-secret";

describe("websiteService", () => {
  beforeEach(() => {
    mockInsert.mockReset();
  });

  it("should register a website successfully", async () => {
    const input = { name: "my website", domain: "mywebsite.com", timezone: "UTC" };

    const savedWebsite = {
      id: "website-uuid",
      name: input.name,
      domain: input.domain,
      timezone: input.timezone,
      created_at: new Date().toISOString()
    };

    mockInsert.mockResolvedValue(savedWebsite);

    const service = websiteService(mockRepo, tokenSecret);
    const result = await service.register(input);

    expect(mockInsert).toHaveBeenCalledOnce();

    expect(result).toMatchObject(savedWebsite);

    expect(result.dashboardAccessToken).toBeDefined();
    expect(result.recoveryKey).toBeDefined();
  });

  it("should store hashed secrets instead of plaintext secrets", async () => {
    mockInsert.mockResolvedValue({
      id: "website-uuid",
      name: "My Website",
      domain: "example.com",
      timezone: "Asia/Manila",
      createdAt: new Date().toISOString()
    });

    const service = websiteService(mockRepo, tokenSecret);

    const result = await service.register({
      name: "My Website",
      domain: "example.com",
      timezone: "Asia/Manila"
    });

    const insertedData = mockInsert.mock.calls[0][0];

    expect(insertedData.dashboardAccessTokenHash).toBe(
      hashSecret(result.dashboardAccessToken, tokenSecret)
    );

    expect(insertedData.recoveryKeyHash).toBe(hashSecret(result.recoveryKey, tokenSecret));

    expect(insertedData.dashboardAccessTokenHash).not.toBe(result.dashboardAccessToken);

    expect(insertedData.recoveryKeyHash).not.toBe(result.recoveryKey);
  });
});
