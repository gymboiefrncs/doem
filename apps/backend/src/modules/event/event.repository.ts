import type { TrackEventInput } from "@doem/shared";
import type { PoolClient } from "pg";

export type VisitorRow = Pick<TrackEventInput, "websiteId" | "visitorId">;
export type SessionRow = Pick<TrackEventInput, "websiteId" | "sessionId" | "visitorId">;

export const eventKey = (websiteId: string, id: string) => `${websiteId}:${id}`;

export const eventRepository = () => {
  return {
    async findExistingWebsites(client: PoolClient, websiteIds: string[]): Promise<Set<string>> {
      const { rows } = await client.query<{ id: string }>(
        `
          SELECT id
          FROM websites
          WHERE id = ANY($1::uuid[])
        `,
        [websiteIds]
      );

      return new Set(rows.map((row) => row.id));
    },

    async upsertVisitors(client: PoolClient, rows: VisitorRow[]): Promise<void> {
      if (rows.length === 0) return;

      await client.query(
        `
          INSERT INTO visitors (website_id, visitor_id)
          SELECT website_id, visitor_id
          FROM UNNEST($1::uuid[], $2::uuid[])
            AS t(website_id, visitor_id)
          ORDER BY website_id, visitor_id
          ON CONFLICT (website_id, visitor_id)
          DO UPDATE SET last_seen_at = CURRENT_TIMESTAMP
        `,
        [rows.map((row) => row.websiteId), rows.map((row) => row.visitorId)]
      );
    },

    async upsertSessions(client: PoolClient, rows: SessionRow[]): Promise<Set<string>> {
      if (rows.length === 0) return new Set();

      const { rows: insertedSessions } = await client.query<{
        website_id: string;
        session_id: string;
      }>(
        `
          INSERT INTO sessions (website_id, session_id, visitor_id)
          SELECT website_id, session_id, visitor_id
          FROM UNNEST(
            $1::uuid[],
            $2::uuid[],
            $3::uuid[]
          ) AS t(website_id, session_id, visitor_id)
          ORDER BY website_id, session_id
          ON CONFLICT (website_id, session_id)
          DO UPDATE SET last_activity_at = CURRENT_TIMESTAMP
          WHERE sessions.visitor_id = EXCLUDED.visitor_id
          RETURNING website_id, session_id
        `,
        [
          rows.map((row) => row.websiteId),
          rows.map((row) => row.sessionId),
          rows.map((row) => row.visitorId)
        ]
      );

      return new Set(insertedSessions.map((row) => eventKey(row.website_id, row.session_id)));
    },

    async insertEvents(client: PoolClient, events: TrackEventInput[]): Promise<Set<string>> {
      if (events.length === 0) return new Set();

      const { rows: insertedEvents } = await client.query<{
        website_id: string;
        event_id: string;
      }>(
        `
          INSERT INTO events (
            website_id,
            session_id,
            event_id,
            event_name,
            properties,
            url,
            title,
            referrer,
            occurred_at
          )
          SELECT
            website_id,
            session_id,
            event_id,
            event_name,
            properties::jsonb,
            url,
            title,
            referrer,
            occurred_at
          FROM UNNEST(
            $1::uuid[],
            $2::uuid[],
            $3::uuid[],
            $4::text[],
            $5::text[],
            $6::text[],
            $7::text[],
            $8::text[],
            $9::timestamptz[]
          ) AS t(
            website_id,
            session_id,
            event_id,
            event_name,
            properties,
            url,
            title,
            referrer,
            occurred_at
          )
          ON CONFLICT (website_id, event_id) DO NOTHING
          RETURNING website_id, event_id
        `,
        [
          events.map((event) => event.websiteId),
          events.map((event) => event.sessionId),
          events.map((event) => event.eventId),
          events.map((event) => event.eventName),
          events.map((event) => JSON.stringify(event.properties ?? {})),
          events.map((event) => event.url),
          events.map((event) => event.title ?? null),
          events.map((event) => event.referrer ?? null),
          events.map((event) => new Date(event.timestamp).toISOString())
        ]
      );

      return new Set(insertedEvents.map((row) => eventKey(row.website_id, row.event_id)));
    }
  };
};
