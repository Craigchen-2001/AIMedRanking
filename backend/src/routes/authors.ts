///Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/src/routes/authors.ts
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { PrismaClient } from "@prisma/client";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const rows = await prisma.$queryRaw<{ name: string }[]>`
      SELECT DISTINCT UNNEST("authors") AS name
      FROM "Paper"
      WHERE array_length("authors", 1) IS NOT NULL
      ORDER BY name ASC
    `;
    res.json(rows.map((r) => r.name));
  } catch (err) {
    console.error("Failed to fetch authors", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const prisma2 = new PrismaClient();

let cache: {
  timestamp: number;
  ranking: any[];
  byConference: Record<string, any[]>;
  top30: any[];
} | null = null;

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 小時

async function computeAll() {
  const rows = await prisma2.paper.findMany({
    select: { conference: true, year: true, authors: true }
  });

  const allowed = ["ICLR", "ICML", "KDD", "NEURIPS", "ACL"];

  const normalizeConf = (c: string) => {
    const t = (c || "").split(" ")[0].toUpperCase();
    return allowed.includes(t) ? t : null;
  };

  // 全會議作者排名
  const countMap: Record<string, number> = {};

  for (const p of rows) {
    if (!normalizeConf(p.conference)) continue;

    for (const a of p.authors ?? []) {
      countMap[a] = (countMap[a] || 0) + 1;
    }
  }

  const ranking = Object.entries(countMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .map((x, i) => ({ ...x, rank: i + 1 }));

  // 各會議前 10
  const byConference: Record<string, any[]> = {};
  for (const conf of allowed) {
    const map: Record<string, number> = {};

    for (const p of rows) {
      if (normalizeConf(p.conference) !== conf) continue;
      for (const a of p.authors ?? []) {
        map[a] = (map[a] || 0) + 1;
      }
    }

    byConference[conf] = Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  const top30 = ranking.slice(0, 30);

  cache = {
    timestamp: Date.now(),
    ranking,
    byConference,
    top30
  };

  return cache;
}

async function ensureCache() {
  if (!cache || Date.now() - cache.timestamp > CACHE_TTL) {
    return computeAll();
  }
  return cache;
}

// GET /api/authors/ranking
router.get("/ranking", async (_req, res) => {
  const data = await ensureCache();
  res.json({ items: data.ranking });
});

// GET /api/authors/by-conference/KDD
router.get("/by-conference/:conf", async (req, res) => {
  const conf = req.params.conf.toUpperCase();
  const data = await ensureCache();
  res.json({ conference: conf, items: data.byConference[conf] ?? [] });
});

// GET /api/authors/top30
router.get("/top30", async (_req, res) => {
  const data = await ensureCache();
  res.json({ items: data.top30 });
});



export default router;
