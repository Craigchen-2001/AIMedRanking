// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// type PaperItem = { conference: string; year: number; authors: string[] };

// const ALLOWED = ["ICLR", "ICML", "KDD", "NEURIPS","ACL"] as const;
// const YEAR_COLORS: Record<number, string> = { 2020: "#ccc", 2021: "#aabbee", 2022: "#82ca9d", 2023: "#8884d8", 2024: "#ffc658", 2025: "#ff8042" };

// function tagConference(full: string): (typeof ALLOWED)[number] | null {
//   const t = (full || "").split(" ")[0].toUpperCase();
//   if (t === "NEURIPS") return "NEURIPS";
//   if (t === "ICLR") return "ICLR";
//   if (t === "ICML") return "ICML";
//   if (t === "KDD") return "KDD";
//   if (t === "ACL") return "ACL";
//   return null;
// }

// async function fetchAllPapers(): Promise<PaperItem[]> {
//   const take = 100;
//   let page = 1;
//   let totalPages = 1;
//   const out: PaperItem[] = [];
//   while (page <= totalPages) {
//     const res = await fetch(`/api/papers?page=${page}&take=${take}`, { cache: "no-store" });
//     if (!res.ok) break;
//     const data = await res.json();
//     totalPages = data.totalPages ?? 1;
//     const items = (data.items ?? []) as any[];
//     for (const p of items) out.push({ conference: p.conference, year: p.year, authors: p.authors ?? [] });
//     page += 1;
//     if (page > 50) break;
//   }
//   return out;
// }

// function getAllYears(rows: PaperItem[]): number[] {
//   const s = new Set<number>();
//   rows.forEach((p) => s.add(p.year));
//   return Array.from(s).sort();
// }

// export default function Top30ChartContainer() {
//   const [rows, setRows] = useState<PaperItem[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       setLoading(true);
//       const items = await fetchAllPapers();
//       if (alive) setRows(items);
//       setLoading(false);
//     })();
//     return () => {
//       alive = false;
//     };
//   }, []);

//   const years = useMemo(() => getAllYears(rows), [rows]);

//   const data = useMemo(() => {
//     const authorMap: Record<string, Record<number, number>> = {};
//     for (const p of rows) {
//       const tag = tagConference(p.conference);
//       if (!tag || !ALLOWED.includes(tag)) continue;
//       for (const a of p.authors || []) {
//         authorMap[a] ||= {};
//         authorMap[a][p.year] = (authorMap[a][p.year] || 0) + 1;
//       }
//     }
//     return Object.entries(authorMap)
//       .map(([name, yc]) => {
//         const e: any = { name, total: 0 };
//         for (const y of years) {
//           const v = yc[y] || 0;
//           e[y] = v;
//           e.total += v;
//         }
//         return e;
//       })
//       .sort((a, b) => b.total - a.total)
//       .slice(0, 30);
//   }, [rows, years]);

//   return (
//     <div className="w-full px-4 py-2">
//       <h3 className="text-lg font-bold text-center text-red-700 mb-4">Top 30 Authors</h3>
//       <div className="w-full overflow-x-auto max-w-full">
//         <div className="min-w-[1200px] h-[500px] bg-white rounded-xl shadow px-4 py-2">
//           {loading ? (
//             <div className="w-full h-full flex items-center justify-center">Loading…</div>
//           ) : (
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart data={data} layout="horizontal" margin={{ top: 20, right: 30, left: 30, bottom: 120 }}>
//                 <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={110} tick={{ fontSize: 11 }} />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 {years.map((y) => (
//                   <Bar key={y} dataKey={y.toString()} stackId="a" fill={YEAR_COLORS[y] || "#ccc"} />
//                 ))}
//               </BarChart>
//             </ResponsiveContainer>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Top30ChartContainer() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      const res = await fetch("/api/authors/top30");
      const data = await res.json();

      if (alive) setRows(data.items || []);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const mapped = rows.map((r) => ({
    name: r.name,
    total: r.count
  }));

  return (
    <div className="w-full px-4 py-2">
      <h3 className="text-lg font-bold text-center text-red-700 mb-4">Top 30 Authors</h3>
      <div className="w-full overflow-x-auto max-w-full">
        <div className="min-w-[1200px] h-[500px] bg-white rounded-xl shadow px-4 py-2">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mapped} layout="horizontal" margin={{ top: 20, right: 30, left: 30, bottom: 120 }}>
                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={110} tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#d32f2f" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
