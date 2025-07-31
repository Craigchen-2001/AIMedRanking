"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
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
  "ICLR", "ICML", "NeurIPS", "CVPR",
  "ACL", "KDD", "AAAI", "WWW",
  "CHI", "ECCV", "IJCAI", "ICCV"
];

const ChartByConference = ({ conference }: { conference: string }) => {
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    papers.forEach((p) => yearSet.add(p.year));
    return Array.from(yearSet).sort();
  }, []);

  const data = useMemo(() => {
    const authorMap: Record<string, Record<number, number>> = {};

    papers
      .filter((p) => p.conference.includes(conference))
      .forEach((paper) => {
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
      .slice(0, 10);
  }, [conference, years]);

  return (
    <div className="w-full h-64 border border-gray-600 rounded-md p-4 shadow-sm bg-white text-xs">
      <h3 className="font-semibold mb-2 text-sm text-center truncate">{conference}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
        >
          <XAxis
            dataKey="name"
            interval={0}
            angle={-30}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 10 }}
          />
          <YAxis />
          <Tooltip />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
          {years.map((year) => (
            <Bar
              key={year}
              dataKey={year.toString()}
              stackId="a"
              fill={yearColors[year] || "#ccc"}
              name={year.toString()}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const AuthorConferenceGrid = () => {
  return (
    <div className="">
      <h2 className="text-lg font-semibold text-center mb-4">Top 10 Authors by Conference</h2>
      <div className="flex flex-col gap-6">
        {conferences.map((conf) => (
          <ChartByConference key={conf} conference={conf} />
        ))}
      </div>
    </div>
  );
};

export default AuthorConferenceGrid;
