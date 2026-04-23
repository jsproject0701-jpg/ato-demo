import type { AtoRecord } from "@/types/record";

const RECORDS_KEY = "ato:records:v1";
const ANSWERED_KEY = "ato:answered:v1";

const isBrowser = () => typeof window !== "undefined";

const uuid = (): string => {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `r_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const loadRecords = (): AtoRecord[] => {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AtoRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveRecords = (records: AtoRecord[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const addRecord = (
  partial: Omit<AtoRecord, "id" | "createdAt"> & { createdAt?: string }
): AtoRecord => {
  const record: AtoRecord = {
    ...partial,
    id: uuid(),
    createdAt: partial.createdAt ?? new Date().toISOString(),
  };
  const records = loadRecords();
  records.unshift(record);
  saveRecords(records);
  return record;
};

export const getRecord = (id: string): AtoRecord | undefined => {
  return loadRecords().find((r) => r.id === id);
};

export const deleteRecord = (id: string) => {
  const records = loadRecords().filter((r) => r.id !== id);
  saveRecords(records);
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
): Promise<string> => {
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

  return canvas.toDataURL("image/jpeg", quality);
};

export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
