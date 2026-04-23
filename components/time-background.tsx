"use client";

import { useEffect } from "react";
import { useTimeColor } from "@/lib/use-time-color";

export function TimeBackground() {
  const color = useTimeColor();

  useEffect(() => {
    if (!color) return;
    const root = document.documentElement;
    root.style.setProperty("--bg-from", color.from);
    root.style.setProperty("--bg-to", color.to);
    root.style.setProperty("--bg-text", color.text);
    document.body.style.background = `linear-gradient(180deg, ${color.from} 0%, ${color.to} 100%)`;
    document.body.style.color = color.text;
  }, [color]);

  if (!color) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 -translate-x-1/2 text-center select-none"
      style={{ color: color.text, opacity: 0.55 }}
    >
      <div className="font-mincho text-[13px] tracking-[0.4em]">{color.name}</div>
      <div className="font-garamond italic text-[11px] tracking-[0.3em] mt-0.5">
        — {color.romaji}
      </div>
    </div>
  );
}
