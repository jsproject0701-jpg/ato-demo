import type { AtoRecord } from "@/types/record";
import { getDB, STORE_RECORDS } from "@/lib/db";

const OLD_RECORDS_KEY = "ato:records:v1";
const MIGRATED_KEY = "ato:migrated";
const MIGRATED_VALUE = "v1-idb";

type LegacyRecord = Omit<AtoRecord, "audioBlob" | "imageBlob"> & {
  audioBlob?: string | Blob;
  imageBlob?: string | Blob;
};

const dataUrlToBlob = async (value: string | Blob | undefined): Promise<Blob | undefined> => {
  if (!value) return undefined;
  if (value instanceof Blob) return value;
  // data URL or blob URL
  const res = await fetch(value);
  return res.blob();
};

export const migrateLsToIdb = async (): Promise<void> => {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATED_KEY) === MIGRATED_VALUE) return;

  const raw = window.localStorage.getItem(OLD_RECORDS_KEY);
  if (!raw) {
    window.localStorage.setItem(MIGRATED_KEY, MIGRATED_VALUE);
    return;
  }

  let parsed: LegacyRecord[];
  try {
    parsed = JSON.parse(raw) as LegacyRecord[];
  } catch {
    // 壊れていたら、これ以上触らない。フラグも立てない(ユーザーに気づかせる余地)
    return;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    window.localStorage.removeItem(OLD_RECORDS_KEY);
    window.localStorage.setItem(MIGRATED_KEY, MIGRATED_VALUE);
    return;
  }

  const db = await getDB();
  const tx = db.transaction(STORE_RECORDS, "readwrite");
  for (const legacy of parsed) {
    const record: AtoRecord = {
      id: legacy.id,
      type: legacy.type,
      createdAt: legacy.createdAt,
      timeOfDay: legacy.timeOfDay,
      transcript: legacy.transcript,
      question: legacy.question,
      answer: legacy.answer,
      audioBlob: await dataUrlToBlob(legacy.audioBlob),
      imageBlob: await dataUrlToBlob(legacy.imageBlob),
    };
    await tx.store.put(record);
  }
  await tx.done;

  window.localStorage.removeItem(OLD_RECORDS_KEY);
  window.localStorage.setItem(MIGRATED_KEY, MIGRATED_VALUE);
};
