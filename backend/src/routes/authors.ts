///Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/src/routes/authors.ts
import { Router } from "express";
import { prisma } from "../lib/prisma.js";

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

export default router;
