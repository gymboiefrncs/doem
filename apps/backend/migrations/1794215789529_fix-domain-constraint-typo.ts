import type { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameConstraint("websites", "domain_unque_constraint", "domain_unique_constraint");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.renameConstraint("websites", "domain_unique_constraint", "domain_unque_constraint");
}
