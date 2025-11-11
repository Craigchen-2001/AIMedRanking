"use client";
import React, { useMemo, useState, useEffect } from "react";

type Props = {
  placeholder: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
};

export default function DropdownMulti({ placeholder, options, selected, onToggle, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return options;
    return options.filter((x) => x.toLowerCase().includes(s));
  }, [q, options]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={[
          "w-full text-left px-3 py-2 rounded-lg border shadow-sm bg-white text-sm flex flex-wrap gap-1 min-h-[2.5rem]",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:border-red-300",
        ].join(" ")}
      >
        {selected.length ? (
          selected.map((opt) => (
            <span
              key={opt}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200"
            >
              {opt}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(opt);
                }}
                className="ml-1 text-red-500 hover:text-red-700 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </button>

      {open && !disabled && (
        <div className="relative mt-1 w-full rounded-xl border-2 border-red-400 bg-white shadow-lg z-10">
          <div className="p-2 border-b">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full px-2 py-1.5 rounded-md border border-blue-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    onToggle(opt);
                    setOpen(false);
                  }}
                  className={["w-full text-left px-3 py-1.5 rounded-md text-sm", active ? "bg-red-600 text-white" : "hover:bg-red-100"].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
            {!filtered.length && <div className="px-3 py-2 text-sm text-gray-500">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}
