"use client";

import { useEffect, useState } from "react";

export function ElapsedClock({ startedAt }: { startedAt: string }) {
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    const update = () => {
      setTotalSeconds(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const label =
    h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return <span className="tabular-nums">{label}</span>;
}
