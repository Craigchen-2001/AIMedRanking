"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Roboto_Slab } from "next/font/google";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft } from "lucide-react";

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

const chartColors = [
  "#d32f2f",
  "#1976d2",
  "#388e3c",
  "#f57c00",
  "#7b1fa2",
  "#0288d1",
  "#c2185b",
  "#512da8",
  "#455a64",
  "#9e9d24",
  "#5d4037",
  "#00838f",
  "#8e24aa",
  "#c62828",
  "#2e7d32",
  "#1565c0",
];

function normalizeConf(name: string): "ICLR" | "ICML" | "NeurIPS" | "KDD" | "ACL" | "Other" {
  const t = (name || "").toUpperCase();
  if (t.includes("ICLR")) return "ICLR";
  if (t.includes("ICML")) return "ICML";
  if (t.includes("KDD")) return "KDD";
  if (t.includes("NEURIPS") || t.includes("NIPS")) return "NeurIPS";
  if (t.includes("ACL")) return "ACL";
  return "Other";
}

export default function TopicTrendPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [topNTopic, setTopNTopic] = useState<5 | 10 | "all">(5);
  const [topNSub, setTopNSub] = useState<5 | 10>(5);

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

  const overallTrend = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const p of papers) counts[p.year] = (counts[p.year] || 0) + 1;
    return Object.entries(counts).map(([year, count]) => ({ year: +year, count })).sort((a, b) => a.year - b.year);
  }, [papers]);

  const mainTopicTrends = useMemo(() => {
    const counts: Record<number, Record<string, number>> = {};
    for (const p of papers) {
      const year = p.year;
      if (!counts[year]) counts[year] = {};
      ["Topic Axis I", "Topic Axis II", "Topic Axis III"].forEach((axis) => {
        const axisData = p[axis as keyof Paper] as AxisData | undefined;
        if (!axisData) return;
        const main = axisData.MainTopic || "N/A";
        if (main === "N/A") return;
        counts[year][main] = (counts[year][main] || 0) + 1;
      });
    }
    const totalCounts: Record<string, number> = {};
    Object.values(counts).forEach((yearData) => {
      for (const [main, count] of Object.entries(yearData)) totalCounts[main] = (totalCounts[main] || 0) + count;
    });
    const sortedTopics = Object.entries(totalCounts).sort((a, b) => b[1] - a[1]);
    let topTopics: string[];
    if (topNTopic === "all") topTopics = sortedTopics.map(([t]) => t);
    else topTopics = sortedTopics.slice(0, topNTopic).map(([t]) => t);
    return Object.entries(counts)
      .map(([year, topics]) => {
        const row: Record<string, number | string> = { year: +year };
        topTopics.forEach((t) => (row[t] = topics[t] || 0));
        return row;
      })
      .sort((a, b) => (a.year as number) - (b.year as number));
  }, [papers, topNTopic]);

  const subTopicTrends = useMemo(() => {
    const counts: Record<number, Record<string, number>> = {};
    for (const p of papers) {
      const year = p.year;
      if (!counts[year]) counts[year] = {};
      ["Topic Axis I", "Topic Axis II", "Topic Axis III"].forEach((axis) => {
        const axisData = p[axis as keyof Paper] as AxisData | undefined;
        if (!axisData) return;
        const sub = axisData.SubTopic || "N/A";
        if (sub === "N/A") return;
        counts[year][sub] = (counts[year][sub] || 0) + 1;
      });
    }
    const totalCounts: Record<string, number> = {};
    Object.values(counts).forEach((yearData) => {
      for (const [sub, count] of Object.entries(yearData)) totalCounts[sub] = (totalCounts[sub] || 0) + count;
    });
    const topSubs = Object.entries(totalCounts).sort((a, b) => b[1] - a[1]).slice(0, topNSub).map(([sub]) => sub);
    return Object.entries(counts)
      .map(([year, subs]) => {
        const row: Record<string, number | string> = { year: +year };
        topSubs.forEach((sub) => (row[sub] = subs[sub] || 0));
        return row;
      })
      .sort((a, b) => (a.year as number) - (b.year as number));
  }, [papers, topNSub]);

  const conferenceComparison = useMemo(() => {
    const counts: Record<number, Record<string, number>> = {};
    for (const p of papers) {
      const year = p.year;
      const conf = normalizeConf(p.conference);
      if (!counts[year]) counts[year] = {};
      counts[year][conf] = (counts[year][conf] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([year, confs]) => ({ year: +year, ...confs }))
      .sort((a, b) => a.year - b.year);
  }, [papers]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const sorted = [...payload].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      return (
        <div className="bg-white border border-gray-300 shadow-md p-2 rounded-md text-[10px] leading-tight">
          <p className="font-semibold mb-1">{label}</p>
          {sorted.map((entry, idx) => (
            <p key={idx} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 z-50 bg-red-800 h-16 flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-3">
          <img src="/logo02.png" alt="AI Med Logo" width={60} height={40}/>
          <div className={`${robotoSlab.className} text-xl font-bold text-white`}>AI MED RANKING</div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-white text-lg font-semibold">AI-MED Trend Dashboard</div>
        <Link href="/" className="flex items-center gap-2 bg-white text-red-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition">
          <ArrowLeft size={16} /> Home
        </Link>
      </header>

      <main className="pt-10 grid grid-cols-1 xl:grid-cols-2 gap-6 w-full p-6">
        {loading ? (
          <div className="col-span-2 py-6 text-center text-gray-500 text-sm">Loading…</div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-full h-[55vh]">
              <h3 className="text-base font-semibold mb-3 text-red-700 border-b border-red-300 pb-1">Overall Growth of AI-in-Medicine Publications</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={overallTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="count" stroke="#dc2626" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-full h-[55vh]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold text-red-700 border-b border-red-300 pb-1">Trend of Major Research Domains (Topic)</h3>
                <div className="flex gap-2">
                  <button onClick={() => setTopNTopic(5)} className={`px-2 py-1 rounded text-xs ${topNTopic === 5 ? "bg-red-700 text-white" : "bg-gray-200 text-gray-700"}`}>Top 5</button>
                  <button onClick={() => setTopNTopic(10)} className={`px-2 py-1 rounded text-xs ${topNTopic === 10 ? "bg-red-700 text-white" : "bg-gray-200 text-gray-700"}`}>Top 10</button>
                  <button onClick={() => setTopNTopic("all")} className={`px-2 py-1 rounded text-xs ${topNTopic === "all" ? "bg-red-700 text-white" : "bg-gray-200 text-gray-700"}`}>All</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="95%">
                <LineChart data={mainTopicTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {Object.keys(mainTopicTrends[0] || {}).filter((k) => k !== "year").map((topic, idx) => (
                    <Line key={topic} type="monotone" dataKey={topic} stroke={chartColors[idx % chartColors.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-full h-[55vh]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold text-red-700 border-b border-red-300 pb-1">Trend of Emerging Technical Directions and Tasks (Subtopic)</h3>
                <div className="flex gap-2">
                  <button onClick={() => setTopNSub(5)} className={`px-2 py-1 rounded text-xs ${topNSub === 5 ? "bg-red-700 text-white" : "bg-gray-200 text-gray-700"}`}>Top 5</button>
                  <button onClick={() => setTopNSub(10)} className={`px-2 py-1 rounded text-xs ${topNSub === 10 ? "bg-red-700 text-white" : "bg-gray-200 text-gray-700"}`}>Top 10</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height="95%">
                <LineChart data={subTopicTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {Object.keys(subTopicTrends[0] || {}).filter((k) => k !== "year").map((sub, idx) => (
                    <Line key={sub} type="monotone" dataKey={sub} stroke={chartColors[idx % chartColors.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 w-full h-[55vh]">
              <h3 className="text-base font-semibold mb-3 text-red-700 border-b border-red-300 pb-1">Trend of AI-in-Medicine Research Across Major Conferences</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={conferenceComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  {Object.keys(conferenceComparison[0] || {}).filter((k) => k !== "year").map((conf, idx) => (
                    <Line key={conf} type="monotone" dataKey={conf} stroke={chartColors[idx % chartColors.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
