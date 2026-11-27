import type { TrackEvent } from "./tracker";
import type { StoredBatch, StoredEvent } from "./types";

export const createStorage = (db: IDBDatabase) => {
  const addEvent = (event: TrackEvent): Promise<void> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("events", "readwrite");
      const store = tx.objectStore("events");
      const storedEvent: StoredEvent = {
        websiteId: event.websiteId,
        eventId: event.eventId,
        batchId: null,
        payload: event,
        createdAt: Date.now()
      };

      store.add(storedEvent);

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(tx.error);
      };
    });
  };
  const createBatch = (events: StoredEvent[]): Promise<StoredBatch> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["events", "batches"], "readwrite");
      const batchStore = tx.objectStore("batches");
      const eventStore = tx.objectStore("events");
      const storedBatch: StoredBatch = {
        batchId: crypto.randomUUID(),
        websiteId: events[0].websiteId,
        eventIds: events.map((event) => event.eventId),
        status: "pending",
        attemptCount: 0,
        createdAt: Date.now(),
        nextAttemptAt: null
      };

      for (const event of events) {
        const updatedEvent: StoredEvent = {
          ...event,
          batchId: storedBatch.batchId
        };
        eventStore.put(updatedEvent);
      }

      batchStore.add(storedBatch);

      tx.oncomplete = () => {
        resolve(storedBatch);
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(tx.error);
      };
    });
  };

  const getPendingEvents = (): Promise<StoredEvent[]> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("events", "readonly");
      const eventStore = tx.objectStore("events");
      const pendingEvents: StoredEvent[] = [];

      const request = eventStore.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          return;
        }

        const event = cursor.value as StoredEvent;
        if (event.batchId === null) {
          pendingEvents.push(event);
        }
        cursor.continue();
      };

      request.onerror = () => {
        reject(request.error);
      };

      tx.oncomplete = () => {
        resolve(pendingEvents);
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(tx.error);
      };
    });
  };

  const getPendingBatches = (): Promise<StoredBatch[]> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("batches", "readonly");
      const batchStore = tx.objectStore("batches");
      const pendingBatches: StoredBatch[] = [];

      const request = batchStore.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          return;
        }

        const event = cursor.value as StoredBatch;
        if (event.status === "pending") {
          pendingBatches.push(event);
        }
        cursor.continue();
      };

      request.onerror = () => {
        reject(request.error);
      };

      tx.oncomplete = () => {
        resolve(pendingBatches);
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(tx.error);
      };
    });
  };

  const getBatchEvents = (batchId: string): Promise<StoredEvent[]> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("events", "readonly");
      const eventStore = tx.objectStore("events");
      const batchEvents: StoredEvent[] = [];

      const request = eventStore.openCursor();

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          return;
        }
        const event = cursor.value as StoredEvent;
        if (event.batchId === batchId) {
          batchEvents.push(event);
        }
        cursor.continue();
      };
      request.onerror = () => {
        reject(request.error);
      };
      tx.oncomplete = () => {
        resolve(batchEvents);
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(tx.error);
      };
    });
  };

  const updateBatchStatus = (
    batchId: string,
    status: "pending" | "sending" | "retry"
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("batches", "readwrite");
      const batchStore = tx.objectStore("batches");
      const request = batchStore.get(batchId);

      request.onsuccess = () => {
        const batch = request.result as StoredBatch;
        if (!batch) return;

        batch.status = status;
        batchStore.put(batch);
      };

      tx.oncomplete = () => {
        resolve();
      };

      tx.onerror = () => {
        reject(tx.error);
      };

      tx.onabort = () => {
        reject(tx.error);
      };
    });
  };

  return {
    addEvent,
    createBatch,
    getPendingEvents,
    getPendingBatches,
    getBatchEvents,
    updateBatchStatus
  };
};
