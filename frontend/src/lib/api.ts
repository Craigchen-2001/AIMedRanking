export type AxisJson = { MainTopic?: string | null; SubTopic?: string | null } | string | null

export type ApiPaper = {
  id: string
  title: string
  abstract: string | null
  keywords: string | null
  pdf_url: string | null
  conference: string
  year: number
  isHealthcare: boolean
  topic: string | null
  method: string | null
  application: string | null
  codeLink: string | null
  authors: string[] | null
  datasetNames?: string[] | null
  datasetLinks?: string[] | null
  topicAxis1?: AxisJson
  topicAxis2?: AxisJson
  topicAxis3?: AxisJson
}

export type ApiListResponse = {
  pageNum: number
  pageSize: number
  total: number
  totalPages: number
  items: ApiPaper[]
}

export type PapersQuery = {
  q?: string
  conference?: string[]
  year?: (number | string)[]
  page?: number
  pageSize?: number
  sort?: 'newest' | 'oldest' | 'title'
  authors?: string[]
}

export type MockPaperShape = {
  id: string
  title: string
  authors: string[]
  conference: string
  year: number
  pdf_url: string
  code_link: string
  dataset_name: string[] | string
  method: string
  application: string
  'Topic Axis I': { MainTopic: string; SubTopic: string }
  'Topic Axis II': { MainTopic: string; SubTopic: string }
  'Topic Axis III': { MainTopic: string; SubTopic: string }
  abstract?: string | null
  keywords?: string | null
}

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/[\s_:-]/g, '')
}

function findKey(obj: any, targets: string[]) {
  if (!obj) return null
  const map = Object.keys(obj).reduce<Record<string, string>>((m, k) => {
    m[norm(k)] = k
    return m
  }, {})
  for (const t of targets) {
    const hit = map[norm(t)]
    if (hit) return hit
  }
  return null
}

function readAxis(v: any) {
  if (!v) return { MainTopic: '', SubTopic: '' }
  if (Array.isArray(v)) v = v[0] ?? null
  if (typeof v === 'string') {
    try {
      const o = JSON.parse(v)
      if (o && typeof o === 'object') return readAxis(o)
    } catch {}
    return { MainTopic: v || '', SubTopic: '' }
  }
  if (typeof v === 'object') {
    const mKey = findKey(v, ['MainTopic', 'Main Topic', 'mainTopic', 'main_topic', 'main'])
    const sKey = findKey(v, ['SubTopic', 'Sub Topic', 'subTopic', 'sub_topic', 'sub'])
    const m = mKey ? v[mKey] : ''
    const s = sKey ? v[sKey] : ''
    return { MainTopic: m || '', SubTopic: s || '' }
  }
  return { MainTopic: '', SubTopic: '' }
}

function mapApiToMock(p: ApiPaper): MockPaperShape {
  const a1 = readAxis((p as any).topicAxis1 ?? (p as any)['Topic Axis I'])
  const a2 = readAxis((p as any).topicAxis2 ?? (p as any)['Topic Axis II'])
  const a3 = readAxis((p as any).topicAxis3 ?? (p as any)['Topic Axis III'])
  return {
    id: p.id,
    title: p.title,
    authors: Array.isArray(p.authors) ? p.authors : [],
    conference: p.conference,
    year: p.year,
    pdf_url: p.pdf_url ?? '',
    code_link: p.codeLink ?? '',
    dataset_name: Array.isArray(p.datasetNames) ? p.datasetNames : [],
    method: p.method ?? '',
    application: p.application ?? '',
    'Topic Axis I': a1,
    'Topic Axis II': a2,
    'Topic Axis III': a3,
    abstract: p.abstract,
    keywords: p.keywords,
  }
}

export async function fetchPapers(params: PapersQuery = {}) {
  const base = process.env.NEXT_PUBLIC_API_BASE || ''
  const sp = new URLSearchParams()
  if (params.q) sp.set('q', params.q)
  if (params.conference?.length) sp.set('confs', params.conference.join(','))
  if (params.year?.length) sp.set('years', params.year.map(String).join(','))
  if (params.page) sp.set('page', String(params.page))
  if (params.pageSize) sp.set('take', String(params.pageSize))
  if (params.sort) sp.set('sort', params.sort)
  if (params.authors?.length) sp.set('authors', params.authors.join(','))
  const query = sp.toString()
  const url = base ? `${base}/api/papers?${query}` : `/api/papers?${query}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch papers: ${res.status}`)
  const data = (await res.json()) as ApiListResponse
  return {
    page: data.pageNum,
    pageSize: data.pageSize,
    total: data.total,
    totalPages: data.totalPages,
    items: data.items.map(mapApiToMock),
  }
}

export type PaperDetail = ApiPaper & {
  affiliations?: string | null
  authorsAffiliations?: string | null
  reasoning?: string | null
  updatedAt?: string | null
}

const isServer = () => typeof window === 'undefined'

function siteOriginForServer(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_ORIGIN ||
    `http://localhost:${process.env.PORT || '3000'}`
  )
}

function backendOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_API_TARGET ||
    process.env.BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND ||
    'http://localhost:3001'
  )
}

export async function fetchPaperById(id: string): Promise<PaperDetail> {
  const enc = encodeURIComponent(id)
  const url = isServer() ? `${siteOriginForServer()}/api/papers/${enc}` : `/api/papers/${enc}`
  let res = await fetch(url, { cache: 'no-store' })
  if (!res.ok && isServer()) {
    const origin = backendOrigin()
    res = await fetch(`${origin}/papers/${enc}`, { cache: 'no-store' })
    if (!res.ok) {
      res = await fetch(`${origin}/api/papers/${enc}`, { cache: 'no-store' })
    }
  }
  if (!res.ok) throw new Error(`Failed to fetch paper ${id}: ${res.status}`)
  return res.json()
}
