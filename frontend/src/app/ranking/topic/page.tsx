"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Roboto_Slab } from 'next/font/google';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, Legend,
  ResponsiveContainer, Treemap, BarChart, Bar, XAxis, YAxis
} from 'recharts';

const robotoSlab = Roboto_Slab({ subsets: ['latin'], weight: ['700'], display: 'swap' });

interface AxisData {
  MainTopic: string;
  SubTopic: string;
}

interface Paper {
  id: string;
  conference: string;
  title: string;
  year: number;
  'Topic Axis I': AxisData;
  'Topic Axis II': AxisData;
  'Topic Axis III': AxisData;
}

const medalColors = ['bg-yellow-400 text-white', 'bg-gray-400 text-white', 'bg-orange-500 text-white'];
const chartColors = ['#f59e0b', '#6b7280', '#d97706', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#ef4444'];

export default function TopicRankingPage() {
  const [axis, setAxis] = useState<'Axis I' | 'Axis II' | 'Axis III'>('Axis I');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const axisKeyMap: Record<typeof axis, keyof Paper> = {
    'Axis I': 'Topic Axis I',
    'Axis II': 'Topic Axis II',
    'Axis III': 'Topic Axis III',
  };

  const axisDescriptions: Record<typeof axis, string> = {
    'Axis I': 'Clinical & Biological Application Domains (The "What")',
    'Axis II': 'Core Methodological Contributions (The "How")',
    'Axis III': 'Principles for Clinical Translation & Deployment (The "How Well")',
  };

  async function fetchAllPapers(): Promise<Paper[]> {
    const take = 100;
    let page = 1;
    let totalPages = 1;
    const out: Paper[] = [];
    while (page <= totalPages) {
      const res = await fetch(`/api/papers?page=${page}&take=${take}`, { cache: 'no-store' });
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
    return () => { alive = false; };
  }, []);

  const topics = useMemo(() => {
    const counts: Record<string, { total: number; subs: Record<string, number> }> = {};
    for (const p of papers) {
      const axisKey = axisKeyMap[axis];
      const axisData = p[axisKey] as AxisData | undefined;
      const main = axisData?.MainTopic || 'N/A';
      const sub = axisData?.SubTopic || 'N/A';
      if (main === 'N/A') continue;
      if (!counts[main]) counts[main] = { total: 0, subs: {} };
      counts[main].total++;
      if (sub !== 'N/A') counts[main].subs[sub] = (counts[main].subs[sub] || 0) + 1;
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
    const keys: (keyof Paper)[] = ['Topic Axis I', 'Topic Axis II', 'Topic Axis III'];
    for (const p of papers) {
      for (const k of keys) {
        const d = p[k] as AxisData | undefined;
        const m = d?.MainTopic || 'N/A';
        if (m === 'N/A') continue;
        counts[m] = (counts[m] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([topic, count]) => ({ topic, count })).sort((a, b) => b.count - a.count);
  }, [papers]);

  const totalMainAll = useMemo(() => mainTopicsAll.reduce((s, x) => s + x.count, 0), [mainTopicsAll]);

  const subtopicsAll = useMemo(() => {
    const counts: Record<string, number> = {};
    const keys: (keyof Paper)[] = ['Topic Axis I', 'Topic Axis II', 'Topic Axis III'];
    for (const p of papers) {
      for (const k of keys) {
        const d = p[k] as AxisData | undefined;
        const s = d?.SubTopic || 'N/A';
        if (s === 'N/A') continue;
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return Object.entries(counts).map(([sub, count]) => ({ sub, count })).sort((a, b) => b.count - a.count);
  }, [papers]);

  const totalSubAll = useMemo(() => subtopicsAll.reduce((s, x) => s + x.count, 0), [subtopicsAll]);

  const treemapAll = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    const keys: (keyof Paper)[] = ['Topic Axis I', 'Topic Axis II', 'Topic Axis III'];
    for (const p of papers) {
      for (const k of keys) {
        const d = p[k] as AxisData | undefined;
        const m = d?.MainTopic || 'N/A';
        const s = d?.SubTopic || 'N/A';
        if (m === 'N/A' || s === 'N/A') continue;
        if (!map[m]) map[m] = {};
        map[m][s] = (map[m][s] || 0) + 1;
      }
    }
    return Object.entries(map).map(([m, subs]) => ({
      name: m,
      children: Object.entries(subs).map(([s, c]) => ({ name: s, size: c })).sort((a, b) => b.size - a.size)
    }));
  }, [papers]);

  return (
    <div className="pt-20 w-full min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-red-800 h-20 flex items-center justify-between px-6 border-b">
        <div className="flex items-center gap-3">
          <Image src="/logo02.png" alt="AI Med Logo" width={70} height={50} priority />
          <div className={`${robotoSlab.className} text-2xl font-bold text-white`}>AI MED RANKING</div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-white text-xl font-semibold">Topic Ranking</div>
        <div className="flex gap-3">
          <Link href="/" className="px-4 py-2 rounded-lg bg-white text-red-800 font-medium hover:bg-gray-100">Home</Link>
          <Link href="/ranking/author" className="px-4 py-2 rounded-lg bg-white text-red-800 font-medium hover:bg-gray-100">Author Ranking</Link>
        </div>
      </header>

      <main className="px-6 flex flex-col items-center">
        <div className="text-gray-600 text-sm mb-2">{axisDescriptions[axis]}</div>
        <div className="flex gap-4 mb-4">
          {(['Axis I', 'Axis II', 'Axis III'] as const).map(ax => (
            <button
              key={ax}
              onClick={() => { setAxis(ax); setExpanded(null); }}
              className={`px-4 py-2 rounded-lg font-medium ${axis === ax ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {ax}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-6 text-center text-gray-500">Loading…</div>
        ) : (
          <>
            <div className="w-5/6 max-w-6xl border border-gray-300 rounded-lg overflow-hidden shadow-md bg-white mb-6">
              <table className="w-full text-left">
                <thead className="bg-red-600 text-white">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Topic</th>
                    <th className="px-4 py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t, idx) => {
                    const isExpanded = expanded === t.topic;
                    return (
                      <>
                        <tr
                          key={t.topic}
                          className={`border-t cursor-pointer hover:bg-gray-100 ${idx < 3 ? 'font-bold text-lg' : ''}`}
                          onClick={() => setExpanded(isExpanded ? null : t.topic)}
                        >
                          <td className="px-4 py-2">
                            {idx < 3 ? (
                              <span className={`px-3 py-1 rounded-full ${medalColors[idx]} font-bold`}>{idx + 1}</span>
                            ) : idx + 1}
                          </td>
                          <td className="px-4 py-2 flex items-center gap-2">
                            {t.topic}
                            {t.subtopics.length > 0 && (isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                          </td>
                          <td className="px-4 py-2">{t.count}</td>
                        </tr>
                        {isExpanded && t.subtopics.length > 0 && (
                          <tr>
                            <td colSpan={3} className="px-6 py-3 bg-gray-50">
                              <div className="text-sm font-semibold mb-2">Top SubTopics</div>
                              <table className="w-full text-left border border-gray-200 rounded-md">
                                <thead className="bg-gray-200 text-gray-700">
                                  <tr>
                                    <th className="px-3 py-1">#</th>
                                    <th className="px-3 py-1">SubTopic</th>
                                    <th className="px-3 py-1">Count</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {t.subtopics.slice(0, 5).map((s, subIdx) => (
                                    <tr key={s.sub} className="border-t">
                                      <td className="px-3 py-1">{subIdx + 1}</td>
                                      <td className="px-3 py-1">{s.sub}</td>
                                      <td className="px-3 py-1">{s.count}</td>
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

            <div className="w-5/6 max-w-6xl bg-white border border-gray-300 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-red-700 border-b-2 border-red-300 pb-2">MainTopic Distribution (All Axes)</h3>
              <ResponsiveContainer width="100%" height={700}>
                <PieChart>
                  <Pie
                    data={mainTopicsAll}
                    dataKey="count"
                    nameKey="topic"
                    cx="50%"
                    cy="50%"
                    outerRadius={200}
                    label
                  >
                    {mainTopicsAll.map((_, idx) => (
                      <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(v, n) => [`${v} (${((v as number) / Math.max(1, totalMainAll) * 100).toFixed(1)}%)`, n as string]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-5/6 max-w-6xl bg-white border border-gray-300 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-red-700 border-b-2 border-red-300 pb-2">Top 15 SubTopics (All Axes)</h3>
              <ResponsiveContainer width="100%" height={860}>
                <BarChart
                  layout="vertical"
                  data={subtopicsAll.slice(0, 15).reverse()}
                  margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
                >
                  <XAxis type="number" />
                  <YAxis dataKey="sub" type="category" orientation="right" width={240} tick={{ fontSize: 12 }} />
                  <ReTooltip formatter={(v) => [`${v} (${((v as number) / Math.max(1, totalSubAll) * 100).toFixed(1)}%)`, 'Count']} />
                  <Bar dataKey="count" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-5/6 max-w-6xl bg-white border border-gray-300 rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-bold mb-4 text-red-700 border-b-2 border-red-300 pb-2">MainTopic vs SubTopic Treemap (All Axes)</h3>
              <ResponsiveContainer width="100%" height={920}>
                <Treemap
                  data={treemapAll}
                  dataKey="size"
                  nameKey="name"
                  stroke="#fff"
                  fill="#8884d8"
                  content={(props: any) => {
                    const { x, y, width, height, name, value, index } = props;
                    return (
                      <g>
                        <rect x={x} y={y} width={width} height={height} fill={chartColors[index % chartColors.length]} stroke="#fff" />
                        {width > 110 && height > 44 && (
                          <text x={x + 6} y={y + 22} fontSize={14} fill="#fff" pointerEvents="none">
                            {name} ({value})
                          </text>
                        )}
                      </g>
                    );
                  }}
                >
                  <ReTooltip />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
