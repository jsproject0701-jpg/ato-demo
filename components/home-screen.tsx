"use client";

import { useCallback, useEffect, useState } from "react";
import { TimeBackground } from "@/components/time-background";
import { useTimeColor } from "@/lib/use-time-color";
import { promptFor } from "@/lib/prompts";
import { loadRecords } from "@/lib/storage";
import type { AtoRecord } from "@/types/record";

export function HomeScreen() {
  const color = useTimeColor();
  const [records, setRecords] = useState<AtoRecord[]>([]);

  const refresh = useCallback(() => {
    setRecords(loadRecords());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <main className="relative min-h-screen flex flex-col">
      <TimeBackground />

      <header className="px-6 pt-10 flex items-start justify-between">
        <div className="font-garamond italic tracking-[0.4em] text-sm opacity-60">ato</div>
        {/* PhotoUpload はここに入る (Step 6) */}
        <div className="opacity-30 text-xs tracking-widest">写真</div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p
          className="font-mincho text-[15px] sm:text-base leading-loose tracking-[0.18em] opacity-80 max-w-xs"
          aria-live="polite"
        >
          {color ? promptFor(color.romaji) : ""}
        </p>

        {/* RecordButton はここに入る (Step 5) */}
        <div className="mt-12 w-44 h-44 rounded-full border opacity-40 flex items-center justify-center font-mincho tracking-[0.3em] text-sm">
          触れて、15秒
        </div>

        <p className="mt-10 font-garamond italic text-xs tracking-[0.35em] opacity-40">
          — ato is not judging.
        </p>
      </section>

      {/* QuestionCard はここに入る (Step 7) */}

      <section className="px-6 pb-32 pt-16">
        {/* RecordList はここに入る (Step 8) */}
        {records.length === 0 ? (
          <p className="text-center text-[12px] tracking-[0.35em] opacity-30 font-mincho">
            まだ、なにもない
          </p>
        ) : (
          <p className="text-center text-[12px] tracking-[0.35em] opacity-30 font-mincho">
            {records.length} の記録
          </p>
        )}
      </section>
    </main>
  );
}
