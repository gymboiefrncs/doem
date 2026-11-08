import Fastify from "fastify";
import databasePlugin from "./plugins/database.js";
import fastifyEnv from "@fastify/env";
import { envOptions } from "./config/env.js";

export const buildApp = async () => {
  const fastify = Fastify({
    logger: true
  });

  await fastify.register(fastifyEnv, envOptions);

  await fastify.register(databasePlugin);

  return fastify;
};
