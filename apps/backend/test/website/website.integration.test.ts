import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { websiteService } from "../../src/modules/website/website.service";
import { websiteRepository } from "../../src/modules/website/website.repository";
import { hashSecret } from "../../src/utils/crypto";
import { DuplicateResourceError } from "../../src/errors/domain.errors";
import type { TestApp } from "../setup/app";
import { buildTestApp, resetDB } from "../setup/app";
import { buildWebsiteInput } from "../setup/factories";

const TOKEN_SECRET = "test-token-secret";

describe("website registration (service + real database)", () => {
  let app: TestApp;
  let service: ReturnType<typeof websiteService>;

  beforeAll(async () => {
    app = await buildTestApp();
    service = websiteService(websiteRepository(app.pg), TOKEN_SECRET);
  });
  beforeEach(() => resetDB(app));
  afterAll(() => app.close());

  it("persists the website with hashed secrets", async () => {
    const input = buildWebsiteInput();
    const result = await service.register(input);

    const { rows } = await app.pg.query("SELECT * FROM websites WHERE id = $1", [result.id]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject(input);
    expect(rows[0].dashboard_token_hash).toBe(
      hashSecret(result.dashboardAccessToken, TOKEN_SECRET)
    );
    expect(rows[0].recovery_key_hash).toBe(hashSecret(result.recoveryKey, TOKEN_SECRET));
  });

  it("rejects a duplicate domain", async () => {
    const input = buildWebsiteInput();
    await service.register(input);

    await expect(service.register(input)).rejects.toThrow(DuplicateResourceError);
  });
});
