import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("websites", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuidv7()")
    },
    name: {
      type: "varchar(100)",
      notNull: true
    },
    domain: {
      type: "varchar(255)",
      notNull: true
    },
    timezone: {
      type: "varchar(100)",
      notNull: true,
      default: "UTC"
    },
    dashboard_token_hash: {
      type: "text",
      notNull: true
    },
    recovery_key_hash: {
      type: "text",
      notNull: true
    },
    created_at: {
      type: "timestamptz",
      default: pgm.func("current_timestamp")
    },
    updated_at: {
      type: "timestamptz",
      default: pgm.func("current_timestamp")
    }
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("websites");
}
