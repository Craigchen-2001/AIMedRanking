"use client";

import { useEffect, useState } from "react";

export default function CountdownLoader({ seconds = 15 }) {
  const [remaining, setRemaining] = useState(seconds);
  const [round, setRound] = useState(1);
  const [text, setText] = useState("");

  const msg1 = "Loading your dashboard…";
  const msg2 = "Still preparing data…";

  useEffect(() => {
    if (remaining === 0) {
      if (round === 1) {
        setRound(2);
        setRemaining(seconds);
      } else {
        return;
      }
    }

    const t = setInterval(() => {
      setRemaining((v) => (v > 0 ? v - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [remaining, round, seconds]);

  useEffect(() => {
    const target = round === 1 ? msg1 : msg2;
    let i = 0;

    setText("");

    const typer = setInterval(() => {
      setText(target.slice(0, i));
      i++;
      if (i > target.length) clearInterval(typer);
    }, 50);

    return () => clearInterval(typer);
  }, [round]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
      <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin"></div>

      <div className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-500 to-red-700 text-lg font-semibold drop-shadow-sm tracking-wide">
        {text}
      </div>

      <div className="text-sm text-gray-700 font-medium animate-pulse">
        {remaining}s
      </div>

      <div className="text-[11px] text-gray-400 tracking-wide">
        This may take a moment depending on server load.
      </div>
    </div>
  );
}
