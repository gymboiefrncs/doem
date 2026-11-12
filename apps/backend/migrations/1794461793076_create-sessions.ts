import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("sessions", {
    id: {
      type: "bigint",
      primaryKey: true,
      sequenceGenerated: {
        precedence: "ALWAYS"
      }
    },
    website_id: {
      type: "uuid",
      notNull: true,
      references: "websites",
      onDelete: "CASCADE"
    },
    session_id: {
      type: "uuid",
      notNull: true
    },
    visitor_id: {
      type: "uuid",
      notNull: true
    },
    started_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    last_activity_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    }
  });

  pgm.addConstraint("sessions", "sessions_website_session_unique", {
    unique: ["website_id", "session_id"]
  });

  pgm.addConstraint("sessions", "sessions_website_visitor_fk", {
    foreignKeys: {
      columns: ["website_id", "visitor_id"],
      references: "visitors(website_id, visitor_id)",
      onDelete: "CASCADE"
    }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("sessions");
}
