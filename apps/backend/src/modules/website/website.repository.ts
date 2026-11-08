import type { PostgresDb } from "@fastify/postgres";
import type {
  WebsiteDatabaseRow,
  WebsiteInsertInput,
  WebsiteInsertResult
} from "./website.types.js";

export const websiteRepository = (db: PostgresDb) => {
  return {
    async insert(data: WebsiteInsertInput): Promise<WebsiteInsertResult> {
      const { rows } = await db.query<WebsiteDatabaseRow>(
        `
          INSERT INTO websites (
            name,
            domain,
            timezone,
            dashboard_token_hash,
            recovery_key_hash
          )
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, name, domain, timezone, created_at
        `,
        [data.name, data.domain, data.timezone, data.dashboardAccessTokenHash, data.recoveryKeyHash]
      );

      const row = rows[0];

      return {
        id: row.id,
        name: row.name,
        domain: row.domain,
        timezone: row.timezone,
        createdAt: new Date(row.created_at).toISOString()
      };
    }
  };
};
