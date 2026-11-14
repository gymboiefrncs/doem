import type { PostgresDb } from "@fastify/postgres";
import type { PoolClient } from "pg";

export const withTransaction = async <T>(
  db: PostgresDb,
  operation: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export interface TransactionManager {
  run<T>(callback: (txContent: PoolClient) => Promise<T>): Promise<T>;
}
