import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addConstraint("websites", "domain_unque_constraint", {
    unique: ["domain"]
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("websites", "domain_unque_constraint");
}
