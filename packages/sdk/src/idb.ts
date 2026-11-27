const DB_NAME = "doem_sdk";
const DB_VERSION = 1;

export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("events", { keyPath: ["websiteId", "eventId"] });
      db.createObjectStore("batches", { keyPath: "batchId" });
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
      };
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};
