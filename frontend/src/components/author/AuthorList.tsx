"use client";

import { useEffect, useMemo, useState } from "react";

type PaperItem = { conference: string; authors: string[] };

const ALLOWED = ["ICLR", "ICML", "KDD", "NEURIPS"] as const;

function tagConference(full: string): (typeof ALLOWED)[number] | null {
  const t = (full || "").split(" ")[0].toUpperCase();
  if (t === "NEURIPS") return "NEURIPS";
  if (t === "ICLR") return "ICLR";
  if (t === "ICML") return "ICML";
  if (t === "KDD") return "KDD";
  return null;
}

async function fetchAllPapers(): Promise<PaperItem[]> {
  const take = 100;
  let page = 1;
  let totalPages = 1;
  const out: PaperItem[] = [];
  while (page <= totalPages) {
    const res = await fetch(`/api/papers?page=${page}&take=${take}`, { cache: "no-store" });
    if (!res.ok) break;
    const data = await res.json();
    totalPages = data.totalPages ?? 1;
    const items = (data.items ?? []) as any[];
    for (const p of items) out.push({ conference: p.conference, authors: p.authors ?? [] });
    page += 1;
    if (page > 50) break;
  }
  return out;
}

export default function AuthorList() {
  const [rows, setRows] = useState<PaperItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const items = await fetchAllPapers();
      if (alive) setRows(items);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const allAuthors = useMemo(() => {
    const countMap: Record<string, number> = {};
    for (const p of rows) {
      const tag = tagConference(p.conference);
      if (!tag || !ALLOWED.includes(tag)) continue;
      for (const a of p.authors || []) countMap[a] = (countMap[a] || 0) + 1;
    }
    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const filteredAuthors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allAuthors;
    return allAuthors.filter((x) => x.name.toLowerCase().includes(q));
  }, [allAuthors, searchTerm]);

  const searchedAuthor = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return null;
    return allAuthors.find((x) => x.name.toLowerCase() === q) || null;
  }, [allAuthors, searchTerm]);

  return (
    <div className="w-full h-full px-4 py-2">
      <div className="w-full flex justify-start mb-3">
        <input
          type="text"
          placeholder="Search author name..."
          className="px-3 py-1 rounded border border-gray-300 w-52 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={() => setSearchTerm("")} className="ml-2 text-sm text-red-700 underline">
          Clear
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-gray-500">Loading…</div>
      ) : (
        <>
          {searchedAuthor && (
            <div className="my-2 text-sm font-medium text-gray-900">
              <p>
                <span className="font-semibold">{searchedAuthor.name}</span> has{" "}
                <span className="text-blue-600">{searchedAuthor.count}</span> paper(s), ranked #
                {allAuthors.findIndex((a) => a.name === searchedAuthor.name) + 1}
              </p>
            </div>
          )}

          <div className="w-full h-[calc(100%-120px)] overflow-y-scroll border border-gray-300 rounded">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Author</th>
                  <th className="px-3 py-2">Count</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthors.map((author, index) => (
                  <tr key={author.name} className="border-t">
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2 font-medium text-base">{author.name}</td>
                    <td className="px-3 py-2">{author.count}</td>
                  </tr>
                ))}
                {filteredAuthors.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-gray-400 italic">
                      No matching authors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
