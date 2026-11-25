import type { PostgresDb } from "@fastify/postgres";
import { type TrackEventBatchInput, type TrackEventBatchResponse } from "@doem/shared";
import { eventKey, eventRepository, SessionRow, VisitorRow } from "./event.repository.js";
import { TransactionManager } from "../../utils/with-transaction.js";
import {
  buildResponse,
  collectVisitors,
  filterBySessionOwnership,
  filterByValidatedSessions,
  filterByWebsite
} from "./event.helper.js";

type EventRepository = ReturnType<typeof eventRepository>;

export const eventService = (txManager: TransactionManager, repo: EventRepository) => {
  return {
    async trackBatch(data: TrackEventBatchInput): Promise<TrackEventBatchResponse> {
      const { events } = data;
      const rejections = new Map<number, string>();

      await txManager.run(async (client) => {
        const indexedEvents = events.map((event, index) => ({
          event,
          index
        }));
        const websiteIds = [...new Set(events.map((event) => event.websiteId))];

        const existingWebsites = await repo.findExistingWebsites(client, websiteIds);

        const validWebsiteEvents = filterByWebsite(indexedEvents, existingWebsites, rejections);

        // validate session within the incoming batch
        const { validEvents: validSessionEvents, sessions } = filterBySessionOwnership(
          validWebsiteEvents,
          rejections
        );

        const visitors = collectVisitors(validSessionEvents);

        await repo.upsertVisitors(client, [...visitors.values()]);

        // upsert unique sessions and validate their ownershiip against existing database records
        const validSessions = await repo.upsertSessions(client, [...sessions.values()]);

        // accept only events whose sessions passed both batch-level and database-level validation
        const acceptedEvents = filterByValidatedSessions(
          validSessionEvents,
          validSessions,
          rejections
        );

        if (acceptedEvents.length > 0) {
          await repo.insertEvents(
            client,
            acceptedEvents.map(({ event }) => event)
          );
        }
      });

      return buildResponse(events, rejections);
    }
  };
};
