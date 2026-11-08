import Fastify from "fastify";
import postgres from "@fastify/postgres";
import fastifyEnv from "@fastify/env";
import { envOptions } from "./config/env.js";
import { websiteRoutes } from "./modules/website/website.routes.js";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";

export const buildApp = async () => {
  const fastify = Fastify({
    logger: true
  });

  await fastify.register(fastifyEnv, envOptions);

  await fastify.register(postgres, {
    connectionString: fastify.config.DATABASE_URL
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(websiteRoutes, { prefix: "/api/v1" });

  return fastify;
};
