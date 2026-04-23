"use client";

import Link from "next/link";
import type { AtoRecord } from "@/types/record";
import { useObjectUrl } from "@/lib/use-object-url";

type Props = {
  records: AtoRecord[];
};

const formatTime = (iso: string): string => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}月${day}日`;
};

const groupByDate = (records: AtoRecord[]): Array<[string, AtoRecord[]]> => {
  const map = new Map<string, AtoRecord[]>();
  for (const r of records) {
    const key = formatDate(r.createdAt);
    const arr = map.get(key) ?? [];
    arr.push(r);
    map.set(key, arr);
  }
  return Array.from(map.entries());
};

const PhotoThumb = ({ blob }: { blob: Blob | undefined }) => {
  const url = useObjectUrl(blob);
  return (
    <div className="mt-1 w-20 h-20 overflow-hidden border border-current/15">
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
      )}
    </div>
  );
};

const Preview = ({ record }: { record: AtoRecord }) => {
  if (record.type === "voice") {
    return (
      <p className="font-mincho text-[14px] leading-loose tracking-wider opacity-85 line-clamp-2">
        {record.transcript?.trim() || "(声だけの記録)"}
      </p>
    );
  }
  if (record.type === "photo") {
    return <PhotoThumb blob={record.imageBlob} />;
  }
  return (
    <div>
      <p className="font-mincho text-[12px] opacity-50 tracking-wider mb-1 line-clamp-1">
        {record.question}
      </p>
      <p className="font-mincho text-[14px] leading-loose tracking-wider opacity-85 line-clamp-2">
        {record.answer}
      </p>
    </div>
  );
};

export function RecordList({ records }: Props) {
  if (records.length === 0) {
    return (
      <p className="text-center text-[12px] tracking-[0.35em] opacity-30 font-mincho">
        まだ、なにもない
      </p>
    );
  }

  const groups = groupByDate(records);

  return (
    <div className="flex flex-col gap-10">
      {groups.map(([dateLabel, list]) => (
        <div key={dateLabel}>
          <div className="flex items-center gap-3 mb-4 opacity-50">
            <div className="h-px flex-1 bg-current/20" />
            <div className="font-mincho text-[11px] tracking-[0.4em]">{dateLabel}</div>
            <div className="h-px flex-1 bg-current/20" />
          </div>

          <ul className="flex flex-col gap-5">
            {list.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/records/${r.id}`}
                  className="block border-b border-current/10 pb-4 hover:opacity-100 opacity-90 transition-opacity duration-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-0.5 w-16">
                      <div className="font-garamond italic text-[12px] tracking-[0.2em] opacity-55">
                        {formatTime(r.createdAt)}
                      </div>
                      <div className="font-mincho text-[10px] tracking-[0.35em] opacity-40 mt-1">
                        {r.timeOfDay}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Preview record={r} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
