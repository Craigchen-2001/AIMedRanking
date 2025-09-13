// frontend/src/app/api/favorites/route.ts
const ORIGIN =
  process.env.NEXT_PUBLIC_API_TARGET ||
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND ||
  "http://localhost:3001";

export async function GET() {
  const r = await fetch(`${ORIGIN}/favorites`, { credentials: "include", cache: "no-store" });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}
