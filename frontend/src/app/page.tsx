"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/layout/Header';
import SidebarFilters from '@/components/layout/SidebarFilters';
import ExpandedCard from '@/components/ui/ExpandedCard';
import { FileText, Sparkles, X, Heart } from 'lucide-react';
import { fetchPapers, type MockPaperShape } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

const ALLOWED_CONFS = ['ICLR', 'ICML', 'KDD', 'NEURIPS'] as const;
type ConfKey = (typeof ALLOWED_CONFS)[number];
const PAGE_SIZE = 20;

function tagConference(full: string): ConfKey | null {
  const u = (full || '').trim().toUpperCase();
  if (!u) return null;
  if (u.startsWith('NEURIPS') || u.includes('NEURAL INFORMATION PROCESSING')) return 'NEURIPS';
  if (u.startsWith('ICLR') || u.includes('INTERNATIONAL CONFERENCE ON LEARNING REPRESENTATIONS')) return 'ICLR';
  if (u.startsWith('ICML') || u.includes('INTERNATIONAL CONFERENCE ON MACHINE LEARNING')) return 'ICML';
  if (u.startsWith('KDD') || u.includes('SIGKDD') || u.includes('KNOWLEDGE DISCOVERY')) return 'KDD';
  return null;
}

function dedupeById(list: MockPaperShape[]) {
  const seen = new Set<string>();
  const out: MockPaperShape[] = [];
  for (const p of list) {
    const norm = tagConference(p.conference) ?? (p.conference as any) ?? '';
    const k = p.id || `${p.title}::${p.year}::${norm}::${(p as any).pdf_url || ''}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push(p);
    }
  }
  return out;
}

function WelcomeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative z-30">
      <div className="rounded-2xl p-[2px] ring-1 ring-black/90 bg-[linear-gradient(135deg,#000,#000)]">
        <div className="relative rounded-xl bg-white overflow-hidden">
          <div className="flex items-start gap-4 p-6">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shadow">
              <Sparkles size={22} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold tracking-tight text-gray-900">Welcome to Home Page</h2>
              <p className="mt-2 text-base text-gray-700 leading-relaxed">
                You’re viewing the full library. Use the filters on the left to narrow by conference, year, or author. Click a title to expand details.
              </p>
            </div>
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="shrink-0 mt-1 rounded-lg border border-black/10 p-1 hover:bg-black/5 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundArt() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(1100px_620px_at_86%_8%,rgba(0,0,0,0.08),transparent_70%)]" />
      <div className="absolute right-0 top-24 bottom-0 w-[60%] opacity-[0.14] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_left,black,transparent)]" />
    </div>
  );
}

function norm(s: string) {
  return String(s || '').toLowerCase().replace(/[\s_:-]/g, '');
}

function codeIsPublic(p: any) {
  let v: any = null;
  if (p && typeof p.code === 'object' && p.code) {
    const obj = p.code as any;
    v = obj.available ?? obj.is_public ?? obj.public ?? obj.open ?? obj.open_source ?? null;
  }
  if (v == null) {
    v = p?.code_public ?? p?.codeAvailable ?? p?.code_available ?? null;
  }
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = norm(v);
    if (['true','yes','y','1','open','public','available'].includes(s)) return true;
    if (['false','no','n','0','private','unavailable'].includes(s)) return false;
  }
  if (typeof p?.code === 'string' && /^https?:\/\//i.test(p.code)) return true;
  if (typeof p?.code_link === 'string' && /^https?:\/\//i.test(p.code_link)) return true;
  return false;
}

function parseAxis(a: any) {
  if (!a) return { main: null, sub: null };
  if (typeof a === 'string') {
    try { a = JSON.parse(a); } catch { return { main: null, sub: a }; }
  }
  const main = a?.MainTopic ?? a?.['Main Topic'] ?? a?.mainTopic ?? a?.main_topic ?? null;
  const sub = a?.SubTopic ?? a?.['Sub Topic'] ?? a?.subTopic ?? a?.sub_topic ?? (typeof a === 'string' ? a : null);
  return { main, sub };
}

function materializeAxis(a: any) {
  const { main, sub } = parseAxis(a);
  if (main == null && sub == null) return null;
  return { MainTopic: main, SubTopic: sub, ['Main Topic']: main, ['Sub Topic']: sub };
}

export default function HomePage() {
  const [selectedConfs, setSelectedConfs] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [pendingConfs, setPendingConfs] = useState<string[]>([]);
  const [pendingYears, setPendingYears] = useState<string[]>([]);
  const [pendingAuthors, setPendingAuthors] = useState<string[]>([]);
  const [pendingCodeAvail, setPendingCodeAvail] = useState<'any' | 'public' | 'private'>('any');
  const [codeAvail, setCodeAvail] = useState<'any' | 'public' | 'private'>('any');

  const [selectedTopicsI, setSelectedTopicsI] = useState<string[]>([]);
  const [pendingTopicsI, setPendingTopicsI] = useState<string[]>([]);
  const [selectedTopicsII, setSelectedTopicsII] = useState<string[]>([]);
  const [pendingTopicsII, setPendingTopicsII] = useState<string[]>([]);
  const [selectedTopicsIII, setSelectedTopicsIII] = useState<string[]>([]);
  const [pendingTopicsIII, setPendingTopicsIII] = useState<string[]>([]);

  const [pendingMatchMode, setPendingMatchMode] = useState<"any" | "all">("any");
  const [matchMode, setMatchMode] = useState<"any" | "all">("any");

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);
  const [allMatched, setAllMatched] = useState<MockPaperShape[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [primaryConf, setPrimaryConf] = useState<ConfKey | ''>('');
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const { addFavorite, removeFavorite, ensureAuth, favoriteIds } = useAuth();

  const resetSorting = () => {
    setSortOrder('desc')
    setPrimaryConf('')
    setCodeAvail('any')
    setPage(1)
  }
  

  const fetchingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setExpandedPaperId(null);
    setPage(1);

    const confsParam = selectedConfs.length ? selectedConfs : undefined;

    (async () => {
      const first = await fetchPapers({
        page: 1,
        pageSize: PAGE_SIZE,
        q: searchTerm || undefined,
        conference: confsParam,
        year: selectedYears,
      });
      if (cancelled) return;
      const totalPages = first.totalPages || 1;
      let acc: MockPaperShape[] = first.items || [];
      if (totalPages > 1) {
        const tasks: ReturnType<typeof fetchPapers>[] = [];
        for (let p = 2; p <= totalPages; p++) {
          tasks.push(
            fetchPapers({
              page: p,
              pageSize: PAGE_SIZE,
              q: searchTerm || undefined,
              conference: confsParam,
              year: selectedYears,
            })
          );
        }
        const results = await Promise.all(tasks);
        for (const r of results) acc = acc.concat(r.items || []);
      }
      const onlyAllowed = acc;
      const confFilter = selectedConfs.length
        ? onlyAllowed.filter((p) => {
            const tag = tagConference(p.conference);
            return tag ? selectedConfs.map((c) => c.toUpperCase()).includes(tag) : false;
          })
        : onlyAllowed;

      setAllMatched(dedupeById(confFilter));
      setLoading(false);
      fetchingRef.current = false;
    })().catch(() => {
      if (!cancelled) {
        setAllMatched([]);
        setLoading(false);
        fetchingRef.current = false;
      }
    });
    return () => {
      cancelled = true;
      fetchingRef.current = false;
    };
  }, [searchTerm, selectedConfs, selectedYears]);

  useEffect(() => {
    setPage(1);
    setExpandedPaperId(null);
  }, [selectedAuthors, sortOrder, primaryConf, codeAvail, selectedTopicsI, selectedTopicsII, selectedTopicsIII, matchMode]);

  const finalFiltered = useMemo(() => {
    let base = !selectedAuthors.length
      ? allMatched
      : allMatched.filter((p) => {
          if (!Array.isArray(p.authors) || p.authors.length === 0) return false;
          return selectedAuthors.some((a) => p.authors.includes(a));
        });
    if (codeAvail !== 'any') {
      const wantPublic = codeAvail === 'public';
      base = base.filter((p) => codeIsPublic(p) === wantPublic);
    }
    if (selectedTopicsI.length || selectedTopicsII.length || selectedTopicsIII.length) {
      base = base.filter((p) => {
        const axesRaw = [
          materializeAxis((p as any).topicAxis1 ?? (p as any)['Topic Axis I']),
          materializeAxis((p as any).topicAxis2 ?? (p as any)['Topic Axis II']),
          materializeAxis((p as any).topicAxis3 ?? (p as any)['Topic Axis III']),
        ];
        const axes = axesRaw.filter((x): x is {
          MainTopic: string | null;
          SubTopic: string | null;
          "Main Topic": string | null;
          "Sub Topic": string | null;
        } => x != null);
        const paperTopics = axes
          .flatMap((a) => [a.MainTopic, a.SubTopic])
          .filter((v): v is string => typeof v === "string" && v.length > 0);

        const selectedAll = [...selectedTopicsI, ...selectedTopicsII, ...selectedTopicsIII];

        if (matchMode === "any") {
          return selectedAll.some((sel) => paperTopics.includes(sel));
        } else {
          return selectedAll.every((sel) => paperTopics.includes(sel));
        }
      });
    }    
    return base;
  }, [allMatched, selectedAuthors, codeAvail, selectedTopicsI, selectedTopicsII, selectedTopicsIII, matchMode]);

  const sortedList = useMemo(() => {
    const arr = [...finalFiltered];
    arr.sort((a, b) => {
      if (primaryConf) {
        const at = tagConference(a.conference);
        const bt = tagConference(b.conference);
        const aPri = at === primaryConf ? 0 : 1;
        const bPri = bt === primaryConf ? 0 : 1;
        if (aPri !== bPri) return aPri - bPri;
      }
      const ay = Number(a.year) || 0;
      const by = Number(b.year) || 0;
      return sortOrder === 'desc' ? by - ay : ay - by;
    });
    return arr;
  }, [finalFiltered, sortOrder, primaryConf]);

  const totalPagesUI = Math.max(1, Math.ceil((sortedList.length || 0) / PAGE_SIZE));
  const pagedList = useMemo(
    () => sortedList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sortedList, page]
  );

  const applyFilters = () => {
    setSelectedConfs(pendingConfs);
    setSelectedYears(pendingYears);
    setSelectedAuthors(pendingAuthors);
    setCodeAvail(pendingCodeAvail);
    setSelectedTopicsI(pendingTopicsI);
    setSelectedTopicsII(pendingTopicsII);
    setSelectedTopicsIII(pendingTopicsIII);
    setMatchMode(pendingMatchMode);
    setPage(1);
    setExpandedPaperId(null);
  };

  const clearFilters = () => {
    setPendingConfs([]);
    setPendingYears([]);
    setPendingAuthors([]);
    setPendingCodeAvail('any');
    setSelectedConfs([]);
    setSelectedYears([]);
    setSelectedAuthors([]);
    setSearchTerm('');
    setPage(1);
    setExpandedPaperId(null);
    setPrimaryConf('');
    setBannerDismissed(false);
    setCodeAvail('any');
    setPendingTopicsI([]);
    setPendingTopicsII([]);
    setPendingTopicsIII([]);
    setSelectedTopicsI([]);
    setSelectedTopicsII([]);
    setSelectedTopicsIII([]);
    setMatchMode('any');
    setPendingMatchMode('any');
  };

  const isHome =
    selectedConfs.length === 0 &&
    selectedYears.length === 0 &&
    selectedAuthors.length === 0 &&
    !searchTerm &&
    codeAvail === 'any' &&
    selectedTopicsI.length === 0 &&
    selectedTopicsII.length === 0 &&
    selectedTopicsIII.length === 0;

  const allTitles = useMemo(() => pagedList.map((p) => p.title), [pagedList]);

  return (
    <div className="min-h-screen">
      <Header
        suggestions={allTitles}
        onSearch={(term) => setSearchTerm(term)}
        onConferenceSelect={(conf) => setSelectedConfs([conf])}
        onYearSelect={(year) => setSelectedYears([year])}
      />

      <div className="flex pt-4">
        <SidebarFilters
          selectedConfs={pendingConfs}
          setSelectedConfs={setPendingConfs}
          selectedYears={pendingYears}
          setSelectedYears={setPendingYears}
          selectedAuthors={pendingAuthors}
          setSelectedAuthors={setPendingAuthors}
          codeAvail={pendingCodeAvail}
          setCodeAvail={setPendingCodeAvail}
          selectedTopicsI={pendingTopicsI}
          setSelectedTopicsI={setPendingTopicsI}
          selectedTopicsII={pendingTopicsII}
          setSelectedTopicsII={setPendingTopicsII}
          selectedTopicsIII={pendingTopicsIII}
          setSelectedTopicsIII={setPendingTopicsIII}
          matchMode={pendingMatchMode}
          setMatchMode={setPendingMatchMode}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
        />

        <main className="relative flex-1 ml-60 md:ml-64 lg:ml-72 xl:ml-80 px-1">
          <div className="relative z-0">
            <BackgroundArt />
            <div className="relative z-10 w-full max-w-5xl">
              {isHome && !bannerDismissed && (
                <div className="mb-4">
                  <WelcomeBanner onDismiss={() => setBannerDismissed(true)} />
                </div>
              )}

              {loading ? (
                <div className="text-gray-600">Loading...</div>
              ) : (
                <>
                  <div className="mb-6 pb-4 border-b border-red-100 bg-white sticky top-16 z-10 rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm text-gray-700">
                        Showing <span className="font-semibold">{pagedList.length}</span> of{' '}
                        <span className="font-semibold">{sortedList.length}</span> papers
                        {selectedConfs.length > 0 && (
                          <> from <span className="font-semibold">{selectedConfs.join(', ')}</span></>
                        )}
                        {selectedYears.length > 0 && (
                          <> in <span className="font-semibold">{selectedYears.join(', ')}</span></>
                        )}
                        {selectedAuthors.length > 0 && (
                          <> by <span className="font-semibold">{selectedAuthors.join(', ')}</span></>
                        )}
                        {searchTerm && <> for "<span className="italic">{searchTerm}</span>"</>}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={page <= 1}
                          onClick={() => setPage((x) => Math.max(1, x - 1))}
                          className="px-3 py-1 rounded-lg border border-red-200 text-red-700 disabled:opacity-50 hover:bg-red-50"
                        >
                          Prev
                        </button>
                        <button
                          disabled={page >= totalPagesUI}
                          onClick={() => setPage((x) => Math.min(totalPagesUI, x + 1))}
                          className="px-3 py-1 rounded-lg border border-red-200 text-red-700 disabled:opacity-50 hover:bg-red-50"
                        >
                          Next
                        </button>

                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                          className="px-3 py-1 text-sm rounded-lg border border-black bg-black text-white focus:outline-none focus:ring-2 focus:ring-black"
                        >
                          <option value="desc">Newest</option>
                          <option value="asc">Oldest</option>
                        </select>

                        <select
                          value={primaryConf}
                          onChange={(e) => setPrimaryConf(e.target.value as ConfKey | '')}
                          className="px-3 py-1 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black"
                          title="Pick a conference to appear first"
                        >
                          <option value="">Start with: Any conf</option>
                          <option value="ICLR">Start with: ICLR</option>
                          <option value="ICML">Start with: ICML</option>
                          <option value="KDD">Start with: KDD</option>
                          <option value="NEURIPS">Start with: NeurIPS</option>
                        </select>

                        <select
                          value={codeAvail}
                          onChange={(e) => setCodeAvail(e.target.value as 'any' | 'public' | 'private')}
                          className="px-3 py-1 text-sm rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-black"
                          title="Filter by code availability"
                        >
                          <option value="any">Code: Any</option>
                          <option value="public">Code: Public</option>
                          <option value="private">Code: Private</option>
                        </select>

                        {/* <button
                          className="px-3 py-1 text-sm text-white rounded-lg bg-red-600 hover:bg-red-700"
                          onClick={clearFilters}
                        >
                          Reset Filter
                        </button> */}
                        <button
                          className="px-3 py-1 text-sm text-white rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          onClick={resetSorting}
                          disabled={sortOrder === 'desc' && !primaryConf && codeAvail === 'any'}
                        >
                          Reset Sorting
                        </button>

                      </div>
                    </div>
                  </div>
                  <div className="h-6">
                        
                  </div>        
                  <section id="papers">
                    {pagedList.map((paper, idx) => {
                      const p = {
                        ...paper,
                        topicAxis1: materializeAxis((paper as any).topicAxis1 ?? (paper as any)['Topic Axis I']),
                        topicAxis2: materializeAxis((paper as any).topicAxis2 ?? (paper as any)['Topic Axis II']),
                        topicAxis3: materializeAxis((paper as any).topicAxis3 ?? (paper as any)['Topic Axis III']),
                      } as any;
                      const isFav = favoriteIds.has(p.id);
                      return (
                        <div
                          key={`${p.id}-${idx}`}
                          className="mb-4 rounded-2xl border border-red-100 bg-white p-4 shadow-sm hover:shadow transition"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <Link href={`/paper/${p.id}`} prefetch={false} className="group">
                                <h3 className="text-blue-700 text-lg font-semibold mt-1 group-hover:underline">
                                  {p.title}
                                </h3>
                              </Link>
                              <div className="mt-1 text-sm text-gray-700 italic">
                                {p.authors && p.authors.length ? p.authors.join(', ') : 'Unknown author'}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                                <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 px-2 py-0.5 border border-red-100">
                                  {p.conference}
                                </span>
                                <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">
                                  {p.year}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {(p as any).pdf_url && (
                                <a
                                  href={(p as any).pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-600 text-white hover:bg-red-700"
                                  title="View PDF"
                                >
                                  <FileText size={18} />
                                </a>
                              )}
                              <button
                                onClick={async () => {
                                  if (!ensureAuth()) return;
                                  if (isFav) {
                                    await removeFavorite(p.id);
                                  } else {
                                    await addFavorite(p.id);
                                  }
                                }}
                                className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-red-50`}
                                title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                              >
                                <Heart
                                  size={18}
                                  className={isFav ? "text-red-600" : ""}
                                  fill={isFav ? "currentColor" : "none"}
                                />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2">
                            <button
                              className="text-red-700 text-sm hover:underline"
                              onClick={() =>
                                setExpandedPaperId(expandedPaperId === p.id ? null : p.id)
                              }
                            >
                              {expandedPaperId === p.id ? 'Hide details' : 'Show details'}
                            </button>
                          </div>

                          {expandedPaperId === p.id && (
                            <div className="mt-3">
                              <ExpandedCard paper={p} onClose={() => setExpandedPaperId(null)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </section>

                  <div className="flex items-center justify-center gap-3 pt-6">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((x) => Math.max(1, x - 1))}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-700 disabled:opacity-50 hover:bg-red-50"
                    >
                      Prev
                    </button>
                    <div className="text-sm text-gray-700">
                      Page {Math.min(page, totalPagesUI)} / {totalPagesUI}
                    </div>
                    <button
                      disabled={page >= totalPagesUI}
                      onClick={() => setPage((x) => Math.min(totalPagesUI, x + 1))}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-700 disabled:opacity-50 hover:bg-red-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
