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

  describe("trackBatch", () => {
    const ev = (overrides: Parameters<typeof buildTrackEventInput>[0] = {}) =>
      buildTrackEventInput({ websiteId, ...overrides });

    const batch = (events: ReturnType<typeof ev>[]) => service.trackBatch({ events });

    const count = async (table: "visitors" | "sessions" | "events", wid = websiteId) => {
      const { rows } = await app.pg.query(
        `SELECT count(*)::int AS n FROM ${table} WHERE website_id = $1`,
        [wid]
      );
      return rows[0].n as number;
    };

    describe("happy paths", () => {
      it("accepts every event and persists visitor, session and events", async () => {
        const base = ev();
        const events = [
          base,
          ev({ visitorId: base.visitorId, sessionId: base.sessionId, eventName: "click" }),
          ev({ visitorId: base.visitorId, sessionId: base.sessionId, eventName: "scroll" })
        ];

        const result = await batch(events);

        expect(result.received).toBe(3);
        expect(result.accepted).toBe(3);
        expect(result.rejected).toBe(0);
        expect(result.result).toEqual(
          events.map((e) => ({ eventId: e.eventId, status: "accepted" }))
        );

        // same visitor + session in every event => deduped to one row each
        expect(await count("visitors")).toBe(1);
        expect(await count("sessions")).toBe(1);
        expect(await count("events")).toBe(3);

        const { rows } = await app.pg.query("SELECT * FROM sessions WHERE website_id = $1", [
          websiteId
        ]);
        expect(rows[0]).toMatchObject({
          session_id: base.sessionId,
          visitor_id: base.visitorId
        });
      });

      it("stores event fields exactly as sent", async () => {
        const input = ev({
          properties: {
            cart: {
              items: [1, 2, 3],
              coupon: null
            },
            vip: true
          }
        });

        await batch([input]);

        const { rows } = await app.pg.query("SELECT * FROM events WHERE website_id = $1", [
          websiteId
        ]);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
          session_id: input.sessionId,
          event_id: input.eventId,
          event_name: input.eventName,
          properties: input.properties,
          url: input.url,
          title: input.title,
          referrer: input.referrer
        });
        expect(rows[0].occurred_at.getTime()).toBe(input.timestamp);
      });

      it("falls back to defaults when optional fields are omitted", async () => {
        const { properties, title, referrer, ...required } = ev();

        const result = await batch([required]);

        expect(result.accepted).toBe(1);
        const { rows } = await app.pg.query("SELECT * FROM events WHERE website_id = $1", [
          websiteId
        ]);
        expect(rows[0].properties).toEqual({});
        expect(rows[0].title).toBeNull();
        expect(rows[0].referrer).toBeNull();
      });

      it("handles a mix of optional and non-optional fields across events", async () => {
        const { properties, title, referrer, ...bare } = ev();
        const full = ev({
          title: "Home",
          referrer: "https://example.org",
          properties: { a: 1 }
        });

        const result = await batch([bare, full]);

        expect(result.accepted).toBe(2);
        const { rows } = await app.pg.query(
          "SELECT event_id, title, referrer, properties FROM events WHERE website_id = $1",
          [websiteId]
        );
        const byId = Object.fromEntries(rows.map((r) => [r.event_id, r]));
        expect(byId[bare.eventId]).toMatchObject({
          title: null,
          referrer: null,
          properties: {}
        });
        expect(byId[full.eventId]).toMatchObject({
          title: "Home",
          referrer: "https://example.org",
          properties: { a: 1 }
        });
      });

      it("creates separate rows for different visitors and sessions in one batch", async () => {
        const v1 = randomUUID();
        const v2 = randomUUID();
        const events = [
          ev({ visitorId: v1, sessionId: randomUUID() }),
          ev({ visitorId: v1, sessionId: randomUUID() }), // second session, same visitor
          ev({ visitorId: v2, sessionId: randomUUID() })
        ];

        const result = await batch(events);

        expect(result.accepted).toBe(3);
        expect(await count("visitors")).toBe(2);
        expect(await count("sessions")).toBe(3);
        expect(await count("events")).toBe(3);
      });

      it("returns results in the same order as the input events", async () => {
        const events = Array.from({ length: 6 }, () => ev());

        const result = await batch(events);

        expect(result.result.map((r) => r.eventId)).toEqual(events.map((e) => e.eventId));
      });

      it("accepts a full batch of 10 events", async () => {
        const events = Array.from({ length: 10 }, () => ev());

        const result = await batch(events);

        expect(result).toMatchObject({ received: 10, accepted: 10, rejected: 0 });
        expect(await count("events")).toBe(10);
      });

      it("reuses a visitor and session created by an earlier batch", async () => {
        const base = ev();
        await batch([base]);

        const result = await batch([
          ev({ visitorId: base.visitorId, sessionId: base.sessionId, eventName: "next" })
        ]);

        expect(result.accepted).toBe(1);
        expect(await count("visitors")).toBe(1);
        expect(await count("sessions")).toBe(1);
        expect(await count("events")).toBe(2);
      });

      it("bumps last_seen_at and last_activity_at on repeat activity", async () => {
        const base = ev();
        await batch([base]);
        const visitorBefore = await app.pg.query(
          "SELECT last_seen_at FROM visitors WHERE website_id = $1",
          [websiteId]
        );
        const sessionBefore = await app.pg.query(
          "SELECT last_activity_at FROM sessions WHERE website_id = $1",
          [websiteId]
        );

        await new Promise((resolve) => setTimeout(resolve, 20));
        await batch([ev({ visitorId: base.visitorId, sessionId: base.sessionId })]);

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
      it("accepts but does not re-store an event that already exists", async () => {
        const input = ev({ eventName: "original" });
        await batch([input]);

        const result = await batch([{ ...input, eventName: "tampered" }]);

        expect(result).toMatchObject({ received: 1, accepted: 1, rejected: 0 });
        const { rows } = await app.pg.query("SELECT event_name FROM events WHERE website_id = $1", [
          websiteId
        ]);
        expect(rows).toEqual([{ event_name: "original" }]);
      });

      it("stores one row when the same eventId appears twice in one batch", async () => {
        const input = ev();

        const result = await batch([input, { ...input, eventName: "second-copy" }]);

        expect(result).toMatchObject({ received: 2, accepted: 2, rejected: 0 });
        expect(await count("events")).toBe(1);
        const { rows } = await app.pg.query("SELECT event_name FROM events WHERE website_id = $1", [
          websiteId
        ]);
        expect(rows[0].event_name).toBe(input.eventName); // first one wins
      });

      it("stores new events and skips old ones when a batch mixes both", async () => {
        const existing = ev();
        await batch([existing]);
        const fresh = ev({ visitorId: existing.visitorId, sessionId: existing.sessionId });

        const result = await batch([existing, fresh]);

        expect(result.accepted).toBe(2);
        expect(await count("events")).toBe(2);
      });

      it("treats the same eventId on a different website as a new event", async () => {
        const otherWebsiteId = await createWebsite();
        const input = ev();

        const result = await batch([input, { ...input, websiteId: otherWebsiteId }]);

        expect(result.accepted).toBe(2);
        const { rowCount } = await app.pg.query("SELECT 1 FROM events WHERE event_id = $1", [
          input.eventId
        ]);
        expect(rowCount).toBe(2);
      });

      it("stores exactly one event when the same batch is sent concurrently", async () => {
        const events = [ev(), ev()];

        const results = await Promise.all([batch(events), batch(events), batch(events)]);

        for (const r of results) {
          expect(r).toMatchObject({ received: 2, accepted: 2, rejected: 0 });
        }
        expect(await count("events")).toBe(2);
        expect(await count("visitors")).toBe(2);
        expect(await count("sessions")).toBe(2);
      });

      it("does not deadlock when concurrent batches touch the same visitors/sessions in different orders", async () => {
        const [v1, v2, v3] = [randomUUID(), randomUUID(), randomUUID()];
        const [s1, s2, s3] = [randomUUID(), randomUUID(), randomUUID()];
        const pairs = [
          { visitorId: v1, sessionId: s1 },
          { visitorId: v2, sessionId: s2 },
          { visitorId: v3, sessionId: s3 }
        ];
        const shuffled = (arr: typeof pairs, n: number) => [
          ...arr.slice(n % arr.length),
          ...arr.slice(0, n % arr.length)
        ];

        const results = await Promise.all(
          Array.from({ length: 6 }, (_, i) => batch(shuffled(pairs, i).map((p) => ev(p))))
        );

        for (const r of results) expect(r).toMatchObject({ accepted: 3, rejected: 0 });
        expect(await count("visitors")).toBe(3);
        expect(await count("sessions")).toBe(3);
        expect(await count("events")).toBe(18);
      });
    });

    describe("multi-tenancy", () => {
      it("scopes visitors, sessions and events per website within one batch", async () => {
        const otherWebsiteId = await createWebsite();
        const input = ev();

        const result = await batch([
          input,
          { ...input, websiteId: otherWebsiteId, eventId: randomUUID() }
        ]);

        expect(result.accepted).toBe(2);
        expect(await count("visitors", websiteId)).toBe(1);
        expect(await count("visitors", otherWebsiteId)).toBe(1);
        expect(await count("sessions", websiteId)).toBe(1);
        expect(await count("sessions", otherWebsiteId)).toBe(1);
        expect(await count("events", websiteId)).toBe(1);
        expect(await count("events", otherWebsiteId)).toBe(1);
      });
    });

    describe("per-event rejections", () => {
      it("rejects events for an unknown website and accepts the rest", async () => {
        const good = ev();
        const orphan = ev({ websiteId: randomUUID() });

        const result = await batch([orphan, good]);

        expect(result).toMatchObject({ received: 2, accepted: 1, rejected: 1 });
        expect(result.result).toEqual([
          { eventId: orphan.eventId, status: "rejected", reason: "Website not found." },
          { eventId: good.eventId, status: "accepted" }
        ]);
        expect(await count("events")).toBe(1);
        expect(await count("events", orphan.websiteId)).toBe(0);
        expect(await count("visitors", orphan.websiteId)).toBe(0);
        expect(await count("sessions", orphan.websiteId)).toBe(0);
      });

      it("rejects an event whose session was claimed by another visitor earlier in the batch", async () => {
        const first = ev();
        const sameVisitor = ev({ visitorId: first.visitorId, sessionId: first.sessionId });
        const hijack = ev({ sessionId: first.sessionId, visitorId: randomUUID() });

        const result = await batch([first, sameVisitor, hijack]);

        expect(result).toMatchObject({ received: 3, accepted: 2, rejected: 1 });
        expect(result.result[0]).toEqual({ eventId: first.eventId, status: "accepted" });
        expect(result.result[1]).toEqual({ eventId: sameVisitor.eventId, status: "accepted" });
        expect(result.result[2]).toEqual({
          eventId: hijack.eventId,
          status: "rejected",
          reason: "Session does not belong to the specified visitor."
        });

        const { rows } = await app.pg.query(
          "SELECT visitor_id FROM sessions WHERE website_id = $1",
          [websiteId]
        );
        expect(rows).toEqual([{ visitor_id: first.visitorId }]);

        const stored = await app.pg.query("SELECT 1 FROM events WHERE event_id = $1", [
          hijack.eventId
        ]);
        expect(stored.rowCount).toBe(0);
        expect(await count("events")).toBe(2);
      });

      it("reverses the winner when the order is reversed", async () => {
        const sessionId = randomUUID();
        const a = ev({ sessionId, visitorId: randomUUID() });
        const b = ev({ sessionId, visitorId: randomUUID() });

        // b should win because it is sent first in the batch
        const result = await batch([b, a]);

        expect(result.result[0].status).toBe("accepted"); // b
        expect(result.result[1].status).toBe("rejected"); // a
        const { rows } = await app.pg.query(
          "SELECT visitor_id FROM sessions WHERE website_id = $1",
          [websiteId]
        );
        expect(rows).toEqual([{ visitor_id: b.visitorId }]);
      });

      it("rejects an event whose session already belongs to another visitor in the database", async () => {
        const original = ev();
        await batch([original]);

        const hijack = ev({ sessionId: original.sessionId, visitorId: randomUUID() });
        const good = ev();

        const result = await batch([hijack, good]);

        expect(result).toMatchObject({ received: 2, accepted: 1, rejected: 1 });
        expect(result.result).toEqual([
          {
            eventId: hijack.eventId,
            status: "rejected",
            reason: "Session does not belong to the specified visitor."
          },
          { eventId: good.eventId, status: "accepted" }
        ]);

        const sessions = await app.pg.query(
          "SELECT visitor_id FROM sessions WHERE session_id = $1",
          [original.sessionId]
        );
        expect(sessions.rows).toEqual([{ visitor_id: original.visitorId }]);

        const events = await app.pg.query("SELECT 1 FROM events WHERE event_id = $1", [
          hijack.eventId
        ]);
        expect(events.rowCount).toBe(0);
      });

      it("reports each rejection reason against the right event when failures are mixed", async () => {
        const original = ev();
        await batch([original]);

        const unknownSite = ev({ websiteId: randomUUID() });
        const dbHijack = ev({ sessionId: original.sessionId, visitorId: randomUUID() });
        const good1 = ev();
        const batchHijack = ev({ sessionId: good1.sessionId, visitorId: randomUUID() });
        const good2 = ev({ visitorId: good1.visitorId, sessionId: good1.sessionId });

        const result = await batch([unknownSite, dbHijack, good1, batchHijack, good2]);

        expect(result).toMatchObject({ received: 5, accepted: 2, rejected: 3 });
        expect(result.result.map((r) => r.status)).toEqual([
          "rejected",
          "rejected",
          "accepted",
          "rejected",
          "accepted"
        ]);
        expect(result.result.map((r) => r.eventId)).toEqual([
          unknownSite.eventId,
          dbHijack.eventId,
          good1.eventId,
          batchHijack.eventId,
          good2.eventId
        ]);
        const reasons = result.result.map((r) => (r.status === "rejected" ? r.reason : null));
        expect(reasons).toEqual([
          "Website not found.",
          "Session does not belong to the specified visitor.",
          null,
          "Session does not belong to the specified visitor.",
          null
        ]);
        // original + good1 + good2
        expect(await count("events")).toBe(3);
      });

      it("returns accepted: 0 and writes no events when every event is rejected", async () => {
        const events = [
          ev({
            websiteId: randomUUID()
          }),
          ev({
            websiteId: randomUUID()
          })
        ];

        const result = await batch(events);

        expect(result).toMatchObject({ received: 2, accepted: 0, rejected: 2 });
        const { rows } = await app.pg.query(
          `SELECT
             (SELECT count(*) FROM visitors) +
             (SELECT count(*) FROM sessions) +
             (SELECT count(*) FROM events) AS total`
        );
        expect(Number(rows[0].total)).toBe(0);
      });
    });

    describe("atomicity", () => {
      it("rolls back the whole batch on an unexpected error", async () => {
        const good = ev();
        // an out-of-range timestamp makes `new Date(ts).toISOString()` throw while
        // the transaction is open, after visitors and sessions were already upserted.
        const broken = ev({ timestamp: Number.MAX_SAFE_INTEGER });

        await expect(batch([good, broken])).rejects.toThrow(RangeError);

        expect(await count("visitors")).toBe(0);
        expect(await count("sessions")).toBe(0);
        expect(await count("events")).toBe(0);
      });

      it("does not touch data from earlier batches when a later batch fails", async () => {
        const earlier = ev();
        await batch([earlier]);

        await expect(
          batch([
            ev({
              timestamp: Number.MAX_SAFE_INTEGER
            })
          ])
        ).rejects.toThrow(RangeError);

        expect(await count("events")).toBe(1);
        const { rows } = await app.pg.query("SELECT event_id FROM events WHERE website_id = $1", [
          websiteId
        ]);
        expect(rows).toEqual([{ event_id: earlier.eventId }]);
      });
    });
  });
});
