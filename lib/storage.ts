import type { AtoRecord } from "@/types/record";
import { getDB, INDEX_CREATED_AT, STORE_RECORDS } from "@/lib/db";

const ANSWERED_KEY = "ato:answered:v1";

const isBrowser = () => typeof window !== "undefined";

const uuid = (): string => {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

const EMPTY: AtoRecord[] = [];
let snapshot: AtoRecord[] = EMPTY;
let hydrated = false;
let hydrating: Promise<void> | null = null;
const listeners = new Set<() => void>();

const setSnapshot = (next: AtoRecord[]) => {
  snapshot = next.length > 0 ? next : EMPTY;
  listeners.forEach((cb) => cb());
};

export const hydrateRecords = async (): Promise<void> => {
  if (!isBrowser()) return;
  if (hydrated) return;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    try {
      const db = await getDB();
      const all = await db.getAllFromIndex(STORE_RECORDS, INDEX_CREATED_AT);
      // index は昇順、UI は降順
      setSnapshot(all.slice().reverse());
      hydrated = true;
    } catch {
      hydrated = true;
    } finally {
      hydrating = null;
    }
  })();
  return hydrating;
};

export const subscribeRecords = (cb: () => void): (() => void) => {
  listeners.add(cb);
  // 最初の購読者が来た時に lazy hydrate
  void hydrateRecords();
  return () => {
    listeners.delete(cb);
  };
};

export const getRecordsSnapshot = (): AtoRecord[] => snapshot;

export const getRecordsServerSnapshot = (): AtoRecord[] => EMPTY;

export const addRecord = async (
  partial: Omit<AtoRecord, "id" | "createdAt"> & { createdAt?: string }
): Promise<AtoRecord> => {
  const record: AtoRecord = {
    ...partial,
    id: uuid(),
    createdAt: partial.createdAt ?? new Date().toISOString(),
  };
  const db = await getDB();
  await db.put(STORE_RECORDS, record);
  setSnapshot([record, ...snapshot]);
  return record;
};

export const getRecord = (id: string): AtoRecord | undefined =>
  snapshot.find((r) => r.id === id);

export const deleteRecord = async (id: string): Promise<void> => {
  const db = await getDB();
  await db.delete(STORE_RECORDS, id);
  setSnapshot(snapshot.filter((r) => r.id !== id));
};

const todayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const hasAnsweredToday = (): boolean => {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(ANSWERED_KEY) === todayKey();
};

export const markAnsweredToday = () => {
  if (!isBrowser()) return;
  window.localStorage.setItem(ANSWERED_KEY, todayKey());
};

export const compressImage = async (
  file: File,
  maxDim = 1200,
  quality = 0.78
): Promise<Blob> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context が取得できません");
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("画像を書き出せませんでした"))),
      "image/jpeg",
      quality
    );
  });
};
