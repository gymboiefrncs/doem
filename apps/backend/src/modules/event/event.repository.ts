import type { TrackEventInput } from "@doem/shared";
import type { PoolClient } from "pg";

export const eventRepository = () => {
  return {
    async findWebsite(client: PoolClient, websiteId: string): Promise<boolean> {
      const website = await client.query(`SELECT id FROM websites WHERE id = $1`, [websiteId]);

      return (website.rowCount ?? 0) > 0;
    },
    async upsertVisitor(
      client: PoolClient,
      data: Pick<TrackEventInput, "websiteId" | "visitorId">
    ): Promise<void> {
      await client.query(
        `
          INSERT INTO visitors (
            website_id,
            visitor_id
          )
          VALUES ($1, $2)
          ON CONFLICT (website_id, visitor_id)
          DO UPDATE SET
            last_seen_at = CURRENT_TIMESTAMP
        `,
        [data.websiteId, data.visitorId]
      );
    },
    async upsertSession(
      client: PoolClient,
      data: Pick<TrackEventInput, "websiteId" | "sessionId" | "visitorId">
    ): Promise<boolean> {
      const session = await client.query(
        `
          INSERT INTO sessions (
            website_id,
            session_id,
            visitor_id
          )
          VALUES ($1, $2, $3)
          ON CONFLICT (website_id, session_id)
          DO UPDATE SET
            last_activity_at = CURRENT_TIMESTAMP
          WHERE sessions.visitor_id = EXCLUDED.visitor_id
          RETURNING session_id
        `,
        [data.websiteId, data.sessionId, data.visitorId]
      );

      return (session.rowCount ?? 0) > 0;
    },
    async insertEvent(client: PoolClient, data: TrackEventInput): Promise<boolean> {
      const event = await client.query(
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
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (website_id, event_id)
          DO NOTHING
          RETURNING id
        `,
        [
          data.websiteId,
          data.sessionId,
          data.eventId,
          data.eventName,
          data.properties ?? {},
          data.url,
          data.title ?? null,
          data.referrer ?? null,
          new Date(data.timestamp)
        ]
      );

      return event.rowCount === 0;
    }
  };
};
