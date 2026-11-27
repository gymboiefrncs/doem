import type { createStorage } from "./storage";
import type { TrackEvent } from "./tracker";
import type { createTransport } from "./transport";

export const createBatcher = (
  storage: ReturnType<typeof createStorage>,
  transport: ReturnType<typeof createTransport>
) => {
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let isFlushing = false;
  const flush = async () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    if (isFlushing) return;
    isFlushing = true;

    try {
      let pendingEvents = await storage.getPendingEvents();

      while (pendingEvents.length > 0) {
        const eventsToBatch = pendingEvents.slice(0, 10);
        await storage.createBatch(eventsToBatch);
        pendingEvents = await storage.getPendingEvents();
      }

      const pendingBatches = await storage.getPendingBatches();

      for (const batch of pendingBatches) {
        const events = await storage.getBatchEvents(batch.batchId);

        if (events.length === 0) continue;

        try {
          await storage.updateBatchStatus(batch.batchId, "sending");

          await transport.send(events.map((event) => event.payload));
          // if successful, delete the batch and its events. implement later
        } catch (error) {
          console.error("Failed to send batch:", error);
          await storage.updateBatchStatus(batch.batchId, "pending");
        }
      }
    } finally {
      isFlushing = false;

      const remaining = await storage.getPendingEvents();
      if (remaining.length >= 10) {
        await flush();
      } else if (remaining.length > 0 && !flushTimer) {
        flushTimer = setTimeout(flush, 5000);
      }
    }
  };

  const addEvent = async (event: TrackEvent) => {
    await storage.addEvent(event);
    const pendingEvents = await storage.getPendingEvents();
    if (pendingEvents.length >= 10 && !isFlushing) {
      await flush();
    } else if (!flushTimer && !isFlushing) {
      flushTimer = setTimeout(flush, 5000);
    }
  };

  return {
    addEvent
  };
};
