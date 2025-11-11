// frontend/src/components/auth/AuthProvider.tsx
"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiLogin, apiLogout, apiRegister, apiMe } from "@/lib/authApi";
import { addFavorite as apiAddFav, removeFavorite as apiRemoveFav } from "@/lib/favoritesApi";
import AuthDialog from "./AuthDialog";
import AccountDialog from "./AccountDialog";

type User = { id: string; email: string; name: string };

type AuthCtx = {
  user: User | null;
  favoriteIds: Set<string>;
  openLogin: () => void;
  openRegister: () => void;
  openAccount: () => void;
  closeModals: () => void;
  ensureAuth: () => boolean;
  setFavoriteIds: (ids: string[]) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  addFavorite: (paperId: string) => Promise<void>;
  removeFavorite: (paperId: string) => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favoriteIds, setFav] = useState<Set<string>>(new Set());
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    apiMe().then((r) => {
      if (r.user) setUser(r.user);
      setFav(new Set(r.favoriteIds || []));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as "login" | "register";
      setAuthMode(detail);
    };
    window.addEventListener("switch-auth", handler as EventListener);
    return () => window.removeEventListener("switch-auth", handler as EventListener);
  }, []);

  const value = useMemo<AuthCtx>(() => ({
    user,
    favoriteIds,
    openLogin: () => { setAuthMode("login"); setAuthOpen(true); },
    openRegister: () => { setAuthMode("register"); setAuthOpen(true); },
    openAccount: () => setAccountOpen(true),
    closeModals: () => { setAuthOpen(false); setAccountOpen(false); },
    ensureAuth: () => {
      if (user) return true;
      setAuthMode("login");
      setAuthOpen(true);
      return false;
    },
    setFavoriteIds: (ids) => setFav(new Set(ids)),
    login: async (email, password) => {
      const u = await apiLogin(email, password);
      setUser(u);
      const me = await apiMe();
      setFav(new Set(me.favoriteIds || []));
      setAuthOpen(false);
    },
    register: async (email, password, name) => {
      const u = await apiRegister(email, password, name);
      setUser(u);
      const me = await apiMe();
      setFav(new Set(me.favoriteIds || []));
      setAuthOpen(false);
    },
    logout: async () => {
      await apiLogout();
      setUser(null);
      setFav(new Set());
      setAccountOpen(false);
    },
    addFavorite: async (paperId: string) => {
      await apiAddFav(paperId);
      setFav((prev) => new Set([...prev, paperId]));
    },
    removeFavorite: async (paperId: string) => {
      await apiRemoveFav(paperId);
      setFav((prev) => {
        const n = new Set(prev);
        n.delete(paperId);
        return n;
      });
    },
  }), [user, favoriteIds]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <AuthDialog open={authOpen} mode={authMode} onClose={() => setAuthOpen(false)} onLogin={value.login} onRegister={value.register} />
      <AccountDialog open={accountOpen} user={user} onClose={() => setAccountOpen(false)} onLogout={value.logout} />
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider missing");
  return v;
}
