import type { PostgresDb } from "@fastify/postgres";
import type { TrackEventInput, TrackEventResponse } from "@doem/shared";
import { eventRepository } from "./event.repository.js";
import { DuplicateResourceError, ResourceNotFoundError } from "../../errors/domain.errors.js";
import { withTransaction } from "../../utils/with-transaction.js";

export const eventService = (db: PostgresDb) => {
  return {
    async track(data: TrackEventInput): Promise<TrackEventResponse> {
      return withTransaction(db, async (client) => {
        const repo = eventRepository(client);
        const websiteExists = await repo.findWebsite(data.websiteId);

        if (!websiteExists) {
          throw new ResourceNotFoundError("Website not found.");
        }

        await repo.upsertVisitor(data);
        const sessionMatches = await repo.upsertSession(data);

        if (!sessionMatches) {
          throw new DuplicateResourceError("Session does not belong to the specified visitor.");
        }

        const duplicate = await repo.insertEvent(data);

        return {
          accepted: true,
          duplicate
        };
      });
    }
  };
};
