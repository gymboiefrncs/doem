import postgres from "@fastify/postgres";
import { FastifyPluginAsync } from "fastify";

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(postgres, {
    connectionString: fastify.config.DATABASE_URL
  });
};

export default databasePlugin;
