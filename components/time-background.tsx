"use client";

import { useEffect, useState } from "react";
import { getTimeColor, type TimeColor } from "@/lib/time-color";

export function TimeBackground() {
  const [color, setColor] = useState<TimeColor | null>(null);

  useEffect(() => {
    const apply = () => {
      const c = getTimeColor();
      setColor(c);
      const root = document.documentElement;
      root.style.setProperty("--bg-from", c.from);
      root.style.setProperty("--bg-to", c.to);
      root.style.setProperty("--bg-text", c.text);
      document.body.style.background = `linear-gradient(180deg, ${c.from} 0%, ${c.to} 100%)`;
      document.body.style.color = c.text;
    };
    apply();
    const id = window.setInterval(apply, 60_000);
    return () => window.clearInterval(id);
  }, []);

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
