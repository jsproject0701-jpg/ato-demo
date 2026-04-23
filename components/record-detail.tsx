"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { TimeBackground } from "@/components/time-background";
import {
  deleteRecord,
  getRecordsServerSnapshot,
  getRecordsSnapshot,
  subscribeRecords,
} from "@/lib/storage";
import { useObjectUrl } from "@/lib/use-object-url";

type Props = {
  id: string;
};

const formatStamp = (iso: string): string => {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day}  ${hh}:${mm}`;
};

export function RecordDetail({ id }: Props) {
  const records = useSyncExternalStore(
    subscribeRecords,
    getRecordsSnapshot,
    getRecordsServerSnapshot
  );
  const record = useMemo(() => records.find((r) => r.id === id) ?? null, [records, id]);
  const [confirming, setConfirming] = useState(false);
  const audioUrl = useObjectUrl(record?.audioBlob);
  const imageUrl = useObjectUrl(record?.imageBlob);

  return (
    <main className="relative min-h-screen flex flex-col">
      <TimeBackground />

      <header className="px-6 pt-10 flex items-center justify-between">
        <Link
          href="/"
          className="font-mincho text-[12px] tracking-[0.4em] opacity-60 hover:opacity-90 transition-opacity duration-700"
        >
          戻る
        </Link>
        {record && (
          <button
            type="button"
            onClick={() => {
              if (!confirming) {
                setConfirming(true);
                return;
              }
              void deleteRecord(record.id).then(() => {
                window.location.href = "/";
              });
            }}
            className="font-mincho text-[11px] tracking-[0.4em] opacity-50 hover:opacity-80 transition-opacity duration-700"
          >
            {confirming ? "本当に消す" : "消す"}
          </button>
        )}
      </header>

      <section className="flex-1 px-8 py-16 max-w-xl mx-auto w-full">
        {!record ? (
          <p className="font-mincho text-center opacity-60 text-sm tracking-widest">
            この記録はみつかりません
          </p>
        ) : (
          <>
            <div className="mb-10">
              <div className="font-garamond italic text-[12px] tracking-[0.3em] opacity-55">
                {formatStamp(record.createdAt)}
              </div>
              <div className="font-mincho text-[11px] tracking-[0.4em] opacity-45 mt-1">
                {record.timeOfDay}
              </div>
            </div>

            {record.type === "voice" && (
              <div>
                {audioUrl && (
                  <audio
                    src={audioUrl}
                    controls
                    preload="metadata"
                    className="w-full mb-8 opacity-80"
                  />
                )}
                {record.transcript ? (
                  <p className="font-mincho text-[17px] leading-[2.2] tracking-[0.08em] whitespace-pre-wrap">
                    {record.transcript}
                  </p>
                ) : (
                  <p className="font-mincho text-[13px] opacity-50 tracking-widest">
                    声だけの記録
                  </p>
                )}
              </div>
            )}

            {record.type === "photo" && imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="w-full max-h-[70vh] object-contain"
              />
            )}

            {record.type === "answer" && (
              <div>
                <p className="font-mincho text-[13px] tracking-wider opacity-55 mb-6 leading-loose">
                  {record.question}
                </p>
                <p className="font-mincho text-[17px] leading-[2.2] tracking-[0.08em] whitespace-pre-wrap">
                  {record.answer}
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
