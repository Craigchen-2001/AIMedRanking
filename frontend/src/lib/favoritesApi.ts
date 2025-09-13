// /Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/frontend/src/lib/favoritesApi.ts
const ORIGIN =
  process.env.NEXT_PUBLIC_BACKEND ||
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_API_TARGET ||
  "http://localhost:3001";

export type FavoritePaper = {
  id: string;
  title: string;
  authors: string[];
  conference: string;
  year: number;
  pdf_url: string | null;
};

export async function addFavorite(paperId: string) {
  const r = await fetch(`${ORIGIN}/favorites/${encodeURIComponent(paperId)}`, {
    method: "POST",
    credentials: "include",
  });
  if (!r.ok) throw new Error(String(r.status));
  return true;
}

export async function removeFavorite(paperId: string) {
  const r = await fetch(`${ORIGIN}/favorites/${encodeURIComponent(paperId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!r.ok) throw new Error(String(r.status));
  return true;
}

export async function fetchFavorites(): Promise<FavoritePaper[]> {
  const r = await fetch(`${ORIGIN}/favorites`, { credentials: "include" });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
