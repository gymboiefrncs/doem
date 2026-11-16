import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, resetDB, type TestApp } from "../setup/app";
import { buildWebsiteInput } from "../setup/factories";

const ENDPOINT = "/api/v1/websites";

describe(`POST ${ENDPOINT}`, () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(() => resetDB(app));

  afterAll(() => app.close());

  const register = (payload: object) => app.inject({ method: "POST", url: ENDPOINT, payload });

  it("201: registers a website", async () => {
    const input = buildWebsiteInput();
    const response = await register(input);

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      ...input,
      dashboardAccessToken: expect.any(String),
      recoveryKey: expect.any(String)
    });
  });

  it("409: rejects a duplicate domain", async () => {
    const input = buildWebsiteInput();
    await register(input);

    const response = await register(input);

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({
      title: "Conflict",
      detail: `Website with domain ${input.domain} already exists.`
    });
  });

  it("400: rejects invalid input", async () => {
    const response = await register({ name: "", domain: "", timezone: "Invalid/Timezone" });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      title: "Bad Request",
      detail: "Validation failed",
      validationErrors: expect.arrayContaining([
        expect.objectContaining({ path: "/name", message: "Name is required" }),
        expect.objectContaining({ path: "/domain", message: "Domain is required" }),
        expect.objectContaining({ path: "/timezone", message: "Invalid timezone" })
      ])
    });
  });
});
