// /Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/frontend/src/components/auth/AccountDialog.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { fetchFavorites, type FavoritePaper } from "@/lib/favoritesApi";

type User = { id: string; email: string; name: string };

function tagConference(full?: string) {
  const u = (full || "").toUpperCase();
  if (u.startsWith("NEURIPS")) return "NEURIPS";
  if (u.startsWith("ICLR")) return "ICLR";
  if (u.startsWith("ICML")) return "ICML";
  if (u.startsWith("KDD")) return "KDD";
  return "OTHER";
}

export default function AccountDialog({
  open,
  user,
  onClose,
  onLogout,
}: {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onLogout: () => Promise<void>;
}) {
  const [favLoading, setFavLoading] = useState(false);
  const [favItems, setFavItems] = useState<FavoritePaper[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    setFavLoading(true);
    fetchFavorites()
      .then((list) => setFavItems(list || []))
      .catch(() => setFavItems([]))
      .finally(() => setFavLoading(false));
  }, [open, user]);

  const breakdown = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of favItems) {
      const k = tagConference((p as any).conference);
      m[k] = (m[k] || 0) + 1;
    }
    const order = ["ICLR", "ICML", "KDD", "NEURIPS", "OTHER"];
    return order.filter((k) => m[k]).map((k) => [k, m[k]] as const);
  }, [favItems]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40">
      <div className="w-[460px] rounded-2xl bg-white p-6 shadow-xl">
        <div className="text-2xl font-semibold mb-4">My Account</div>
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Name</div>
              <div className="text-base font-medium text-gray-900">{user.name}</div>
            </div>
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="text-sm text-gray-600">Email</div>
              <div className="text-base font-medium text-gray-900">{user.email}</div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Favorites</div>
              <div className="text-base font-semibold text-gray-900">{favItems.length}</div>
            </div>

            <div className="rounded-xl border bg-gray-50">
              {favLoading ? (
                <div className="px-4 py-3 text-sm text-gray-600">Loading...</div>
              ) : favItems.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-600">No favorites yet</div>
              ) : (
                <ul className="px-4 py-3 space-y-2">
                  {breakdown.map(([k, v]) => (
                    <li key={k} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">-</span>
                        <span className="text-sm font-medium text-gray-900">{k}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{v}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-700">Not signed in</div>
        )}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border">Close</button>
          <button onClick={onLogout} className="ml-auto px-4 py-2 rounded-lg bg-red-700 text-white">Log Out</button>
        </div>
      </div>
    </div>
  );
}
