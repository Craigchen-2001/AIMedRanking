"use client";

import { useEffect, useState } from "react";

export default function CountdownLoader({ seconds = 15 }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-gray-500">
      <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>

      <div className="text-sm animate-pulse">
        Loading… {remaining}s
      </div>

      <div className="text-[11px] text-gray-400">
        If loading takes longer, please wait…
      </div>
    </div>
  );
}
