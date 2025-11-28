// /Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/frontend/src/app/ranking/topic/page.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Roboto_Slab } from "next/font/google";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import CountdownLoader from "@/components/CountdownLoader";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], weight: ["700"], display: "swap" });

interface AxisData {
  MainTopic: string;
  SubTopic: string;
}

interface Paper {
  id: string;
  conference: string;
  title: string;
  year: number;
  "Topic Axis I": AxisData;
  "Topic Axis II": AxisData;
  "Topic Axis III": AxisData;
}

const medalColors = ["bg-yellow-400 text-white", "bg-gray-400 text-white", "bg-orange-500 text-white"];
const chartColors = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#14b8a6", "#6366f1", "#22c55e", "#eab308", "#ec4899", "#06b6d4", "#94a3b8"];

export default function TopicRankingPage() {
  const [axis, setAxis] = useState<"Axis I" | "Axis II" | "Axis III">("Axis I");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [topNSub, setTopNSub] = useState<5 | 15 | 30>(15);
  const [yearSel, setYearSel] = useState<number | "All">("All");
  const [levelSel, setLevelSel] = useState<"MainTopic" | "SubTopic">("MainTopic");
  const [topNFlex, setTopNFlex] = useState<5 | 15 | 30>(15);

  const axisKeyMap: Record<typeof axis, keyof Paper> = {
    "Axis I": "Topic Axis I",
    "Axis II": "Topic Axis II",
    "Axis III": "Topic Axis III",
  };

  const axisDescriptions: Record<typeof axis, string> = {
    "Axis I": 'Clinical & Biological Application Domains ("What")',
    "Axis II": 'Core Methodological Contributions ("How")',
    "Axis III": 'Principles for Clinical Translation & Deployment ("How Well")',
  };

  async function fetchAllPapers(): Promise<Paper[]> {
    const take = 100;
    let page = 1;
    let totalPages = 1;
    const out: Paper[] = [];
    while (page <= totalPages) {
      const res = await fetch(`/api/papers?page=${page}&take=${take}`, { cache: "no-store" });
      if (!res.ok) break;
      const data = await res.json();
      totalPages = data.totalPages ?? 1;
      const items = (data.items ?? []) as Paper[];
      out.push(...items);
      page += 1;
      if (page > 50) break;
    }
    return out;
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const items = await fetchAllPapers();
      if (alive) setPapers(items);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const topics = useMemo(() => {
    const counts: Record<string, { total: number; subs: Record<string, number> }> = {};
    for (const p of papers) {
      const axisKey = axisKeyMap[axis];
      const axisData = p[axisKey] as AxisData | undefined;
      const main = axisData?.MainTopic || "N/A";
      const sub = axisData?.SubTopic || "N/A";
      if (main === "N/A") continue;
      if (!counts[main]) counts[main] = { total: 0, subs: {} };
      counts[main].total++;
      if (sub !== "N/A") counts[main].subs[sub] = (counts[main].subs[sub] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([topic, data]) => ({
        topic,
        count: data.total,
        subtopics: Object.entries(data.subs)
          .map(([sub, count]) => ({ sub, count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.count - a.count);
  }, [papers, axis]);

  const mainTopicsAll = useMemo(() => {
    const counts: Record<string, number> = {};
    const keys: (keyof Paper)[] = ["Topic Axis I", "Topic Axis II", "Topic Axis III"];
    for (const p of papers) {
      for (const k of keys) {
        const d = p[k] as AxisData | undefined;
        const m = d?.MainTopic || "N/A";
        if (m === "N/A") continue;
        counts[m] = (counts[m] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);
  }, [papers]);

  const totalMainAll = useMemo(() => mainTopicsAll.reduce((s, x) => s + x.count, 0), [mainTopicsAll]);

  const subtopicsAll = useMemo(() => {
    const counts: Record<string, number> = {};
    const keys: (keyof Paper)[] = ["Topic Axis I", "Topic Axis II", "Topic Axis III"];
    for (const p of papers) {
      for (const k of keys) {
        const d = p[k] as AxisData | undefined;
        const s = d?.SubTopic || "N/A";
        if (s === "N/A") continue;
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([sub, count]) => ({ sub, count }))
      .sort((a, b) => b.count - a.count);
  }, [papers]);

  const totalSubAll = useMemo(() => subtopicsAll.reduce((s, x) => s + x.count, 0), [subtopicsAll]);

  const treemapAll = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const keys: (keyof Paper)[] = ["Topic Axis I", "Topic Axis II", "Topic Axis III"];
    for (const p of papers) {
      for (const k of keys) {
        const d = p[k] as AxisData | undefined;
        const m = d?.MainTopic || "N/A";
        const s = d?.SubTopic || "N/A";
        if (m === "N/A" || s === "N/A") continue;
        if (!map[m]) map[m] = {};
        map[m][s] = (map[m][s] || 0) + 1;
      }
    }
    return Object.entries(map).map(([m, subs]) => ({
      name: m,
      children: Object.entries(subs)
        .map(([s, c]) => ({ name: s, size: c }))
        .sort((a, b) => b.size - a.size),
    }));
  }, [papers]);

  const years = useMemo(() => {
    const setY = new Set<number>();
    papers.forEach((p) => setY.add(p.year));
    return Array.from(setY).sort((a, b) => a - b);
  }, [papers]);

  const filteredFlex = useMemo(() => {
    const counts: Record<string, number> = {};
    const keys: (keyof Paper)[] = ["Topic Axis I", "Topic Axis II", "Topic Axis III"];
    for (const p of papers) {
      if (yearSel !== "All" && p.year !== yearSel) continue;
      for (const k of keys) {
        const d = p[k] as AxisData | undefined;
        const m = d?.MainTopic || "N/A";
        const s = d?.SubTopic || "N/A";
        const key = levelSel === "MainTopic" ? m : s;
        if (key === "N/A") continue;
        counts[key] = (counts[key] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topNFlex);
  }, [papers, yearSel, levelSel, topNFlex]);

  return (
    <div className="pt-10 w-full min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-red-800 h-14 flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-3">
          <img src="/logo02.png" alt="AI Med Logo" width={52} height={34} />
          <div className={`${robotoSlab.className} text-lg font-bold text-white`}>AIMed RANK</div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-white text-base font-semibold">Topic Ranking</div>
        <div className="flex gap-3">
          <Link href="/" className="flex items-center gap-2 bg-white text-red-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition">
            <ArrowLeft size={16} />
            Home
          </Link>
          <Link href="/ranking/author" className="flex items-center gap-2 bg-white text-red-800 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition">
            <BookOpen size={16} />
            Author Ranking 
          </Link>
        </div>
      </header>

      <main className="px-4 md:px-6">
        {loading ? (
          // <div className="py-10 text-center text-gray-500">Loading…</div>
          <div className="pt-20">
          <CountdownLoader seconds={15} />
        </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-red-700">Topic Ranking Table</h3>
                <div className="text-xs text-gray-500">{axisDescriptions[axis]}</div>
              </div>
              <div className="flex gap-2 mb-3">
                {(["Axis I", "Axis II", "Axis III"] as const).map((ax) => (
                  <button
                    key={ax}
                    onClick={() => {
                      setAxis(ax);
                      setExpanded(null);
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm ${axis === ax ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800"}`}
                  >
                    {ax}
                  </button>
                ))}
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-red-600 text-white text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 w-12">#</th>
                      <th className="px-3 py-2">Topic</th>
                      <th className="px-3 py-2 w-20 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody className="max-h-[520px] overflow-y-auto">
                    {topics.map((t, idx) => {
                      const isExpanded = expanded === t.topic;
                      return (
                        <>
                          <tr
                            key={t.topic}
                            onClick={() => setExpanded(isExpanded ? null : t.topic)}
                            className={`${idx % 2 ? "bg-white" : "bg-gray-50"} cursor-pointer`}
                          >
                            <td className="px-3 py-2 w-12 text-center">
                              {idx < 3 ? (
                                <span className={`px-2 py-0.5 rounded-full ${medalColors[idx]} text-xs font-bold`}>{idx + 1}</span>
                              ) : (
                                <span className="text-sm text-gray-700">{idx + 1}</span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className={`${idx < 3 ? "font-semibold" : ""}`}>{t.topic}</span>
                                {t.subtopics.length > 0 && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right w-20">{t.count}</td>
                          </tr>

                          {isExpanded && t.subtopics.length > 0 && (
                            <tr className="bg-white">
                              <td colSpan={3} className="px-3 py-2">
                                <div className="text-xs font-semibold mb-1">Top SubTopics</div>
                                <table className="w-full text-xs border">
                                  <thead className="bg-gray-100 text-gray-700">
                                    <tr>
                                      <th className="px-2 py-1 w-8">#</th>
                                      <th className="px-2 py-1">SubTopic</th>
                                      <th className="px-2 py-1 w-14 text-right">Count</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {t.subtopics.slice(0, 5).map((s, subIdx) => (
                                      <tr key={s.sub} className="border-t">
                                        <td className="px-2 py-1">{subIdx + 1}</td>
                                        <td className="px-2 py-1">{s.sub}</td>
                                        <td className="px-2 py-1 text-right">{s.count}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>

                    
                </table>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-bold text-red-700 mb-2">MainTopic Distribution</h3>
              <div className="h-[440px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mainTopicsAll} dataKey="count" nameKey="topic" cx="50%" cy="50%" outerRadius={130}>
                      {mainTopicsAll.map((_, idx) => (
                        <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                      ))}
                    </Pie>
                    <ReTooltip
                      formatter={(v, n) => [`${v} (${((v as number) / Math.max(1, totalMainAll) * 100).toFixed(1)}%)`, n as string]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 9, lineHeight: "14px", marginTop: 8 }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-red-700">Top SubTopics</h3>
                <div className="flex gap-2">
                  {[5, 15, 30].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTopNSub(n as 5 | 15 | 30)}
                      className={`px-3 py-1.5 rounded-md text-sm ${topNSub === n ? "bg-red-600 text-white" : "bg-gray-200 text-gray-800"}`}
                    >
                      Top {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={subtopicsAll.slice(0, topNSub).reverse()}
                    margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
                  >
                    <XAxis type="number" />
                    <YAxis dataKey="sub" type="category" interval={0} orientation="right" width={260} tick={{ fontSize: 11 }} />
                    <ReTooltip formatter={(v) => [`${v} (${((v as number) / Math.max(1, totalSubAll) * 100).toFixed(1)}%)`, "Count"]} />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-red-700">Flexible Ranking</h3>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={yearSel === "All" ? "All" : String(yearSel)}
                    onChange={(e) => setYearSel(e.target.value === "All" ? "All" : parseInt(e.target.value))}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="All">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <select
                    value={levelSel}
                    onChange={(e) => setLevelSel(e.target.value as "MainTopic" | "SubTopic")}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value="MainTopic">MainTopic</option>
                    <option value="SubTopic">SubTopic</option>
                  </select>
                  <select
                    value={topNFlex}
                    onChange={(e) => setTopNFlex(parseInt(e.target.value) as 5 | 15 | 30)}
                    className="border rounded-md px-2 py-1 text-sm"
                  >
                    <option value={5}>Top 5</option>
                    <option value={15}>Top 15</option>
                    <option value={30}>Top 30</option>
                  </select>
                </div>
              </div>
              <div className="h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={filteredFlex.slice().reverse()} margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                    <XAxis type="number" />
                    <YAxis dataKey="name" interval={0} type="category" orientation="right" width={260} tick={{ fontSize: 11 }} />
                    <ReTooltip />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
