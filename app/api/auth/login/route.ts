import { sameOrigin } from '@/lib/http';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { createSession, verifyPassword } from '@/app/auth';

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(128) });

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'Request origin rejected.' }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const user = (await getDb().select().from(users).where(eq(users.email, input.email)).limit(1))[0];
    if (!user || !(await verifyPassword(input.password, user.passwordSalt, user.passwordHash))) return Response.json({ error: 'Email or password is incorrect.' }, { status: 401 });
    await createSession(user.id);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? 'Enter a valid email and password.' : 'Sign in is temporarily unavailable.' }, { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
