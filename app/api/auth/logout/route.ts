import { destroySession } from '@/app/auth';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ error: 'Request origin rejected.' }, { status: 403 });
  await destroySession();
  return Response.json({ ok: true });
}
