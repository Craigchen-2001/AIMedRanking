"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type PaperItem = { conference: string; year: number; authors: string[] };

const ALLOWED = ["ICLR", "ICML", "KDD", "NEURIPS","ACL"] as const;
const YEAR_COLORS: Record<number, string> = { 2020: "#ccc", 2021: "#aabbee", 2022: "#82ca9d", 2023: "#8884d8", 2024: "#ffc658", 2025: "#ff8042" };
const CONFS_TO_SHOW: Array<(typeof ALLOWED)[number]> = ["ICLR", "ICML", "NEURIPS", "KDD","ACL"];

function tagConference(full: string): (typeof ALLOWED)[number] | null {
  const t = (full || "").split(" ")[0].toUpperCase();
  if (t === "NEURIPS") return "NEURIPS";
  if (t === "ICLR") return "ICLR";
  if (t === "ICML") return "ICML";
  if (t === "KDD") return "KDD";
  if (t === "ACL") return "ACL"; 
  return null;
}

async function fetchAllPapers(): Promise<PaperItem[]> {
  const take = 100;
  let page = 1;
  let totalPages = 1;
  const out: PaperItem[] = [];
  while (page <= totalPages) {
    const res = await fetch(`/api/papers?page=${page}&take=${take}`, { cache: "no-store" });
    if (!res.ok) break;
    const data = await res.json();
    totalPages = data.totalPages ?? 1;
    const items = (data.items ?? []) as any[];
    for (const p of items) out.push({ conference: p.conference, year: p.year, authors: p.authors ?? [] });
    page += 1;
    if (page > 50) break;
  }
  return out;
}

function ChartByConference({ conference }: { conference: (typeof ALLOWED)[number] }) {
  const [rows, setRows] = useState<PaperItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const items = await fetchAllPapers();
      if (alive) setRows(items);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const years = useMemo(() => {
    const s = new Set<number>();
    rows.forEach((p) => s.add(p.year));
    return Array.from(s).sort();
  }, [rows]);

  const data = useMemo(() => {
    const authorMap: Record<string, Record<number, number>> = {};
    for (const p of rows) {
      const tag = tagConference(p.conference);
      if (tag !== conference) continue;
      for (const a of p.authors || []) {
        authorMap[a] ||= {};
        authorMap[a][p.year] = (authorMap[a][p.year] || 0) + 1;
      }
    }
    return Object.entries(authorMap)
      .map(([name, yc]) => {
        const e: any = { name, total: 0 };
        for (const y of years) {
          const v = yc[y] || 0;
          e[y] = v;
          e.total += v;
        }
        return e;
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [rows, years, conference]);

  return (
    <div className="w-full h-64 border border-gray-600 rounded-md p-4 shadow-sm bg-white text-xs">
      <h3 className="font-semibold mb-2 text-sm text-center truncate">{conference}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 30 }}>
          <XAxis dataKey="name" interval={0} angle={-30} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
          <YAxis />
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs">{value}</span>} />
          {years.map((y) => (
            <Bar key={y} dataKey={y.toString()} stackId="a" fill={YEAR_COLORS[y] || "#ccc"} name={y.toString()} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AuthorConferenceGrid() {
  return (
    <div className="">
      <h2 className="text-lg font-semibold text-center mb-4">Top 10 Authors by Conference</h2>
      <div className="flex flex-col gap-6">
        {CONFS_TO_SHOW.map((conf) => (
          <ChartByConference key={conf} conference={conf} />
        ))}
      </div>
    </div>
  );
}
