import postgres from "@fastify/postgres";
import { FastifyPluginAsync } from "fastify";

const databasePlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(postgres, {
    connectionString: process.env.DATABASE_URL
  });
};

export default databasePlugin;
