const ORIGIN =
  process.env.API_TARGET ||
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND ||
  'http://localhost:3001';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search || '';
  let r = await fetch(`${ORIGIN}/api/papers${qs}`, { cache: 'no-store' });
  if (!r.ok) r = await fetch(`${ORIGIN}/papers${qs}`, { cache: 'no-store' });
  const body = await r.text();
  return new Response(body, { status: r.status, headers: { 'content-type': r.headers.get('content-type') ?? 'application/json' } });
}

