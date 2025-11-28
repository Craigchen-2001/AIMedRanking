// // /Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/frontend/src/components/author/AuthorList.tsx

// "use client";

// import { useEffect, useMemo, useState } from "react";

// type PaperItem = { conference: string; authors: string[] };

// const ALLOWED = ["ICLR", "ICML", "KDD", "NEURIPS","ACL"] as const;

// function tagConference(full: string): (typeof ALLOWED)[number] | null {
//   const t = (full || "").split(" ")[0].toUpperCase();
//   if (t === "NEURIPS") return "NEURIPS";
//   if (t === "ICLR") return "ICLR";
//   if (t === "ICML") return "ICML";
//   if (t === "KDD") return "KDD";
//   if (t === "ACL") return "ACL"; 
//   return null;
// }

// async function fetchAllPapers(): Promise<PaperItem[]> {
//   const take = 100;
//   let page = 1;
//   let totalPages = 1;
//   const out: PaperItem[] = [];
//   while (page <= totalPages) {
//     const res = await fetch(`/api/papers?page=${page}&take=${take}`, { cache: "no-store" });
//     if (!res.ok) break;
//     const data = await res.json();
//     totalPages = data.totalPages ?? 1;
//     const items = (data.items ?? []) as any[];
//     for (const p of items) out.push({ conference: p.conference, authors: p.authors ?? [] });
//     page += 1;
//     if (page > 50) break;
//   }
//   return out;
// }

// export default function AuthorList() {
//   const [rows, setRows] = useState<PaperItem[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       setLoading(true);
//       const items = await fetchAllPapers();
//       if (alive) setRows(items);
//       setLoading(false);
//     })();
//     return () => {
//       alive = false;
//     };
//   }, []);

//   const allAuthors = useMemo(() => {
//     const countMap: Record<string, number> = {};
//     for (const p of rows) {
//       const tag = tagConference(p.conference);
//       if (!tag || !ALLOWED.includes(tag)) continue;
//       for (const a of p.authors || []) countMap[a] = (countMap[a] || 0) + 1;
//     }
//     return Object.entries(countMap)
//       .map(([name, count]) => ({ name, count }))
//       .sort((a, b) => b.count - a.count)
//       .map((x, i) => ({ ...x, rank: i + 1 }));
//   }, [rows]);

//   const filteredAuthors = useMemo(() => {
//     const q = searchTerm.trim().toLowerCase();
//     if (!q) return allAuthors;
//     return allAuthors.filter((x) => x.name.toLowerCase().includes(q));
//   }, [allAuthors, searchTerm]);

//   const searchedAuthor = useMemo(() => {
//     const q = searchTerm.trim().toLowerCase();
//     if (!q) return null;
//     return allAuthors.find((x) => x.name.toLowerCase() === q) || null;
//   }, [allAuthors, searchTerm]);

//   const topColors = [
//     "bg-yellow-400",
//     "bg-gray-400",
//     "bg-orange-500",
//     "bg-blue-400",
//     "bg-green-400",
//     "bg-purple-400",
//     "bg-pink-400",
//     "bg-indigo-400",
//     "bg-teal-400",
//     "bg-red-400",
//   ];

//   return (
//     <div className="w-full h-full px-4 py-3">
//       <h3 className="text-lg font-bold text-red-700 mb-4">Author Ranking Table</h3>
//       <div className="flex items-center gap-3 mb-4">
//         <input
//           type="text"
//           inputMode="search"
//           lang="en"
//           autoCapitalize="none"
//           autoCorrect="off"
//           spellCheck={false}
//           placeholder="Search author name..."
//           className="px-4 py-2 rounded-lg border border-gray-300 w-full max-w-sm text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         <button
//           onClick={() => setSearchTerm("")}
//           className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition"
//         >
//           Clear
//         </button>
//       </div>

//       {loading ? (
//         <div className="py-6 text-center text-gray-500">Loading…</div>
//       ) : (
//         <>
//           {searchedAuthor && (
//             <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
//               <span className="font-semibold text-gray-900">{searchedAuthor.name}</span> has{" "}
//               <span className="text-red-600">{searchedAuthor.count}</span> paper(s), ranked{" "}
//               <span className="font-semibold">#{searchedAuthor.rank}</span>
//             </div>
//           )}

