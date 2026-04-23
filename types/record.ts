export type RecordType = "voice" | "photo" | "answer";

export type AtoRecord = {
  id: string;
  type: RecordType;
  createdAt: string;
  timeOfDay: string;

  audioBlob?: Blob;
  transcript?: string;

  imageBlob?: Blob;

  question?: string;
  answer?: string;
};
