'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

type Paper = {
  id: string;
  title: string;
  authors: string[] | null;
  conference: string;
  year: number;
  pdf_url: string | null;
};

export default function FavoritesPage() {
  const { user, ensureAuth, removeFavorite } = useAuth();
  const [items, setItems] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!ensureAuth()) {
        setLoading(false);
        return;
      }
      const r = await fetch('/api/favorites', { credentials: 'include', cache: 'no-store' });
      if (!r.ok) {
        setLoading(false);
        return;
      }
      const data = await r.json();
      if (!alive) return;
      const list = Array.isArray(data) ? data : data.items || [];
      const mapped: Paper[] = list.map((p: any) => ({
        id: p.id,
        title: p.title,
        authors: Array.isArray(p.authors) ? p.authors : null,
        conference: p.conference,
        year: Number(p.year) || 0,
        pdf_url: p.pdf_url ?? null,
      }));
      setItems(mapped);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [ensureAuth]);

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Favorites</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="rounded-xl border p-4 flex justify-between items-start">
              <div>
                <Link href={`/paper/${p.id}`} className="text-blue-700 font-semibold hover:underline">
                  {p.title}
                </Link>
                <div className="text-sm text-gray-600">{p.authors?.join(', ') || 'Unknown author'}</div>
                <div className="text-xs text-gray-500">{p.conference} · {p.year}</div>
              </div>
              <div className="flex gap-3">
                {p.pdf_url && (
                  <a href={p.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                    PDF
                  </a>
                )}
                <button onClick={() => removeFavorite(p.id)} className="text-sm text-red-600">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