//           <div className="w-full h-[calc(100%-140px)] overflow-y-scroll border border-gray-200 rounded-xl shadow-md bg-white">
//             <table className="w-full text-left text-sm">
//               <thead className="bg-red-600 text-white sticky top-0">
//                 <tr>
//                   <th className="px-3 py-2 font-medium">#</th>
//                   <th className="px-3 py-2 font-medium">Author</th>
//                   <th className="px-3 py-2 font-medium">Count</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredAuthors.map((author) => {
//                   const isTop10 = author.rank <= 10;
//                   return (
//                     <tr
//                       key={author.name}
//                       className={`border-t transition hover:bg-red-50`}
//                     >
//                       <td className="px-3 py-3">
//                         {isTop10 ? (
//                           <span
//                             className={`${topColors[author.rank - 1]} text-white rounded-full px-2 py-1 text-xs font-bold`}
//                           >
//                             {author.rank}
//                           </span>
//                         ) : (
//                           author.rank
//                         )}
//                       </td>
//                       <td
//                         className={`px-3 py-3 ${
//                           isTop10 ? "font-bold text-gray-900" : "text-gray-900"
//                         }`}
//                       >
//                         {author.name}
//                       </td>
//                       <td className="px-3 py-3 text-gray-700">{author.count}</td>
//                     </tr>
//                   );
//                 })}
//                 {filteredAuthors.length === 0 && (
//                   <tr>
//                     <td colSpan={3} className="text-center py-6 text-gray-400 italic">
//                       No matching authors found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

"use client";

import { useMemo, useState } from "react";

type PaperItem = { conference: string; authors: string[] };

const ALLOWED = ["ICLR", "ICML", "KDD", "NEURIPS", "ACL"] as const;

function tagConference(full: string): (typeof ALLOWED)[number] | null {
  const t = (full || "").split(" ")[0].toUpperCase();
  if (ALLOWED.includes(t as any)) return t as any;
  return null;
}

export default function AuthorList({ papers }: { papers: PaperItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const allAuthors = useMemo(() => {
    const countMap: Record<string, number> = {};
    for (const p of papers) {
      const tag = tagConference(p.conference);
      if (!tag) continue;
      for (const a of p.authors || []) {
        countMap[a] = (countMap[a] || 0) + 1;
      }
    }
    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .map((x, i) => ({ ...x, rank: i + 1 }));
  }, [papers]);

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

  const topColors = [
    "bg-yellow-400",
    "bg-gray-400",
    "bg-orange-500",
    "bg-blue-400",
    "bg-green-400",
    "bg-purple-400",
    "bg-pink-400",
    "bg-indigo-400",
    "bg-teal-400",
    "bg-red-400",
  ];

  return (
    <div className="w-full h-full px-4 py-3">
      <h3 className="text-lg font-bold text-red-700 mb-4">Author Ranking Table</h3>

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          inputMode="search"
          lang="en"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Search author name..."
          className="px-4 py-2 rounded-lg border border-gray-300 w-full max-w-sm text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={() => setSearchTerm("")}
          className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition"
        >
          Clear
        </button>
      </div>

      {/* Show exact match */}
      {searchedAuthor && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm">
          <span className="font-semibold text-gray-900">{searchedAuthor.name}</span> has{" "}
          <span className="text-red-600">{searchedAuthor.count}</span> paper(s), ranked{" "}
          <span className="font-semibold">#{searchedAuthor.rank}</span>
        </div>
      )}

      {/* Author Table */}
      <div className="w-full h-[calc(100%-140px)] overflow-y-scroll border border-gray-200 rounded-xl shadow-md bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-red-600 text-white sticky top-0">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Author</th>
              <th className="px-3 py-2 font-medium">Count</th>
            </tr>
          </thead>

          <tbody>
            {filteredAuthors.map((author) => {
              const isTop10 = author.rank <= 10;
              return (
                <tr key={author.name} className="border-t transition hover:bg-red-50">
                  <td className="px-3 py-3">
                    {isTop10 ? (
                      <span
                        className={`${topColors[author.rank - 1]} text-white rounded-full px-2 py-1 text-xs font-bold`}
                      >
                        {author.rank}
                      </span>
                    ) : (
                      author.rank
                    )}
                  </td>

                  <td
                    className={`px-3 py-3 ${
                      isTop10 ? "font-bold text-gray-900" : "text-gray-900"
                    }`}
                  >
                    {author.name}
                  </td>

                  <td className="px-3 py-3 text-gray-700">{author.count}</td>
                </tr>
              );
            })}

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
    </div>
  );
}
