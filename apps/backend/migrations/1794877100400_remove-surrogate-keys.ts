import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("events", "events_website_session_fk");
  pgm.dropConstraint("sessions", "sessions_website_visitor_fk");

  pgm.dropColumn("visitors", "id");
  pgm.dropConstraint("visitors", "visitors_website_visitor_unique");
  pgm.addConstraint("visitors", "visitors_pkey", {
    primaryKey: ["website_id", "visitor_id"]
  });

  pgm.dropColumn("sessions", "id");
  pgm.dropConstraint("sessions", "sessions_website_session_unique");
  pgm.addConstraint("sessions", "sessions_pkey", {
    primaryKey: ["website_id", "session_id"]
  });

  pgm.dropColumn("events", "id");
  pgm.dropConstraint("events", "events_website_event_unique");
  pgm.addConstraint("events", "events_pkey", {
    primaryKey: ["website_id", "event_id"]
  });

  pgm.addConstraint("sessions", "sessions_website_visitor_fk", {
    foreignKeys: {
      columns: ["website_id", "visitor_id"],
      references: "visitors(website_id, visitor_id)",
      onDelete: "CASCADE"
    }
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
  pgm.dropConstraint("events", "events_website_session_fk");
  pgm.dropConstraint("sessions", "sessions_website_visitor_fk");

  pgm.dropConstraint("events", "events_pkey");
  pgm.addColumn("events", {
    id: {
      type: "bigint",
      primaryKey: true,
      sequenceGenerated: { precedence: "ALWAYS" }
    }
  });
  pgm.addConstraint("events", "events_website_event_unique", {
    unique: ["website_id", "event_id"]
  });

  pgm.dropConstraint("sessions", "sessions_pkey");
  pgm.addColumn("sessions", {
    id: {
      type: "bigint",
      primaryKey: true,
      sequenceGenerated: { precedence: "ALWAYS" }
    }
  });
  pgm.addConstraint("sessions", "sessions_website_session_unique", {
    unique: ["website_id", "session_id"]
  });

  pgm.dropConstraint("visitors", "visitors_pkey");
  pgm.addColumn("visitors", {
    id: {
      type: "bigint",
      primaryKey: true,
      sequenceGenerated: { precedence: "ALWAYS" }
    }
  });
  pgm.addConstraint("visitors", "visitors_website_visitor_unique", {
    unique: ["website_id", "visitor_id"]
  });

  pgm.addConstraint("sessions", "sessions_website_visitor_fk", {
    foreignKeys: {
      columns: ["website_id", "visitor_id"],
      references: "visitors(website_id, visitor_id)",
      onDelete: "CASCADE"
    }
  });

  pgm.addConstraint("events", "events_website_session_fk", {
    foreignKeys: {
      columns: ["website_id", "session_id"],
      references: "sessions(website_id, session_id)",
      onDelete: "CASCADE"
    }
  });
}
