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

const conferenceColors: Record<string, string> = {
  ICLR: "#8884d8",
  CVPR: "#82ca9d",
  NeurIPS: "#ffc658",
  ICML: "#ff8042",
  ACL: "#a28fd0",
  KDD: "#8dd1e1",
  AAAI: "#d0ed57",
  IJCAI: "#a4de6c",
  CHI: "#d084c4",
  WWW: "#ffbb28",
  ECCV: "#c2c2f0",
  ICCV: "#a1c4fd",
};

const extractConferenceName = (full: string) => {
  return full.split(" ")[0];
};

const Top30ChartContainer = () => {
  const data = useMemo(() => {
    const countMap: Record<string, Record<string, number>> = {};

    papers.forEach((p) => {
      const affiliations = Array.isArray(p.affiliation)
        ? p.affiliation
        : [p.affiliation || "N/A"];
      const conf = extractConferenceName(p.conference);

      affiliations.forEach((aff) => {
        if (!countMap[aff]) countMap[aff] = {};
        countMap[aff][conf] = (countMap[aff][conf] || 0) + 1;
      });
    });

    return Object.entries(countMap)
      .map(([name, conferenceCounts]) => {
        const total = Object.values(conferenceCounts).reduce((a, b) => a + b, 0);
        return { name, ...conferenceCounts, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 30);
  }, []);

  const conferenceList = useMemo(() => Object.keys(conferenceColors), []);

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4 text-center">Top 30 Affiliations</h2>
      <div className="w-full h-[700px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
          >
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              interval={0}
              tick={{ fontSize: 12 }}
              width={300}
            />
            <Tooltip />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            {conferenceList.map((conf) => (
              <Bar
                key={conf}
                dataKey={conf}
                stackId="a"
                fill={conferenceColors[conf]}
                name={conf}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Top30ChartContainer;
