import type { FastifyPluginAsync } from "fastify";
import { websiteController } from "./website.controller.js";
import { registerWebsiteResponseSchema, registerWebsiteSchema } from "@doem/shared";
import { websiteRepository } from "./website.repository.js";
import { websiteService } from "./website.service.js";

export const websiteRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = websiteRepository(fastify.pg);
  const service = websiteService(repository, fastify.config.TOKEN_SECRET);
  const controller = websiteController(service);

  fastify.post(
    "/websites",
    {
      schema: {
        body: registerWebsiteSchema,
        response: {
          201: registerWebsiteResponseSchema
        }
      }
    },
    controller
  );
};
