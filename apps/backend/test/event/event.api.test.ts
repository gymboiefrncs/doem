// test/website/event.api.test.ts
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, resetDB, type TestApp } from "../setup/app.js";
import { buildTrackEventInput, buildWebsiteInput } from "../setup/factories.js";

const EVENTS_ENDPOINT = "/api/v1/events";
const WEBSITES_ENDPOINT = "/api/v1/websites";

type EventInput = ReturnType<typeof buildTrackEventInput>;

describe(`POST ${EVENTS_ENDPOINT}`, () => {
  let app: TestApp;
  let websiteId: string;

  const ev = (overrides: Partial<EventInput> = {}) =>
    buildTrackEventInput({ websiteId, ...overrides });

  // sends { events: [...] }
  const trackBatch = (events: object[]) =>
    app.inject({ method: "POST", url: EVENTS_ENDPOINT, payload: { events } });

  // sends an arbitrary body, for malformed payloads
  const trackRaw = (payload: object) =>
    app.inject({ method: "POST", url: EVENTS_ENDPOINT, payload });

  const countEvents = async () => {
    const { rows } = await app.pg.query("SELECT count(*)::int AS n FROM events");
    return rows[0].n as number;
  };

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
    it("accepts a batch with a single valid event", async () => {
      const event = ev();

      const response = await trackBatch([event]);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({
        received: 1,
        accepted: 1,
        rejected: 0,
        result: [{ eventId: event.eventId, status: "accepted" }]
      });
    });

    it("accepts a batch with several valid events", async () => {
      const events = [ev(), ev(), ev()];

      const response = await trackBatch(events);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toMatchObject({ received: 3, accepted: 3, rejected: 0 });
      expect(response.json().result.map((r: { eventId: string }) => r.eventId)).toEqual(
        events.map((e) => e.eventId)
      );
      expect(await countEvents()).toBe(3);
    });

    it("accepts a batch of exactly 10 events", async () => {
      const response = await trackBatch(Array.from({ length: 10 }, () => ev()));

      expect(response.statusCode).toBe(202);
      expect(response.json()).toMatchObject({ received: 10, accepted: 10, rejected: 0 });
    });

    it("accepts events without the optional fields", async () => {
      const { properties, title, referrer, ...required } = ev();

      const response = await trackBatch([required]);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toMatchObject({ received: 1, accepted: 1, rejected: 0 });
    });

    it("still returns 202 and accepts events that were already stored", async () => {
      const event = ev();

      await trackBatch([event]);
      const response = await trackBatch([event]);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toMatchObject({ received: 1, accepted: 1, rejected: 0 });
      expect(await countEvents()).toBe(1);
    });

    it("stores one row when the same eventId appears twice in one batch", async () => {
      const event = ev();

      const response = await trackBatch([event, event]);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toMatchObject({ received: 2, accepted: 2, rejected: 0 });
      expect(await countEvents()).toBe(1);
    });
  });

  describe("202: per-event rejections", () => {
    it("rejects events for an unknown website but accepts the rest", async () => {
      const good = ev();
      const orphan = ev({ websiteId: randomUUID() });

      const response = await trackBatch([orphan, good]);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({
        received: 2,
        accepted: 1,
        rejected: 1,
        result: [
          { eventId: orphan.eventId, status: "rejected", reason: "Website not found." },
          { eventId: good.eventId, status: "accepted" }
        ]
      });
      expect(await countEvents()).toBe(1);
    });

    it("rejects an event whose session belongs to another visitor but accepts the rest", async () => {
      const original = ev();
      await trackBatch([original]);

      const hijack = ev({ sessionId: original.sessionId, visitorId: randomUUID() });
      const good = ev();

      const response = await trackBatch([hijack, good]);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toEqual({
        received: 2,
        accepted: 1,
        rejected: 1,
        result: [
          {
            eventId: hijack.eventId,
            status: "rejected",
            reason: "Session does not belong to the specified visitor."
          },
          { eventId: good.eventId, status: "accepted" }
        ]
      });
      expect(await countEvents()).toBe(2); // original + good
    });

    it("rejects an event that conflicts with an earlier event in the same batch", async () => {
      const first = ev();
      const hijack = ev({ sessionId: first.sessionId, visitorId: randomUUID() });

      const response = await trackBatch([first, hijack]);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toMatchObject({ received: 2, accepted: 1, rejected: 1 });
      expect(response.json().result[1]).toEqual({
        eventId: hijack.eventId,
        status: "rejected",
        reason: "Session does not belong to the specified visitor."
      });
    });

    it("returns 202 with every event rejected when none can be stored", async () => {
      const events = [ev({ websiteId: randomUUID() }), ev({ websiteId: randomUUID() })];

      const response = await trackBatch(events);

      expect(response.statusCode).toBe(202);
      expect(response.json()).toMatchObject({ received: 2, accepted: 0, rejected: 2 });
      expect(await countEvents()).toBe(0);
    });
  });

  describe("400: invalid input", () => {
    it("rejects an invalid event and reports each field with its index", async () => {
      const response = await trackBatch([
        {
          eventId: "not-a-uuid",
          websiteId: "not-a-uuid",
          visitorId: "not-a-uuid",
          sessionId: "not-a-uuid",
          eventName: "",
          url: "not-a-url",
          timestamp: -1
        }
      ]);

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        title: "Bad Request",
        detail: "Validation failed",
        validationErrors: expect.arrayContaining([
          expect.objectContaining({ path: "/events/0/eventId" }),
          expect.objectContaining({ path: "/events/0/websiteId" }),
          expect.objectContaining({ path: "/events/0/visitorId" }),
          expect.objectContaining({ path: "/events/0/sessionId" }),
          expect.objectContaining({
            path: "/events/0/eventName",
            message: "Event name is required"
          }),
          expect.objectContaining({ path: "/events/0/url" }),
          expect.objectContaining({ path: "/events/0/timestamp" })
        ])
      });
    });

    it.each(["eventId", "websiteId", "visitorId", "sessionId", "eventName", "url", "timestamp"])(
      "rejects an event missing %s",
      async (field) => {
        const event: Record<string, unknown> = { ...ev() };
        delete event[field];

        const response = await trackBatch([event]);

        expect(response.statusCode).toBe(400);
      }
    );

    it("rejects a non-integer timestamp", async () => {
      const response = await trackBatch([ev({ timestamp: 1.5 })]);

      expect(response.statusCode).toBe(400);
    });

    it("rejects the whole batch and stores nothing when one event is invalid", async () => {
      const response = await trackBatch([ev(), ev({ eventName: "" }), ev()]);

      expect(response.statusCode).toBe(400);
      expect(response.json().validationErrors).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: "/events/1/eventName" })])
      );
      expect(await countEvents()).toBe(0);
    });

    it("rejects an empty events array", async () => {
      const response = await trackBatch([]);

      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        validationErrors: expect.arrayContaining([
          expect.objectContaining({ message: "At least one event is required" })
        ])
      });
    });

    it("rejects a batch with more than 10 events", async () => {
      const response = await trackBatch(Array.from({ length: 11 }, () => ev()));

      expect(response.statusCode).toBe(400);
      expect(await countEvents()).toBe(0);
    });

    it("rejects a body without an events array", async () => {
      const response = await trackRaw({});

      expect(response.statusCode).toBe(400);
    });

    it("rejects events that is not an array", async () => {
      const response = await trackRaw({ events: ev() });

      expect(response.statusCode).toBe(400);
    });

    it("rejects a single event sent without the events wrapper", async () => {
      const response = await trackRaw(ev());

      expect(response.statusCode).toBe(400);
    });

    it("rejects an empty body", async () => {
      const response = await app.inject({ method: "POST", url: EVENTS_ENDPOINT });

      expect(response.statusCode).toBe(400);
    });
  });
});
