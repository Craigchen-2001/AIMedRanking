// frontend/src/app/api/favorites/[paperId]/route.ts
const ORIGIN =
  process.env.API_TARGET ||
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND ||
  "http://localhost:3001";

export async function POST(_req: Request, ctx: { params: { paperId: string } }) {
  const id = encodeURIComponent(ctx.params.paperId);
  const r = await fetch(`${ORIGIN}/favorites/${id}`, { method: "POST", credentials: "include" });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}

export async function DELETE(_req: Request, ctx: { params: { paperId: string } }) {
  const id = encodeURIComponent(ctx.params.paperId);
  const r = await fetch(`${ORIGIN}/favorites/${id}`, { method: "DELETE", credentials: "include" });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
}
