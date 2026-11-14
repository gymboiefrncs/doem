import type { FastifyPluginAsync } from "fastify";
import { trackEventSchema, trackEventResponseSchema } from "@doem/shared";
import { eventService } from "./event.service.js";
import { eventController } from "./event.controller.js";
import { eventRepository } from "./event.repository.js";
import { withTransaction } from "../../utils/with-transaction.js";
import { PoolClient } from "pg";

export const eventRoutes: FastifyPluginAsync = async (fastify) => {
  const pgTxManager = {
    run: <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> =>
      withTransaction(fastify.pg, callback)
  };

  const repository = eventRepository();
  const service = eventService(pgTxManager, repository);
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
