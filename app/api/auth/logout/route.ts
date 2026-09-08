import { destroySession } from '@/app/auth';

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Request origin rejected.' }, { status: 403 });
  await destroySession();
  return Response.json({ ok: true });
}
