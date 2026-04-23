"use client";

import { useEffect, useState } from "react";
import { getTimeColor, type TimeColor } from "@/lib/time-color";

export const useTimeColor = (): TimeColor | null => {
  const [color, setColor] = useState<TimeColor | null>(null);

  useEffect(() => {
    const tick = () => setColor(getTimeColor());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return color;
};
