import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("events", {
    id: {
      type: "bigint",
      primaryKey: true,
      sequenceGenerated: {
        precedence: "ALWAYS"
      }
    },
    website_id: {
      type: "uuid",
      notNull: true
    },
    session_id: {
      type: "uuid",
      notNull: true
    },
    event_id: {
      type: "uuid",
      notNull: true
    },
    event_name: {
      type: "varchar(255)",
      notNull: true
    },
    properties: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'{}'::jsonb")
    },
    url: {
      type: "text",
      notNull: true
    },
    title: {
      type: "text"
    },
    referrer: {
      type: "text"
    },
    occurred_at: {
      type: "timestamptz",
      notNull: true
    },
    received_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    }
  });

  pgm.addConstraint("events", "events_website_event_unique", {
    unique: ["website_id", "event_id"]
  });

  pgm.addConstraint("events", "events_website_session_fk", {
    foreignKeys: {
      columns: ["website_id", "session_id"],
      references: "sessions(website_id, session_id)",
      onDelete: "CASCADE"
    }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("events");
}
