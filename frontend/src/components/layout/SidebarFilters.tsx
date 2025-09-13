"use client";
import React, { useMemo, useState, useEffect, useDeferredValue } from "react";
import { FixedSizeList as VList, ListChildComponentProps } from "react-window";

type CodeAvail = "any" | "public" | "private";

type Props = {
  selectedConfs: string[];
  setSelectedConfs: (val: string[]) => void;
  selectedYears: string[];
  setSelectedYears: (val: string[]) => void;
  selectedAuthors: string[];
  setSelectedAuthors: (val: string[]) => void;
  codeAvail: CodeAvail;
  setCodeAvail: (v: CodeAvail) => void;
  onApplyFilters?: () => void;
  onClearFilters?: () => void;
};

const CONFERENCES = [
  { value: "ICLR", label: "ICLR" },
  { value: "ICML", label: "ICML" },
  { value: "KDD", label: "KDD" },
  { value: "NEURIPS", label: "NeurIPS" },
] as const;

const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025"] as const;

const CODE_OPTS: { value: CodeAvail; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
];

function Pill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm rounded-full border transition shadow-sm",
        active
          ? "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 focus:ring-2 focus:ring-red-200"
          : "bg-white text-gray-700 border-gray-200 hover:text-red-700 hover:border-red-300 focus:ring-2 focus:ring-red-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  count,
  children,
  onReset,
  showResetAlways,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  onReset?: () => void;
  showResetAlways?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-red-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <button className="flex items-center gap-2" onClick={() => setOpen((v) => !v)}>
          <span className="font-semibold text-gray-900">{title}</span>
          {typeof count === "number" && (
            <span
              className={[
                "text-xs px-2 py-0.5 rounded-full",
                count > 0 ? "bg-red-50 text-red-700 ring-1 ring-red-100" : "bg-gray-100 text-gray-600",
              ].join(" ")}
            >
              {count}
            </span>
          )}
        </button>
        {onReset && (showResetAlways || (count && count > 0)) && (
          <button className="text-xs text-red-700 hover:text-red-900 underline" onClick={onReset}>
            Reset
          </button>
        )}
      </div>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

const SidebarFilters: React.FC<Props> = ({
  selectedConfs,
  setSelectedConfs,
  selectedYears,
  setSelectedYears,
  selectedAuthors,
  setSelectedAuthors,
  codeAvail,
  setCodeAvail,
  onApplyFilters,
  onClearFilters,
}) => {
  const [authorQuery, setAuthorQuery] = useState("");
  const [allAuthors, setAllAuthors] = useState<string[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const deferredQuery = useDeferredValue(authorQuery);

  useEffect(() => {
    let mounted = true;
    setLoadingAuthors(true);
    fetch("http://localhost:3001/authors")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setAllAuthors(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setAllAuthors([]);
      })
      .finally(() => mounted && setLoadingAuthors(false));
    return () => {
      mounted = false;
    };
  }, []);

  const toggle = (val: string, arr: string[], setter: (v: string[]) => void) =>
    arr.includes(val) ? setter(arr.filter((v) => v !== val)) : setter([...arr, val]);

  const filteredAuthors = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const pinned = [...selectedAuthors];
    const pool = q ? allAuthors.filter((a) => a.toLowerCase().includes(q)) : allAuthors;
    const rest = pool.filter((a) => !selectedAuthors.includes(a));
    return [...pinned, ...rest];
  }, [deferredQuery, allAuthors, selectedAuthors]);

  const Row = ({ index, style }: ListChildComponentProps) => {
    const author = filteredAuthors[index];
    const checked = selectedAuthors.includes(author);
    return (
      <label
        style={style}
        className="flex items-center gap-2 rounded-lg px-2 cursor-pointer hover:bg-red-50 text-sm text-gray-800"
      >
        <input
          type="checkbox"
          className="accent-red-700"
          checked={checked}
          onChange={() => toggle(author, selectedAuthors, setSelectedAuthors)}
        />
        <span className="truncate">{author}</span>
      </label>
    );
  };

  return (
    <div className="w-60 md:w-64 lg:w-72 xl:w-80 fixed left-0 top-16 h-[calc(100dvh-4rem)] px-4 lg:px-6 py-4 lg:py-6 border-r border-red-100 bg-gradient-to-b from-white to-amber-50 overflow-y-auto">
      <div className="space-y-4 text-gray-800">
        <Section title="Conference" count={selectedConfs.length} onReset={() => setSelectedConfs([])}>
          <div className="flex gap-2 flex-nowrap overflow-x-auto">
            {CONFERENCES.map(({ value, label }) => (
              <Pill key={value} active={selectedConfs.includes(value)} onClick={() => toggle(value, selectedConfs, setSelectedConfs)}>
                {label}
              </Pill>
            ))}
          </div>
        </Section>

        <Section title="Year" count={selectedYears.length} onReset={() => setSelectedYears([])}>
          <div className="flex flex-wrap gap-2">
            {YEARS.map((y) => (
              <Pill key={y} active={selectedYears.includes(y)} onClick={() => toggle(y, selectedYears, setSelectedYears)}>
                {y}
              </Pill>
            ))}
          </div>
        </Section>

        <Section
          title="Author"
          count={selectedAuthors.length}
          onReset={() => {
            setSelectedAuthors([]);
            setAuthorQuery("");
          }}
          showResetAlways
        >
          <div className="mb-2">
            <div className="rounded-xl p-[2px] bg-gradient-to-r from-red-700 via-rose-600 to-pink-600 shadow-[0_0_0_1px_rgba(0,0,0,0.02)]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search author..."
                  value={authorQuery}
                  onChange={(e) => setAuthorQuery(e.target.value)}
                  className="w-full bg-white rounded-[10px] px-3 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-200"
                />
                {authorQuery && (
                  <button
                    aria-label="clear"
                    onClick={() => setAuthorQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-sm"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-600 mb-1">
            {loadingAuthors ? "Loading..." : `Showing ${filteredAuthors.length} / ${allAuthors.length}`}
          </div>
          <div className="w-full rounded-xl border border-red-100 bg-white">
            <VList height={180} width={"100%"} itemCount={filteredAuthors.length} itemSize={32}>
              {Row}
            </VList>
          </div>
        </Section>

        <Section
          title="Code"
          count={codeAvail !== "any" ? 1 : 0}
          onReset={() => setCodeAvail("any")}
        >
          <div className="flex gap-2">
            {CODE_OPTS.map((o) => (
              <Pill key={o.value} active={codeAvail === o.value} onClick={() => setCodeAvail(o.value)}>
                {o.label}
              </Pill>
            ))}
          </div>
        </Section>

        <Section title="Topic">
          <p className="text-gray-400 text-sm italic">[TBD]</p>
        </Section>
        <Section title="Method">
          <p className="text-gray-400 text-sm italic">[TBD]</p>
        </Section>
        <Section title="Application">
          <p className="text-gray-400 text-sm italic">[TBD]</p>
        </Section>

        <div className="flex gap-2 pt-2">
          <button
            onClick={onApplyFilters}
            className="flex-1 bg-gradient-to-r from-red-700 to-rose-600 text-white px-4 py-2 rounded-xl shadow-sm hover:from-red-800 hover:to-rose-700 active:scale-[0.99] transition"
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setAuthorQuery("");
              setSelectedAuthors([]);
              onClearFilters?.();
            }}
            className="border border-gray-300 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarFilters;
