import { sameOrigin } from '@/lib/http';
import { destroySession } from '@/app/auth';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Request origin rejected.' }, { status: 403 });
  await destroySession();
  return Response.json({ ok: true });
}
