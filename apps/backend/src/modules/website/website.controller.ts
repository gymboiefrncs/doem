import type { RegisterWebsiteInput } from "@doem/shared";
import type { RouteHandler } from "fastify";
import { websiteService } from "./website.service.js";

type WebsiteService = ReturnType<typeof websiteService>;

export const websiteController = (
  service: WebsiteService
): RouteHandler<{ Body: RegisterWebsiteInput }> => {
  return async (request, reply) => {
    const result = await service.register(request.body);

    return reply.status(201).send(result);
  };
};
