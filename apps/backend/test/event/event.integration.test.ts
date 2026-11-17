// test/website/event.integration.test.ts
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eventService } from "../../src/modules/event/event.service.js";
import { eventRepository } from "../../src/modules/event/event.repository.js";
import { websiteService } from "../../src/modules/website/website.service.js";
import { websiteRepository } from "../../src/modules/website/website.repository.js";
import { TransactionManager, withTransaction } from "../../src/utils/with-transaction.js";
import { DuplicateResourceError, ResourceNotFoundError } from "../../src/errors/domain.errors.js";
import { buildTestApp, resetDB, type TestApp } from "../setup/app.js";
import { buildWebsiteInput, buildTrackEventInput } from "../setup/factories.js";

describe("eventService.track (service + real database)", () => {
  let app: TestApp;
  let service: ReturnType<typeof eventService>;
  let websiteId: string;

  const createWebsite = async (): Promise<string> => {
    const website = await websiteService(websiteRepository(app.pg), "test-token-secret").register(
      buildWebsiteInput({ domain: `${randomUUID()}.com` })
    );
    return website.id;
  };

  beforeAll(async () => {
    app = await buildTestApp();
    const txManager: TransactionManager = {
      run: (operation) => withTransaction(app.pg, operation)
    };

    service = eventService(txManager, eventRepository());
  });

  beforeEach(async () => {
    await resetDB(app);
    websiteId = await createWebsite();
  });

  afterAll(() => app.close());

  describe("happy paths", () => {
    it("accepts a new event and persists visitor, session and event", async () => {
      const input = buildTrackEventInput({ websiteId });

      const result = await service.track(input);

      expect(result).toEqual({ accepted: true, duplicate: false });

      const visitors = await app.pg.query("SELECT * FROM visitors WHERE website_id = $1", [
        websiteId
      ]);
      expect(visitors.rows).toHaveLength(1);
      expect(visitors.rows[0]).toMatchObject({ visitor_id: input.visitorId });

      const sessions = await app.pg.query("SELECT * FROM sessions WHERE website_id = $1", [
        websiteId
      ]);
      expect(sessions.rows).toHaveLength(1);
      expect(sessions.rows[0]).toMatchObject({
        session_id: input.sessionId,
        visitor_id: input.visitorId
      });

      const events = await app.pg.query("SELECT * FROM events WHERE website_id = $1", [websiteId]);
      expect(events.rows).toHaveLength(1);
      expect(events.rows[0]).toMatchObject({
        session_id: input.sessionId,
        event_id: input.eventId,
        event_name: input.eventName,
        properties: input.properties,
        url: input.url,
        title: input.title,
        referrer: input.referrer
      });
      expect(events.rows[0].occurred_at.getTime()).toBe(input.timestamp);
    });

    it("falls back to defaults when optional fields are omitted", async () => {
      const { properties, title, referrer, ...required } = buildTrackEventInput({ websiteId });

      const result = await service.track(required);

      expect(result.accepted).toBe(true);
      const { rows } = await app.pg.query("SELECT * FROM events WHERE website_id = $1", [
        websiteId
      ]);
      expect(rows[0].properties).toEqual({});
      expect(rows[0].title).toBeNull();
      expect(rows[0].referrer).toBeNull();
    });

    it("round-trips nested properties", async () => {
      const properties = { cart: { items: [1, 2, 3], coupon: null }, vip: true };

      await service.track(buildTrackEventInput({ websiteId, properties }));

      const { rows } = await app.pg.query("SELECT properties FROM events WHERE website_id = $1", [
        websiteId
      ]);
      expect(rows[0].properties).toEqual(properties);
    });

    it("reuses the visitor and session across multiple events", async () => {
      const base = buildTrackEventInput({ websiteId });

      await service.track(base);
      await service.track({ ...base, eventId: randomUUID(), eventName: "click" });

      const visitors = await app.pg.query("SELECT 1 FROM visitors WHERE website_id = $1", [
        websiteId
      ]);
      const sessions = await app.pg.query("SELECT 1 FROM sessions WHERE website_id = $1", [
        websiteId
      ]);
      const events = await app.pg.query("SELECT 1 FROM events WHERE website_id = $1", [websiteId]);
      expect(visitors.rowCount).toBe(1);
      expect(sessions.rowCount).toBe(1);
      expect(events.rowCount).toBe(2);
    });

    it("allows several sessions for the same visitor", async () => {
      const base = buildTrackEventInput({ websiteId });

      await service.track(base);
      await service.track(
        buildTrackEventInput({ websiteId, visitorId: base.visitorId, sessionId: randomUUID() })
      );

      const visitors = await app.pg.query("SELECT 1 FROM visitors WHERE website_id = $1", [
        websiteId
      ]);
      const sessions = await app.pg.query("SELECT 1 FROM sessions WHERE website_id = $1", [
        websiteId
      ]);
      expect(visitors.rowCount).toBe(1);
      expect(sessions.rowCount).toBe(2);
    });

    it("bumps last_seen_at and last_activity_at on repeat activity", async () => {
      const base = buildTrackEventInput({ websiteId });
      await service.track(base);
      const visitorBefore = await app.pg.query(
        "SELECT last_seen_at FROM visitors WHERE website_id = $1",
        [websiteId]
      );
      const sessionBefore = await app.pg.query(
        "SELECT last_activity_at FROM sessions WHERE website_id = $1",
        [websiteId]
      );

      await new Promise((resolve) => setTimeout(resolve, 20));
      await service.track({ ...base, eventId: randomUUID() });

      const visitorAfter = await app.pg.query(
        "SELECT last_seen_at FROM visitors WHERE website_id = $1",
        [websiteId]
      );
      const sessionAfter = await app.pg.query(
        "SELECT last_activity_at FROM sessions WHERE website_id = $1",
        [websiteId]
      );
      expect(visitorAfter.rows[0].last_seen_at.getTime()).toBeGreaterThan(
        visitorBefore.rows[0].last_seen_at.getTime()
      );
      expect(sessionAfter.rows[0].last_activity_at.getTime()).toBeGreaterThan(
        sessionBefore.rows[0].last_activity_at.getTime()
      );
    });
  });

  describe("duplicates and idempotency", () => {
    it("reports duplicate: true when the same eventId is sent again", async () => {
      const input = buildTrackEventInput({ websiteId });

      const first = await service.track(input);
      const second = await service.track(input);

      expect(first).toEqual({ accepted: true, duplicate: false });
      expect(second).toEqual({ accepted: true, duplicate: true });
      const events = await app.pg.query("SELECT 1 FROM events WHERE website_id = $1", [websiteId]);
      expect(events.rowCount).toBe(1);
    });

    it("keeps the first write when a duplicate eventId arrives with different data", async () => {
      const input = buildTrackEventInput({ websiteId, eventName: "original" });

      await service.track(input);
      await service.track({ ...input, eventName: "tampered" });

      const { rows } = await app.pg.query("SELECT event_name FROM events WHERE website_id = $1", [
        websiteId
      ]);
      expect(rows).toEqual([{ event_name: "original" }]);
    });

    it("treats the same eventId on a different website as a new event", async () => {
      const otherWebsiteId = await createWebsite();
      const input = buildTrackEventInput({ websiteId });

      const first = await service.track(input);
      const second = await service.track({ ...input, websiteId: otherWebsiteId });

      expect(first.duplicate).toBe(false);
      expect(second.duplicate).toBe(false);
      const events = await app.pg.query("SELECT 1 FROM events WHERE event_id = $1", [
        input.eventId
      ]);
      expect(events.rowCount).toBe(2);
    });

    it("stores exactly one event when the same event is sent concurrently", async () => {
      const input = buildTrackEventInput({ websiteId });

      const results = await Promise.all([
        service.track(input),
        service.track(input),
        service.track(input)
      ]);

      expect(results.filter((r) => !r.duplicate)).toHaveLength(1);
      expect(results.filter((r) => r.duplicate)).toHaveLength(2);
      const events = await app.pg.query("SELECT 1 FROM events WHERE website_id = $1", [websiteId]);
      expect(events.rowCount).toBe(1);
    });
  });

  describe("multi-tenancy", () => {
    it("scopes visitors and sessions per website", async () => {
      const otherWebsiteId = await createWebsite();
      const input = buildTrackEventInput({ websiteId });

      await service.track(input);
      await service.track({ ...input, websiteId: otherWebsiteId, eventId: randomUUID() });

      const visitors = await app.pg.query("SELECT 1 FROM visitors WHERE visitor_id = $1", [
        input.visitorId
      ]);
      const sessions = await app.pg.query("SELECT 1 FROM sessions WHERE session_id = $1", [
        input.sessionId
      ]);
      expect(visitors.rowCount).toBe(2);
      expect(sessions.rowCount).toBe(2);
    });

    it("allows the same sessionId on another website with a different visitor", async () => {
      const otherWebsiteId = await createWebsite();
      const input = buildTrackEventInput({ websiteId });

      await service.track(input);
      const result = await service.track(
        buildTrackEventInput({
          websiteId: otherWebsiteId,
          sessionId: input.sessionId,
          visitorId: randomUUID()
        })
      );

      expect(result.accepted).toBe(true);
    });
  });

  describe("failures", () => {
    it("throws ResourceNotFoundError and writes nothing for an unknown website", async () => {
      const input = buildTrackEventInput({ websiteId: randomUUID() });

      await expect(service.track(input)).rejects.toThrow(ResourceNotFoundError);

      const { rows } = await app.pg.query(
        `SELECT
           (SELECT count(*) FROM visitors) +
           (SELECT count(*) FROM sessions) +
           (SELECT count(*) FROM events) AS total`
      );
      expect(Number(rows[0].total)).toBe(0);
    });

    it("rejects a session that belongs to another visitor", async () => {
      const original = buildTrackEventInput({ websiteId });
      await service.track(original);

      const hijack = buildTrackEventInput({
        websiteId,
        sessionId: original.sessionId,
        visitorId: randomUUID()
      });

      await expect(service.track(hijack)).rejects.toThrow(DuplicateResourceError);
    });

    it("rolls back the whole transaction on a session mismatch", async () => {
      const original = buildTrackEventInput({ websiteId });
      await service.track(original);

      const hijack = buildTrackEventInput({
        websiteId,
        sessionId: original.sessionId,
        visitorId: randomUUID()
      });
      await expect(service.track(hijack)).rejects.toThrow(DuplicateResourceError);

      const visitors = await app.pg.query("SELECT visitor_id FROM visitors WHERE website_id = $1", [
        websiteId
      ]);
      expect(visitors.rows).toEqual([{ visitor_id: original.visitorId }]);

      const sessions = await app.pg.query("SELECT visitor_id FROM sessions WHERE website_id = $1", [
        websiteId
      ]);
      expect(sessions.rows).toEqual([{ visitor_id: original.visitorId }]);

      const events = await app.pg.query("SELECT event_id FROM events WHERE website_id = $1", [
        websiteId
      ]);
      expect(events.rows).toEqual([{ event_id: original.eventId }]);
    });
  });
});
