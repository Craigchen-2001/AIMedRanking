import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import { fetchPaperById, type PaperDetail } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function PaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let p: PaperDetail | null = null;
  try {
    p = await fetchPaperById(id);
  } catch {
    try {
      const site =
        process.env.SITE_ORIGIN ||
        process.env.NEXT_PUBLIC_SITE_ORIGIN ||
        `http://localhost:${process.env.PORT || '3000'}`;
      const r = await fetch(`${site}/api/papers/${encodeURIComponent(id)}`, {
        cache: 'no-store',
      });
      if (r.ok) p = (await r.json()) as PaperDetail;
    } catch {}
  }

  if (!p) notFound();

  const authors = Array.isArray(p.authors) ? p.authors : [];
  const datasetNames = Array.isArray(p.datasetNames) ? p.datasetNames : [];
  const datasetLinks = Array.isArray(p.datasetLinks) ? p.datasetLinks : [];
  const keywords = Array.isArray((p as any).keywords)
    ? ((p as any).keywords as string[]).filter(Boolean)
    : typeof (p as any).keywords === 'string'
    ? ((p as any).keywords as string)
        .split(/[;,]/)
        .map(s => s.trim())
        .filter(Boolean)
    : [];

  function nk(s: string) {
    return String(s || '').toLowerCase().replace(/[\s_:-]/g, '');
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
  function normalizeAxis(v: any) {
    if (!v) return { main: null, sub: null };
    if (Array.isArray(v)) v = v[0] ?? null;
    if (typeof v === 'string') {
      try {
        const o = JSON.parse(v);
        if (o && typeof o === 'object') return normalizeAxis(o);
      } catch {}
      return { main: v || null, sub: null };
    }
    if (typeof v === 'object') {
      const mk = findKey(v, ['MainTopic', 'Main Topic', 'mainTopic', 'main']);
      const sk = findKey(v, ['SubTopic', 'Sub Topic', 'subTopic', 'sub']);
      const main = mk ? v[mk] : null;
      const sub = sk ? v[sk] : null;
      return { main: main === '' ? null : main, sub: sub === '' ? null : sub };
    }
    return { main: null, sub: null };
  }
  const ax1 = normalizeAxis((p as any).topicAxis1 ?? (p as any)['Topic Axis I']);
  const ax2 = normalizeAxis((p as any).topicAxis2 ?? (p as any)['Topic Axis II']);
  const ax3 = normalizeAxis((p as any).topicAxis3 ?? (p as any)['Topic Axis III']);
  const codeAvailable =
    typeof (p as any).isPublic === 'boolean'
      ? (p as any).isPublic
      : typeof p.codeLink === 'string' && /^https?:\/\//i.test(p.codeLink || '');

  function stripReasoningPrefix(s: string) {
    return s.replace(/^\s*(\*\*reasoning\*\*|reasoning)\s*[:：-]?\s*/i, '');
  }
  const reasoningClean = stripReasoningPrefix(String(p.reasoning || ''));

  return (
    <div className="relative min-h-screen w-full">
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-rose-50 via-amber-50 to-white" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_70%_-50%,rgba(244,63,94,0.08),transparent_60%)]" />
      <div className="mx-auto px-4 py-8 max-w-5xl md:max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
              {p.title}
            </h1>
            <div className="mt-3 text-sm text-gray-600">
              <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 px-2 py-0.5 border border-red-100 mr-2">
                {p.conference}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
                {p.year}
              </span>
            </div>
          </div>
          {p.pdf_url ? (
            <a
              href={p.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-red-600 text-white px-3 py-2 hover:bg-red-700"
              title="View PDF"
            >
              <FileText size={18} />
              PDF
            </a>
          ) : null}
        </div>

        <div className="text-xl text-gray-800 italic">
          {authors.length ? authors.join(', ') : 'Unknown author'}
        </div>

        {keywords.length ? (
          <section className="mt-6">
            <div className="text-red-900 font-bold text-xl">Keywords</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {keywords.map((kw, i) => (
                <span
                  key={`${kw}-${i}`}
                  className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-1 text-base font-medium text-red-700"
                >
                  {kw}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-6 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-red-900">Abstract</h2>
            <p className="text-base mt-2 text-gray-800 leading-relaxed whitespace-pre-line text-justify">
              {p.abstract || 'No abstract available.'}
            </p>
          </section>

          <section className="space-y-4">
            <div>
              <div className="text-xl text-red-900 font-semibold">Topic</div>
              <div className="text-lg mt-1 font-medium text-gray-800">{p.topic || '-'}</div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative rounded-xl border border-rose-200 bg-rose-50 shadow-sm pl-4">
                  <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-rose-400" />
                  <div className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-600">Topic Axis I</div>
                    <div className="mt-1 text-gray-900"><span className="font-semibold">Main:</span> {ax1.main || '-'}</div>
                    <div className="text-gray-900"><span className="font-semibold">Sub:</span> {ax1.sub || '-'}</div>
                  </div>
                </div>
                <div className="relative rounded-xl border border-amber-200 bg-amber-50 shadow-sm pl-4">
                  <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-amber-400" />
                  <div className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-600">Topic Axis II</div>
                    <div className="mt-1 text-gray-900"><span className="font-semibold">Main:</span> {ax2.main || '-'}</div>
                    <div className="text-gray-900"><span className="font-semibold">Sub:</span> {ax2.sub || '-'}</div>
                  </div>
                </div>
                <div className="relative rounded-xl border border-sky-200 bg-sky-50 shadow-sm pl-4">
                  <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-sky-400" />
                  <div className="px-3 py-3">
                    <div className="text-sm font-semibold text-gray-600">Topic Axis III</div>
                    <div className="mt-1 text-gray-900"><span className="font-semibold">Main:</span> {ax3.main || '-'}</div>
                    <div className="text-gray-900"><span className="font-semibold">Sub:</span> {ax3.sub || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xl text-red-900 font-semibold">Method</div>
              <div className="text-lg mt-1 font-medium text-gray-800">{p.method || '-'}</div>
            </div>
            <div>
              <div className="text-xl text-red-900 font-semibold">Application</div>
              <div className="text-lg mt-1 font-medium text-gray-800">{p.application || '-'}</div>
            </div>
          </section>

          <section>
            <div className="text-xl text-red-900 font-semibold">Code</div>
            <div className="mt-1">
              {p.codeLink ? (
                <Link
                  href={p.codeLink}
                  target="_blank"
                  className="text-blue-700 hover:underline break-all"
                >
                  {p.codeLink}
                </Link>
              ) : (
                <div className="text-gray-800">-</div>
              )}
            </div>
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
                  codeAvailable
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                {codeAvailable ? 'Public' : 'Private'}
              </span>
            </div>
          </section>

          <section>
            <div className="text-xl text-red-900 font-semibold">Datasets</div>
            <div className="mt-1">
              {datasetNames.length ? (
                <ul className="list-disc pl-5 space-y-1">
                  {datasetNames.map((name, i) => {
                    const link = datasetLinks[i] ?? null;
                    return (
                      <li key={`${name}-${i}`}>
                        {link ? (
                          <a
                            className="text-blue-700 text-lg hover:underline break-all"
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {name}
                          </a>
                        ) : (
                          <span className="text-lg text-gray-900">{name}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="text-gray-800">-</div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-red-900">Reasoning</h2>
            <p className="text-base mt-2 text-gray-800 leading-relaxed whitespace-pre-line text-justify">
              {reasoningClean || '-'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

