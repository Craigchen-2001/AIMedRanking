import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function asString(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function asArray(v: unknown): string[] {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x));
  const s = String(v).trim();
  if (!s) return [];
  return s
    .split(/[;,]/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (["yes", "true", "1"].includes(s)) return true;
  if (["no", "false", "0"].includes(s)) return false;
  return false;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pickKey(obj: any, keys: string[]) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) return obj[k];
  }
  return undefined;
}

function pickAxis(src: any, which: 1 | 2 | 3) {
  const maps: Record<number, string[]> = {
    1: ["Topic Axis I", "Topic Axis I:", "TopicAxisI", "topicAxis1", "topicaxis1"],
    2: ["Topic Axis II", "Topic Axis II:", "TopicAxisII", "topicAxis2", "topicaxis2"],
    3: ["Topic Axis III", "Topic Axis III:", "TopicAxisIII", "topicAxis3", "topicaxis3"],
  };
  let v = pickKey(src, maps[which]);
  if (Array.isArray(v)) v = v[0] ?? null;
  return v ?? null;
}

function normalizeAxis(v: any) {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) v = v[0] ?? null;
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return { MainTopic: null, SubTopic: asString(v) };
  if (typeof v === "object") {
    const main = asString(pickKey(v, ["MainTopic", "Main Topic", "mainTopic", "main_topic"]));
    const sub = asString(pickKey(v, ["SubTopic", "Sub Topic", "subTopic", "sub_topic"]));
    if (!main && !sub) return null;
    return { MainTopic: main ?? null, SubTopic: sub ?? null };
  }
  return null;
}

const ROOT = path.resolve(__dirname, "../../");
const DATA_DIR = path.join(ROOT, "main");
const FILES = ["ICLR_metadata.json", "ICML_metadata.json", "KDD_metadata.json", "NeurIPS_metadata.json"];

function upsertOne(item: any) {
  const authors = asArray(item.authors ?? []);
  const datasetNames = asArray(item.dataset_name ?? item.datasetNames ?? []);
  const datasetLinks = asArray(item.dataset_link ?? item.datasetLinks ?? []);
  const codeLinkRaw = asString(item.code_link ?? item.codeLink ?? item.code);
  const codeLink = codeLinkRaw ? codeLinkRaw.split(/[;,]/)[0].trim() : null;
  const isPublic =
    typeof item.is_public === "boolean"
      ? item.is_public
      : typeof item.code_public === "boolean"
      ? item.code_public
      : toBool(item.is_public ?? item.code_public ?? item.public ?? null) || Boolean(codeLink);

  const base = {
    year: Number(item.year),
    conference: String(item.conference),
    title: String(item.title),
    abstract: asString(item.abstract),
    keywords: asString(item.keywords),
    pdfUrl: asString(item.pdf_url ?? item.pdfUrl),
    isHealthcare: toBool(item.is_healthcare ?? item.isHealthcare),
    topic: item.topic ?? null,
    method: item.method ?? null,
    application: item.application ?? null,
    codeLink,
    affiliations: asString(item.affiliations ?? item.institutes),
    authorsAffiliations: asString(item["authors/affiliations"] ?? item["authors/institutes"]),
    reasoning: item.reasoning ?? null,
    isPublic,
    topicAxis1: normalizeAxis(pickAxis(item, 1)),
    topicAxis2: normalizeAxis(pickAxis(item, 2)),
    topicAxis3: normalizeAxis(pickAxis(item, 3)),
  };

  return prisma.paper.upsert({
    where: { id: String(item.id) },
    update: {
      ...base,
      datasetNames: { set: datasetNames },
      datasetLinks: { set: datasetLinks },
      authors: { set: authors },
    },
    create: {
      id: String(item.id),
      ...base,
      datasetNames,
      datasetLinks,
      authors,
    },
  });
}

async function seedFile(fileName: string) {
  const full = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(full)) throw new Error(`Missing file: ${full}`);
  const raw = JSON.parse(fs.readFileSync(full, "utf-8")) as any[];
  const batches = chunk(raw, 200);
  let processed = 0;
  for (const b of batches) {
    await prisma.$transaction(b.map((it) => upsertOne(it)));
    processed += b.length;
    console.log(`Upserted ${processed}/${raw.length} from ${fileName}`);
  }
  console.log(`Seeded from ${fileName}: ${raw.length} items`);
}

async function main() {
  const hasAny = FILES.some((f) => fs.existsSync(path.join(DATA_DIR, f)));
  if (!hasAny) throw new Error(`No metadata files found under ${DATA_DIR}`);
  for (const f of FILES) {
    const p = path.join(DATA_DIR, f);
    if (fs.existsSync(p)) await seedFile(f);
  }
}

main()
  .then(async () => {
    console.log("Seed completed");
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
