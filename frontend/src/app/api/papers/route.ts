const ORIGIN =
  process.env.NEXT_PUBLIC_API_TARGET ||
  process.env.BACKEND_ORIGIN ||
  process.env.NEXT_PUBLIC_BACKEND ||
  'http://localhost:3001';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const qs = url.search || '';
  let r = await fetch(`${ORIGIN}/api/papers${qs}`, { cache: 'no-store' });
  if (!r.ok) r = await fetch(`${ORIGIN}/papers${qs}`, { cache: 'no-store' });
  const json = await r.json();
  return Response.json(json, { status: r.status });
}

