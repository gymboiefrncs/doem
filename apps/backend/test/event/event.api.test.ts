// test/website/event.api.test.ts
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, resetDB, type TestApp } from "../setup/app.js";
import { buildTrackEventInput, buildWebsiteInput } from "../setup/factories.js";

const EVENTS_ENDPOINT = "/api/v1/events";
const WEBSITES_ENDPOINT = "/api/v1/websites";

describe(`POST ${EVENTS_ENDPOINT}`, () => {
  let app: TestApp;
  let websiteId: string;

  const track = (payload: object) => app.inject({ method: "POST", url: EVENTS_ENDPOINT, payload });

  beforeAll(async () => {
    app = await buildTestApp();
  });

  beforeEach(async () => {
    await resetDB(app);

    const response = await app.inject({
      method: "POST",
      url: WEBSITES_ENDPOINT,
      payload: buildWebsiteInput({ domain: `${randomUUID()}.com` })
    });
    websiteId = response.json().id;
  });

  afterAll(() => app.close());

  describe("202: accepted", () => {
    it("accepts a valid event", async () => {
      const response = await track(buildTrackEventInput({ websiteId }));

      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({ accepted: true, duplicate: false });
    });

    it("accepts an event without the optional fields", async () => {
      const { properties, title, referrer, ...required } = buildTrackEventInput({ websiteId });

      const response = await track(required);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({ accepted: true, duplicate: false });
    });

    it("still returns 202 with duplicate: true when the same event is resent", async () => {
      const input = buildTrackEventInput({ websiteId });

      await track(input);
      const response = await track(input);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({ accepted: true, duplicate: true });
    });
  });

  describe("400: invalid input", () => {
    it("rejects a payload that fails validation and reports each field", async () => {
      const response = await track({
        eventId: "not-a-uuid",
        websiteId: "not-a-uuid",
        visitorId: "not-a-uuid",
        sessionId: "not-a-uuid",
        eventName: "",
        url: "not-a-url",
        timestamp: -1
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        title: "Bad Request",
        detail: "Validation failed",
        validationErrors: expect.arrayContaining([
          expect.objectContaining({ path: "/eventId" }),
          expect.objectContaining({ path: "/websiteId" }),
          expect.objectContaining({ path: "/visitorId" }),
          expect.objectContaining({ path: "/sessionId" }),
          expect.objectContaining({ path: "/eventName", message: "Event name is required" }),
          expect.objectContaining({ path: "/url" }),
          expect.objectContaining({ path: "/timestamp" })
        ])
      });
    });

    it.each(["eventId", "websiteId", "visitorId", "sessionId", "eventName", "url", "timestamp"])(
      "rejects a payload missing %s",
      async (field) => {
        const payload: Record<string, unknown> = { ...buildTrackEventInput({ websiteId }) };
        delete payload[field];

        const response = await track(payload);

        expect(response.statusCode).toBe(400);
      }
    );

    it("rejects a non-integer timestamp", async () => {
      const response = await track(buildTrackEventInput({ websiteId, timestamp: 1.5 }));

      expect(response.statusCode).toBe(400);
    });

    it("rejects an empty body", async () => {
      const response = await app.inject({ method: "POST", url: EVENTS_ENDPOINT });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("404: unknown website", () => {
    it("returns 404 when the website does not exist", async () => {
      const response = await track(buildTrackEventInput({ websiteId: randomUUID() }));

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        title: "Not Found",
        detail: "Website not found."
      });
    });
  });

  describe("409: session conflict", () => {
    it("returns 409 when the session belongs to another visitor", async () => {
      const original = buildTrackEventInput({ websiteId });
      await track(original);

      const response = await track(
        buildTrackEventInput({
          websiteId,
          sessionId: original.sessionId,
          visitorId: randomUUID()
        })
      );

      expect(response.statusCode).toBe(409);
      expect(response.json()).toMatchObject({
        title: "Conflict",
        detail: "Session does not belong to the specified visitor."
      });
    });
  });
});
