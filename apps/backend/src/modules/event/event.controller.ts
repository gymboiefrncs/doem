import type { RouteHandler } from "fastify";
import type { TrackEventBatchInput } from "@doem/shared";
import { eventService } from "./event.service.js";

type EventService = ReturnType<typeof eventService>;

export const eventController = (service: EventService) => {
  const trackBatch: RouteHandler<{ Body: TrackEventBatchInput }> = async (request, reply) => {
    const result = await service.trackBatch(request.body);
    return reply.status(202).send(result);
  };

  return { trackBatch };
};
