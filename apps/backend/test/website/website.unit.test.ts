import { beforeEach, describe, expect, it, vi } from "vitest";
import { websiteService } from "../../src/modules/website/website.service";
import { hashSecret } from "../../src/utils/crypto";
import { DuplicateResourceError } from "../../src/errors/domain.errors";
import { buildWebsiteInput } from "../setup/factories";

const TOKEN_SECRET = "test-token-secret";

describe("websiteService.register", () => {
  const repo = { insert: vi.fn() };
  const service = websiteService(repo, TOKEN_SECRET);
  const input = buildWebsiteInput();

  beforeEach(() => {
    repo.insert.mockReset();
    repo.insert.mockResolvedValue({ id: "uuid", ...input });
  });

  it("returns the saved website with one-time secrets", async () => {
    const result = await service.register(input);

    expect(repo.insert).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      id: "uuid",
      ...input,
      dashboardAccessToken: expect.any(String),
      recoveryKey: expect.any(String)
    });
  });

  it("persists hashes, never the plaintext secrets", async () => {
    const { dashboardAccessToken, recoveryKey } = await service.register(input);
    const [row] = repo.insert.mock.calls[0];

    expect(row.dashboardAccessTokenHash).toBe(hashSecret(dashboardAccessToken, TOKEN_SECRET));
    expect(row.recoveryKeyHash).toBe(hashSecret(recoveryKey, TOKEN_SECRET));
    expect(Object.values(row)).not.toContain(dashboardAccessToken);
    expect(Object.values(row)).not.toContain(recoveryKey);
  });

  describe("when the repository fails", () => {
    it("maps a unique-domain violation to DuplicateResourceError", async () => {
      repo.insert.mockRejectedValue({ code: "23505", constraint: "domain_unique_constraint" });

      await expect(service.register(input)).rejects.toThrow(DuplicateResourceError);
    });

    it("rethrows unexpected errors untouched", async () => {
      const dbError = new Error("DB connection failed");
      repo.insert.mockRejectedValue(dbError);

      await expect(service.register(input)).rejects.toBe(dbError);
    });
  });
});
