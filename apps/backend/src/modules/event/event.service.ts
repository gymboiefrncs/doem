import type { PostgresDb } from "@fastify/postgres";
import type { TrackEventInput, TrackEventResponse } from "@doem/shared";
import { eventRepository } from "./event.repository.js";
import { DuplicateResourceError, ResourceNotFoundError } from "../../errors/domain.errors.js";
import { TransactionManager, withTransaction } from "../../utils/with-transaction.js";

type EventRepository = ReturnType<typeof eventRepository>;

export const eventService = (txManager: TransactionManager, repo: EventRepository) => {
  return {
    async track(data: TrackEventInput): Promise<TrackEventResponse> {
      return txManager.run(async (client) => {
        const websiteExists = await repo.findWebsite(client, data.websiteId);

        if (!websiteExists) {
          throw new ResourceNotFoundError("Website not found.");
        }

        await repo.upsertVisitor(client, data);
        const sessionMatches = await repo.upsertSession(client, data);

        if (!sessionMatches) {
          throw new DuplicateResourceError("Session does not belong to the specified visitor.");
        }

        const duplicate = await repo.insertEvent(client, data);

        return {
          accepted: true,
          duplicate
        };
      });
    }
  };
};
