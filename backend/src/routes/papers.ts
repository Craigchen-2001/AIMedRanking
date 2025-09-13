import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

function nk(s: string) {
  return String(s || "").toLowerCase().replace(/[\s_:-]/g, "");
}
function findKey(obj: any, names: string[]) {
  if (!obj) return null;
  const map = Object.keys(obj).reduce<Record<string, string>>((m, k) => {
    m[nk(k)] = k;
    return m;
  }, {});
  for (const n of names) {
    const hit = map[nk(n)];
    if (hit) return hit;
  }
  return null;
}
function tryParse(v: any) {
  if (v == null) return null;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      const o = JSON.parse(v);
      return typeof o === "object" ? o : null;
    } catch {
      return null;
    }
  }
  return null;
}
function normalizeAxis(v: any) {
  if (v == null) return { MainTopic: null, SubTopic: null };
  const obj = tryParse(v) ?? v;
  if (typeof obj !== "object") return { MainTopic: String(obj || "") || null, SubTopic: null };
  const mk = findKey(obj, ["MainTopic", "Main Topic", "mainTopic", "main_topic", "main"]);
  const sk = findKey(obj, ["SubTopic", "Sub Topic", "subTopic", "sub_topic", "sub"]);
  const m = mk ? obj[mk] : null;
  const s = sk ? obj[sk] : null;
  return { MainTopic: m === "" ? null : m ?? null, SubTopic: s === "" ? null : s ?? null };
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const take = Math.min(100, Math.max(1, parseInt((req.query.take as string) || "20", 10)));
    const confs = ((req.query.confs as string) || "").split(",").map(s => s.trim()).filter(Boolean);
    const years = ((req.query.years as string) || "").split(",").map(s => parseInt(s, 10)).filter(n => Number.isFinite(n));
    const where: any = {};
    const and: any[] = [];
    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { abstract: { contains: q, mode: "insensitive" } },
          { keywords: { contains: q, mode: "insensitive" } }
        ]
      });
    }
    if (confs.length) and.push({ OR: confs.map(c => ({ conference: { contains: c, mode: "insensitive" } })) });
    if (years.length) and.push({ year: { in: years } });
    if (and.length) where.AND = and;
    const skip = (page - 1) * take;
    const select = {
      id: true,
      year: true,
      conference: true,
      title: true,
      authors: true,
      affiliations: true,
      authorsAffiliations: true,
      abstract: true,
      keywords: true,
      pdfUrl: true,
      isHealthcare: true,
      reasoning: true,
      topic: true,
      method: true,
      application: true,
      codeLink: true,
      datasetNames: true,
      datasetLinks: true,
      updatedAt: true,
      topicAxis1: true,
      topicAxis2: true,
      topicAxis3: true
    } as const;
    const [total, rows] = await Promise.all([
      prisma.paper.count({ where }),
      prisma.paper.findMany({ where, orderBy: [{ year: "desc" }, { id: "asc" }], skip, take, select })
    ]);
    const items = rows.map(p => ({
      id: p.id,
      year: p.year,
      conference: p.conference,
      title: p.title,
      authors: p.authors,
      affiliations: p.affiliations,
      authorsAffiliations: p.authorsAffiliations,
      abstract: p.abstract,
      keywords: p.keywords,
      pdf_url: p.pdfUrl,
      isHealthcare: p.isHealthcare,
      reasoning: p.reasoning,
      topic: p.topic,
      method: p.method,
      application: p.application,
      codeLink: p.codeLink,
      code_link: p.codeLink,
      datasetNames: p.datasetNames,
      datasetLinks: p.datasetLinks,
      dataset_name: p.datasetNames,
      updatedAt: p.updatedAt,
      "Topic Axis I": normalizeAxis(p.topicAxis1),
      "Topic Axis II": normalizeAxis(p.topicAxis2),
      "Topic Axis III": normalizeAxis(p.topicAxis3)
    }));
    res.json({ pageNum: page, pageSize: take, total, totalPages: Math.max(1, Math.ceil(total / take)), items });
  } catch {
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "");
    if (!id) return res.status(400).json({ error: "invalid_id" });
    const select = {
      id: true,
      year: true,
      conference: true,
      title: true,
      authors: true,
      affiliations: true,
      authorsAffiliations: true,
      abstract: true,
      keywords: true,
      pdfUrl: true,
      isHealthcare: true,
      reasoning: true,
      topic: true,
      method: true,
      application: true,
      codeLink: true,
      datasetNames: true,
      datasetLinks: true,
      updatedAt: true,
      topicAxis1: true,
      topicAxis2: true,
      topicAxis3: true
    } as const;
    const p = await prisma.paper.findUnique({ where: { id }, select });
    if (!p) return res.status(404).json({ error: "not_found" });
    res.json({
      id: p.id,
      year: p.year,
      conference: p.conference,
      title: p.title,
      authors: p.authors,
      affiliations: p.affiliations,
      authorsAffiliations: p.authorsAffiliations,
      abstract: p.abstract,
      keywords: p.keywords,
      pdf_url: p.pdfUrl,
      isHealthcare: p.isHealthcare,
      reasoning: p.reasoning,
      topic: p.topic,
      method: p.method,
      application: p.application,
      codeLink: p.codeLink,
      code_link: p.codeLink,
      datasetNames: p.datasetNames,
      datasetLinks: p.datasetLinks,
      dataset_name: p.datasetNames,
      updatedAt: p.updatedAt,
      "Topic Axis I": normalizeAxis(p.topicAxis1),
      "Topic Axis II": normalizeAxis(p.topicAxis2),
      "Topic Axis III": normalizeAxis(p.topicAxis3)
    });
  } catch {
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;

// import { Router, Request, Response } from "express";
// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();
// const router = Router();

// function nk(s: string) {
//   return String(s || "").toLowerCase().replace(/[\s_:-]/g, "");
// }
// function findKey(obj: any, names: string[]) {
//   if (!obj) return null;
//   const map = Object.keys(obj).reduce<Record<string, string>>((m, k) => {
//     m[nk(k)] = k;
//     return m;
//   }, {});
//   for (const n of names) {
//     const hit = map[nk(n)];
//     if (hit) return hit;
//   }
//   return null;
// }
// function toJsonMaybe(v: any) {
//   if (!v) return null;
//   if (typeof v === "object") return v;
//   if (typeof v === "string") {
//     try { return JSON.parse(v); } catch { return null; }
//   }
//   return null;
// }
// function readAxisFrom(obj: any, axis: "I" | "II" | "III") {
//   if (!obj) return { MainTopic: null, SubTopic: null };
//   const axisObjKey = findKey(obj, [
//     `Topic Axis ${axis}`,
//     `TopicAxis${axis}`,
//     `topicAxis${axis}`,
//     `axis${axis}`,
//     axis === "I" ? "axis1" : axis === "II" ? "axis2" : "axis3",
//     axis
//   ]);
//   const aobj = axisObjKey ? obj[axisObjKey] : null;
//   if (!aobj || typeof aobj !== "object") return { MainTopic: null, SubTopic: null };
//   const mainK = findKey(aobj, ["MainTopic", "Main Topic", "mainTopic", "main"]);
//   const subK = findKey(aobj, ["SubTopic", "Sub Topic", "subTopic", "sub"]);
//   return { MainTopic: mainK ? aobj[mainK] : null, SubTopic: subK ? aobj[subK] : null };
// }
// function shapeAxes(record: any) {
//   const parsed = toJsonMaybe(record?.topic);
//   const src = parsed || record?.topic || record;
//   const a1 = readAxisFrom(src, "I");
//   const a2 = readAxisFrom(src, "II");
//   const a3 = readAxisFrom(src, "III");
//   return { a1, a2, a3 };
// }

// router.get("/", async (req: Request, res: Response) => {
//   try {
//     const q = req.query.q as string | undefined;
//     const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
//     const take = Math.min(100, Math.max(1, parseInt((req.query.take as string) || "20", 10)));
//     const confs = ((req.query.confs as string) || "")
//       .split(",")
//       .map((c) => c.trim().toUpperCase())
//       .filter(Boolean);
//     const years = ((req.query.years as string) || "")
//       .split(",")
//       .map((y) => parseInt(y.trim(), 10))
//       .filter((n) => Number.isFinite(n));

//     const where: any = { AND: [] };
//     if (q) {
//       where.AND.push({
//         OR: [
//           { title: { contains: q, mode: "insensitive" } },
//           { abstract: { contains: q, mode: "insensitive" } },
//           { keywords: { contains: q, mode: "insensitive" } },
//           { authors: { has: q } },
//           { affiliations: { contains: q, mode: "insensitive" } },
//           { authorsAffiliations: { contains: q, mode: "insensitive" } }
//         ]
//       });
//     }
//     if (confs.length) {
//       const confOr = confs.map((c) => ({ conference: { startsWith: c, mode: "insensitive" } }));
//       where.AND.push({ OR: confOr });
//     }
//     if (years.length) where.AND.push({ year: { in: years } });

//     const skip = (page - 1) * take;

//     const select = {
//       id: true,
//       year: true,
//       conference: true,
//       title: true,
//       authors: true,
//       affiliations: true,
//       authorsAffiliations: true,
//       abstract: true,
//       keywords: true,
//       pdfUrl: true,
//       isHealthcare: true,
//       reasoning: true,
//       topic: true,
//       method: true,
//       application: true,
//       codeLink: true,
//       datasetNames: true,
//       datasetLinks: true,
//       updatedAt: true
//     } as const;

//     const total = await prisma.paper.count({ where });
//     const rows = await prisma.paper.findMany({
//       where,
//       orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
//       skip,
//       take,
//       select
//     });

//     const items = rows.map((p) => {
//       const { a1, a2, a3 } = shapeAxes(p as any);
//       return {
//         id: p.id,
//         year: p.year,
//         conference: p.conference,
//         title: p.title,
//         authors: p.authors,
//         affiliations: p.affiliations,
//         authorsAffiliations: p.authorsAffiliations,
//         abstract: p.abstract,
//         keywords: p.keywords,
//         pdf_url: p.pdfUrl,
//         isHealthcare: p.isHealthcare,
//         reasoning: p.reasoning,
//         topic: p.topic,
//         method: p.method,
//         application: p.application,
//         codeLink: p.codeLink,
//         code_link: p.codeLink,
//         datasetNames: p.datasetNames,
//         datasetLinks: p.datasetLinks,
//         dataset_name: p.datasetNames,
//         updatedAt: p.updatedAt,
//         "Topic Axis I": a1,
//         "Topic Axis II": a2,
//         "Topic Axis III": a3
//       };
//     });

//     res.json({
//       pageNum: page,
//       pageSize: take,
//       total,
//       totalPages: Math.max(Math.ceil(total / take), 1),
//       items
//     });
//   } catch {
//     res.status(500).json({ error: "internal_error" });
//   }
// });

// router.get("/:id", async (req: Request, res: Response) => {
//   try {
//     const id = (req.params.id || "").trim();
//     if (!id) return res.status(400).json({ error: "invalid_id" });

//     const select = {
//       id: true,
//       year: true,
//       conference: true,
//       title: true,
//       authors: true,
//       affiliations: true,
//       authorsAffiliations: true,
//       abstract: true,
//       keywords: true,
//       pdfUrl: true,
//       isHealthcare: true,
//       reasoning: true,
//       topic: true,
//       method: true,
//       application: true,
//       codeLink: true,
//       datasetNames: true,
//       datasetLinks: true,
//       updatedAt: true
//     } as const;

//     const p = await prisma.paper.findUnique({ where: { id }, select });
//     if (!p) return res.status(404).json({ error: "not_found" });

//     const { a1, a2, a3 } = shapeAxes(p as any);

//     res.json({
//       id: p.id,
//       year: p.year,
//       conference: p.conference,
//       title: p.title,
//       authors: p.authors,
//       affiliations: p.affiliations,
//       authorsAffiliations: p.authorsAffiliations,
//       abstract: p.abstract,
//       keywords: p.keywords,
//       pdf_url: p.pdfUrl,
//       isHealthcare: p.isHealthcare,
//       reasoning: p.reasoning,
//       topic: p.topic,
//       method: p.method,
//       application: p.application,
//       codeLink: p.codeLink,
//       code_link: p.codeLink,
//       datasetNames: p.datasetNames,
//       datasetLinks: p.datasetLinks,
//       dataset_name: p.datasetNames,
//       updatedAt: p.updatedAt,
//       "Topic Axis I": a1,
//       "Topic Axis II": a2,
//       "Topic Axis III": a3
//     });
//   } catch {
//     res.status(500).json({ error: "internal_error" });
//   }
// });

// export default router;
