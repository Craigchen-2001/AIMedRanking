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

const getAllYears = (): number[] => {
  const yearSet = new Set<number>();
  papers.forEach((p) => yearSet.add(p.year));
  return Array.from(yearSet).sort();
};

const getStackedAuthorData = () => {
  const years = getAllYears();
  const authorMap: Record<string, Record<number, number>> = {};

  papers.forEach((paper) => {
    paper.authors.forEach((author) => {
      if (!authorMap[author]) authorMap[author] = {};
      authorMap[author][paper.year] = (authorMap[author][paper.year] || 0) + 1;
    });
  });

  return Object.entries(authorMap)
    .map(([name, yearCount]) => {
      const entry: any = { name };
      years.forEach((y) => {
        entry[y] = yearCount[y] || 0;
      });
      entry.total = Object.values(yearCount).reduce((a, b) => a + b, 0);
      return entry;
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 30);
};

const yearColors: Record<number, string> = {
  2020: "#ccc",
  2021: "#aabbee",
  2022: "#82ca9d",
  2023: "#8884d8",
  2024: "#ffc658",
  2025: "#ff8042",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white p-2 border rounded shadow text-xs space-y-1">
      <p className="font-semibold">{label}</p>
      {payload.map((entry: any, index: number) => (
        entry.value > 0 && (
          <p key={index} style={{ color: entry.color }}>
            {entry.name} : {entry.value}
          </p>
        )
      ))}
    </div>
  );
};

const Top30ChartContainer = () => {
  const data = useMemo(() => getStackedAuthorData(), []);
  const years = useMemo(() => getAllYears(), []);

  return (
    <div className="w-full px-4 py-2">
      <h2 className="text-lg font-semibold mb-4 text-center">Top 30 Authors</h2>
      <div className="w-full overflow-x-auto max-w-full">
        <div className="min-w-[1200px] h-[500px] bg-white rounded-xl shadow px-4 py-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 30, bottom: 120 }}
            >
              <XAxis
                dataKey="name"
                interval={0}
                angle={-45}
                textAnchor="end"
                height={110}
                tick={{ fontSize: 11 }}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {years.map((year) => (
                <Bar
                  key={year}
                  dataKey={year.toString()}
                  stackId="a"
                  fill={yearColors[year] || "#ccc"}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Top30ChartContainer;
