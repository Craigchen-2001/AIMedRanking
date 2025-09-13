const ORIGIN =
  process.env.API_TARGET ||
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND ||
  'http://localhost:3001';

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const id = encodeURIComponent(ctx.params.id);
  let r = await fetch(`${ORIGIN}/api/papers/${id}`, { cache: 'no-store' });
  if (!r.ok) r = await fetch(`${ORIGIN}/papers/${id}`, { cache: 'no-store' });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}
