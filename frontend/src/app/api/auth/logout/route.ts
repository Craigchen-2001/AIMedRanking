// frontend/src/app/api/auth/logout/route.ts
const ORIGIN =
  process.env.NEXT_PUBLIC_API_TARGET ||
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND ||
  "http://localhost:3001";

export async function POST() {
  const r = await fetch(`${ORIGIN}/auth/logout`, { method: "POST", credentials: "include" });
  const resBody = await r.text();
  return new Response(resBody, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json", "set-cookie": r.headers.get("set-cookie") || "" } });
}
