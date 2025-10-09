"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Roboto_Slab } from "next/font/google";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
  "#b91c1c",
  "#dc2626",
  "#ef4444",
  "#f87171",
  "#991b1b",
  "#7f1d1d",
  "#fecaca",
  "#fca5a5",
  "#fee2e2",
  "#450a0a",
];

function normalizeConf(name: string): "ICLR" | "ICML" | "NeurIPS" | "KDD" | "Other" {
  const t = (name || "").toUpperCase();
  if (t.includes("ICLR")) return "ICLR";
  if (t.includes("ICML")) return "ICML";
  if (t.includes("KDD")) return "KDD";
  if (t.includes("NEURIPS") || t.includes("NIPS")) return "NeurIPS";
  return "Other";
}

export default function TopicTrendPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

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
    return Object.entries(counts)
      .map(([year, topics]) => ({ year: +year, ...topics }))
      .sort((a, b) => a.year - b.year);
  }, [papers]);

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
      for (const [sub, count] of Object.entries(yearData)) {
        totalCounts[sub] = (totalCounts[sub] || 0) + count;
      }
    });
    const topSubs = Object.entries(totalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sub]) => sub);

    return Object.entries(counts)
      .map(([year, subs]) => {
        const row: Record<string, number | string> = { year: +year };
        topSubs.forEach((sub) => {
          row[sub] = subs[sub] || 0;
        });
        return row;
      })
      .sort((a, b) => (a.year as number) - (b.year as number));
  }, [papers]);

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
        <div className="bg-white border border-gray-300 shadow-md p-3 rounded-md text-sm">
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
    <div className="pt-20 w-full min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-red-800 h-16 flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-3">
          <Image src="/logo02.png" alt="AI Med Logo" width={60} height={40} priority />
          <div className={`${robotoSlab.className} text-xl font-bold text-white`}>AI MED RANKING</div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-white text-lg font-semibold">
          Trends
        </div>
        <div className="flex gap-3 items-center">
          <Link
            href="/"
            className="flex items-center gap-2 bg-white text-red-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-2 bg-white text-red-800 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition">
              Ranking ▾
            </button>
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition">
              <Link
                href="/ranking/topic"
                className="block px-4 py-2 hover:bg-red-100 text-red-800"
              >
                Topic Ranking
              </Link>
              <Link
                href="/ranking/author"
                className="block px-4 py-2 hover:bg-red-100 text-red-800"
              >
                Author Ranking
              </Link>
            </div>
          </div>
        </div>
      </header>


      <main className="px-6 flex flex-col items-center">
        {loading ? (
          <div className="py-6 text-center text-gray-500">Loading…</div>
        ) : (
          <>
            <div className="w-5/6 max-w-6xl bg-white border border-gray-300 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-red-700 border-b-2 border-red-300 pb-2">
                Trend of MainTopics (Across All Axes) — Shows yearly shifts in overall research focus areas
              </h3>
              <ResponsiveContainer width="100%" height={700}>
                <LineChart data={mainTopicTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend />
                  {Object.keys(mainTopicTrends[0] || {})
                    .filter((k) => k !== "year")
                    .map((topic, idx) => (
                      <Line
                        key={topic}
                        type="monotone"
                        dataKey={topic}
                        stroke={chartColors[idx % chartColors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="w-5/6 max-w-6xl bg-white border border-gray-300 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-red-700 border-b-2 border-red-300 pb-2">
                Trend of Top 10 SubTopics (Across All Axes) — Highlights which detailed topics are rising or declining
              </h3>
              <ResponsiveContainer width="100%" height={600}>
                <LineChart data={subTopicTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend />
                  {Object.keys(subTopicTrends[0] || {})
                    .filter((k) => k !== "year")
                    .map((sub, idx) => (
                      <Line
                        key={sub}
                        type="monotone"
                        dataKey={sub}
                        stroke={chartColors[idx % chartColors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="w-5/6 max-w-6xl bg-white border border-gray-300 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-red-700 border-b-2 border-red-300 pb-2">
                Conference Comparison — Yearly number of AI in Medicine papers across ICLR, ICML, NeurIPS, KDD
              </h3>
              <ResponsiveContainer width="100%" height={700}>
                <LineChart data={conferenceComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <ReTooltip content={<CustomTooltip />} />
                  <Legend />
                  {Object.keys(conferenceComparison[0] || {})
                    .filter((k) => k !== "year")
                    .map((conf, idx) => (
                      <Line
                        key={conf}
                        type="monotone"
                        dataKey={conf}
                        stroke={chartColors[idx % chartColors.length]}
                        strokeWidth={2}
                        dot={false}
                      />
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
