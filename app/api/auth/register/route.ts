import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { createSession, hashPassword } from '@/app/auth';

const schema = z.object({
  displayName: z.string().trim().min(2).max(40),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ error: 'Request origin rejected.' }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const db = getDb();
    if ((await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1))[0]) return Response.json({ error: 'An account already exists for this email.' }, { status: 409 });
    const password = await hashPassword(input.password);
    const id = crypto.randomUUID();
    await db.insert(users).values({ id, email: input.email, displayName: input.displayName, passwordHash: password.hash, passwordSalt: password.salt, createdAt: Date.now() });
    await createSession(id);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof z.ZodError ? 'Check your name, email, and password.' : 'Account could not be created.' }, { status: error instanceof z.ZodError ? 400 : 503 });
  }
}
