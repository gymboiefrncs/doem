import type { RouteHandler } from "fastify";
import type { TrackEventInput } from "@doem/shared";
import { eventService } from "./event.service.js";

type EventService = ReturnType<typeof eventService>;

export const eventController = (service: EventService): RouteHandler<{ Body: TrackEventInput }> => {
  return async (request, reply) => {
    const result = await service.track(request.body);

    return reply.status(202).send(result);
  };
};
