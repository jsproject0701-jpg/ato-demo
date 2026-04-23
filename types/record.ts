export type RecordType = "voice" | "photo" | "answer";

export type AtoRecord = {
  id: string;
  type: RecordType;
  createdAt: string;
  timeOfDay: string;

  audioBlob?: string;
  transcript?: string;

  imageBlob?: string;

  question?: string;
  answer?: string;
};
