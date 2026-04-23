import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AtoRecord } from "@/types/record";

export const DB_NAME = "ato";
export const DB_VERSION = 1;
export const STORE_RECORDS = "records";
export const INDEX_CREATED_AT = "byCreatedAt";

interface AtoDB extends DBSchema {
  records: {
    key: string;
    value: AtoRecord;
    indexes: { byCreatedAt: string };
  };
}

let dbPromise: Promise<IDBPDatabase<AtoDB>> | null = null;

export const getDB = (): Promise<IDBPDatabase<AtoDB>> => {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available in this environment"));
  }
  if (!dbPromise) {
    dbPromise = openDB<AtoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_RECORDS)) {
          const store = db.createObjectStore(STORE_RECORDS, { keyPath: "id" });
          store.createIndex(INDEX_CREATED_AT, "createdAt");
        }
      },
    });
  }
  return dbPromise;
};
