// backend/src/routes/favorites.ts
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

function mapPaper(p: any) {
  return {
    id: p.id,
    title: p.title,
    abstract: p.abstract,
    keywords: p.keywords,
    pdf_url: p.pdfUrl,
    conference: p.conference,
    year: p.year,
    isHealthcare: p.isHealthcare,
    topic: p.topic,
    method: p.method,
    application: p.application,
    codeLink: p.codeLink,
    authors: p.authors,
    datasetNames: p.datasetNames,
    datasetLinks: p.datasetLinks,
    affiliations: p.affiliations,
    authorsAffiliations: p.authorsAffiliations,
    reasoning: p.reasoning,
    updatedAt: p.updatedAt,
  };
}

router.get("/", authMiddleware, async (req, res) => {
  const userId = req.authUser!.id;
  const favs = await prisma.favorite.findMany({ where: { userId }, include: { paper: true } });
  res.json(favs.map(f => mapPaper(f.paper)));
});

router.post("/:paperId", authMiddleware, async (req, res) => {
  const userId = req.authUser!.id;
  const paperId = String(req.params.paperId || "");
  await prisma.favorite.upsert({
    where: { userId_paperId: { userId, paperId } },
    update: {},
    create: { userId, paperId },
  });
  res.json({ ok: true });
});

router.delete("/:paperId", authMiddleware, async (req, res) => {
  const userId = req.authUser!.id;
  const paperId = String(req.params.paperId || "");
  await prisma.favorite.delete({ where: { userId_paperId: { userId, paperId } } }).catch(() => null);
  res.json({ ok: true });
});

export default router;
