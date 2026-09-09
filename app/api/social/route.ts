import { ZodError } from 'zod';
import { getCurrentUser } from '@/app/auth';
import { sameOrigin, boundedJson } from '@/lib/http';
import { createSocialService, SocialError } from '@/lib/social/service';
import { socialDatabase } from '@/lib/social/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
async function handle(request?: Request) {
  try {
    if (request && !sameOrigin(request)) return reply({ error: 'Request origin rejected.' }, 403);
    const user = await getCurrentUser();
    if (!user) return reply({ error: 'Sign in to continue.' }, 401);
    const service = createSocialService(socialDatabase());
    return reply(request ? await service.act(user, await boundedJson(request)) : await service.snapshot(user));
  } catch (error) {
    if (error instanceof SocialError) return reply({ error: error.message }, error.status);
    if (error instanceof ZodError || error instanceof SyntaxError) return reply({ error: 'Check your entries and try again.' }, 400);
    if (error instanceof Error && error.message === 'Request too large.') return reply({ error: error.message }, 413);
    console.error('Social request failed:', error instanceof Error ? error.name : 'unknown');
    return reply({ error: 'Unable to load your community. Please try again.' }, 503);
  }
}
export async function GET() { return handle(); }
export async function POST(request: Request) { return handle(request); }
