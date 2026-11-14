import Fastify from "fastify";
import postgres from "@fastify/postgres";
import fastifyEnv from "@fastify/env";
import { envOptions } from "./config/env.js";
import { websiteRoutes } from "./modules/website/website.routes.js";
import { eventRoutes } from "./modules/event/event.routes.js";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { BaseError, DuplicateResourceError } from "./errors/domain.errors.js";

export const buildApp = async () => {
  const fastify = Fastify({
    logger: true
  });

  await fastify.register(fastifyEnv, envOptions);

  await fastify.register(postgres, {
    connectionString: fastify.config.DATABASE_URL
  });

  fastify.setErrorHandler((error, request, reply) => {
    if (error instanceof BaseError) {
      return reply.status(error.status).send({
        type: error.type,
        title: error.title,
        status: error.status,
        detail: error.detail
      });
    }

    if (error !== null && typeof error === "object") {
      const err = error as {
        code?: string;
        statusCode?: number;
        message?: string;
        validation?: Array<{ instancePath: string; message: string }>;
      };

      // for validation errors
      if (err.code === "FST_ERR_VALIDATION" && err.validation) {
        return reply.status(400).send({
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: "Validation failed",
          validationErrors: err.validation.map((e) => ({
            path: e.instancePath,
            message: e.message
          }))
        });
      }

      console.log(error);
      // for malformed JSON body
      if (err.code === "FST_ERR_CTP_INVALID_JSON_BODY") {
        return reply.status(400).send({
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: "Malformed JSON body",
          message: err.message
        });
      }
    }

    return reply.status(500).send({
      type: "about:blank",
      title: "Internal Server Error",
      status: 500,
      detail: "An unexpected error occurred."
    });
  });

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(websiteRoutes, { prefix: "/api/v1" });
  await fastify.register(eventRoutes, { prefix: "/api/v1" });

  return fastify;
};
