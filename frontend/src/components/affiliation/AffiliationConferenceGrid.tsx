"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type PaperItem = { conference: string; affiliations: string | null };

const ALLOWED = ["ICLR", "ICML", "KDD", "NEURIPS"] as const;
const COLORS: Record<(typeof ALLOWED)[number], string> = {
  ICLR: "#8884d8",
  ICML: "#ff8042",
  KDD: "#8dd1e1",
  NEURIPS: "#ffc658",
};

function tagConference(full: string): (typeof ALLOWED)[number] | null {
  const t = (full || "").split(" ")[0].toUpperCase();
  if (t === "NEURIPS") return "NEURIPS";
  if (t === "ICLR") return "ICLR";
  if (t === "ICML") return "ICML";
  if (t === "KDD") return "KDD";
  return null;
}

function splitAffiliations(s: string | null): string[] {
  if (!s) return [];
  return s
    .split(/[;,|]/)
    .map((x) => x.trim())
    .filter(Boolean);
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
    for (const p of items) {
      out.push({ conference: p.conference, affiliations: p.affiliations ?? null });
    }
    page += 1;
    if (page > 50) break;
  }
  return out;
}

export default function AffiliationConferenceGrid() {
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

  const data = useMemo(() => {
    const countMap: Record<string, Partial<Record<typeof ALLOWED[number], number>>> = {};
    for (const p of rows) {
      const tag = tagConference(p.conference);
      if (!tag) continue;
      if (!ALLOWED.includes(tag)) continue;
      const affs = splitAffiliations(p.affiliations);
      if (affs.length === 0) affs.push("N/A");
      for (const aff of affs) {
        countMap[aff] ||= {};
        countMap[aff][tag] = (countMap[aff][tag] || 0) + 1;
      }
    }
    const arr = Object.entries(countMap).map(([name, counts]) => {
      const row: any = { name, total: 0 };
      for (const k of ALLOWED) {
        const v = counts[k] || 0;
        row[k] = v;
        row.total += v;
      }
      return row;
    });
    return arr.sort((a, b) => b.total - a.total).slice(0, 30);
  }, [rows]);

  const conferenceList = ALLOWED;

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4 text-center">
        Top 30 Affiliations by Conference
      </h2>
      <div className="w-full h-[700px]">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" interval={0} tick={{ fontSize: 12 }} width={300} />
              <Tooltip />
              <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-xs">{value}</span>} />
              {conferenceList.map((conf) => (
                <Bar key={conf} dataKey={conf} stackId="a" fill={COLORS[conf]} name={conf} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
