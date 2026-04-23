"use client";

import { useRef, useState } from "react";
import { addRecord, compressImage } from "@/lib/storage";
import { getTimeColor } from "@/lib/time-color";

type Props = {
  onSaved?: () => void;
};

export function PhotoUpload({ onSaved }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const dataUrl = await compressImage(file);
      const color = getTimeColor();
      addRecord({
        type: "photo",
        timeOfDay: color.name,
        imageBlob: dataUrl,
      });
      onSaved?.();
    } catch {
      setError("保存できませんでした");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="font-mincho text-[11px] tracking-[0.4em] opacity-60 hover:opacity-90 transition-opacity duration-700 disabled:opacity-30"
        aria-label="写真を追加"
      >
        {busy ? "—" : "写真"}
      </button>
      {error && (
        <span className="mt-1 text-[10px] tracking-[0.3em] opacity-50">{error}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
