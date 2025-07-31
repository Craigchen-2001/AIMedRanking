"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { papers } from "@/mock/papers";
import { useMemo } from "react";

const yearColors: Record<number, string> = {
  2020: "#ccc",
  2021: "#aabbee",
  2022: "#82ca9d",
  2023: "#8884d8",
  2024: "#ffc658",
  2025: "#ff8042",
};

const conferences = [
  "ICLR (International Conference on Learning Representations)",
  "ICML (International Conference on Machine Learning)",
  "NeurIPS (Neural Information Processing Systems)",
  "CVPR (Computer Vision and Pattern Recognition)",
  "ACL (Association for Computational Linguistic)",
  "KDD (ACM SIGKDD Conference on Knowledge Discovery and Data Mining)",
  "WWW (The Web Conference)",
];

const ChartByConference = ({ conference }: { conference: string }) => {
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    papers.forEach((p) => yearSet.add(p.year));
    return Array.from(yearSet).sort();
  }, []);

  const data = useMemo(() => {
    const affYearMap: Record<string, Record<number, number>> = {};
    papers.forEach((p) => {
      if (p.conference !== conference) return;
      const affs = Array.isArray(p.affiliation) ? p.affiliation : [p.affiliation || "N/A"];
      affs.forEach((aff) => {
        if (!affYearMap[aff]) affYearMap[aff] = {};
        affYearMap[aff][p.year] = (affYearMap[aff][p.year] || 0) + 1;
      });
    });

    return Object.entries(affYearMap)
      .map(([aff, yearCounts]) => {
        const row: any = { name: aff };
        years.forEach((y) => {
          row[y] = yearCounts[y] || 0;
        });
        row.total = Object.values(yearCounts).reduce((a, b) => a + b, 0);
        return row;
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [conference, years]);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <XAxis type="number" />
          <YAxis
            dataKey="name"
            type="category"
            width={250}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-gray-300 p-2 text-xs rounded shadow">
                    <p className="font-semibold mb-1">{label}</p>
                    {payload.map((entry, index) => (
                      <p key={index} style={{ color: entry.color }}>
                        {entry.dataKey}: {entry.value}
                      </p>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            content={() => (
              <ul style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
                {years.map((year) => (
                  <li key={year} style={{ display: "flex", alignItems: "center", fontSize: "12px" }}>
                    <div style={{
                      width: 12,
                      height: 12,
                      backgroundColor: yearColors[year],
                      marginRight: 4,
                    }} />
                    {year}
                  </li>
                ))}
              </ul>
            )}
          />
          {years.map((y) => (
            <Bar key={y} dataKey={y} stackId="a" fill={yearColors[y]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const AffiliationConferenceGrid = () => {
  return (
    <div className="">
      <h2 className="text-lg font-semibold text-center mb-4">Top 10 Affiliations by Conference</h2>
      {conferences.map((conf) => (
        <div key={conf} className="border rounded p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2">{conf}</h3>
          <ChartByConference conference={conf} />
        </div>
      ))}
    </div>
  );
};

export default AffiliationConferenceGrid;
