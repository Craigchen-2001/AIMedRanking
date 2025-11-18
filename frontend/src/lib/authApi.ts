// frontend/src/lib/authApi.ts

const ORIGIN =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_SITE_ORIGIN + "/api" ||
  "https://aimedrank.aimedlab.net/api";

type User = { id: string; email: string; name: string };

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) throw new Error(String(r.status));
  return r.json() as Promise<T>;
}

export async function apiRegister(email: string, password: string, name: string) {
  const r = await fetch(`${ORIGIN}/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, name }),
  });
  return json<User>(r);
}

export async function apiLogin(email: string, password: string) {
  const r = await fetch(`${ORIGIN}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return json<User>(r);
}

export async function apiLogout() {
  const r = await fetch(`${ORIGIN}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!r.ok) throw new Error(String(r.status));
  return true;
}

export async function apiMe() {
  const r = await fetch(`${ORIGIN}/auth/me`, {
    method: "GET",
    credentials: "include",
  });
  if (!r.ok) return { user: null as User | null, favoriteIds: [] as string[] };
  return r.json() as Promise<{ user: User | null; favoriteIds: string[] }>;
}
