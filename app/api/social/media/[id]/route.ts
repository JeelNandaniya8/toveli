import { getCurrentUser } from '@/app/auth';
import { socialDatabase } from '@/lib/social/database';
import { createSocialService, SocialError } from '@/lib/social/service';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return new Response(null, { status: 401 });
    const photo = await createSocialService(socialDatabase()).photo(user, (await params).id);
    return new Response(Buffer.from(photo.split(',')[1], 'base64'), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (e) { return new Response(null, { status: e instanceof SocialError ? e.status : 503 }); }
}
