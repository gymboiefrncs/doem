import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("visitors", {
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
    visitor_id: {
      type: "uuid",
      notNull: true
    },
    first_seen_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    last_seen_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    }
  });

  pgm.addConstraint("visitors", "visitors_website_visitor_unique", {
    unique: ["website_id", "visitor_id"]
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("visitors");
}
