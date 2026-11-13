import type { FastifyPluginAsync } from "fastify";
import { trackEventSchema, trackEventResponseSchema } from "@doem/shared";
import { eventService } from "./event.service.js";
import { eventController } from "./event.controller.js";

export const eventRoutes: FastifyPluginAsync = async (fastify) => {
  const service = eventService(fastify.pg);
  const controller = eventController(service);

  fastify.post(
    "/events",
    {
      schema: {
        body: trackEventSchema,
        response: {
          202: trackEventResponseSchema
        }
      }
    },
    controller
  );
};
