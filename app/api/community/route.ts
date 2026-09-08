import { and, desc, eq, gte, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import { communityBlocks, communityMessages, communityProfiles, connectionRequests } from '@/db/schema';
import { getCurrentUser } from '../../auth';
import { hubs, interests, intents } from '@/lib/model';

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  hub: z.string().refine((value) => hubs.includes(value)),
  cohort: z.enum(['teen', 'adult']),
  bio: z.string().trim().max(240),
  interests: z.array(z.string().refine((value) => interests.includes(value))).min(1).max(10).transform((values) => [...new Set(values)]),
  intent: z.string().refine((value) => intents.includes(value)),
  introvert: z.boolean(),
  discoverable: z.boolean(),
});
const actionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('join'), profile: profileSchema }),
  z.object({ kind: z.literal('request'), publicId: z.string().regex(/^[a-f0-9]{24}$/) }),
  z.object({ kind: z.literal('cancel'), requestId: z.string().uuid() }),
  z.object({ kind: z.literal('respond'), requestId: z.string().uuid(), accept: z.boolean() }),
  z.object({ kind: z.literal('message'), publicId: z.string().regex(/^[a-f0-9]{24}$/), body: z.string().trim().min(1).max(1500) }),
  z.object({ kind: z.literal('block'), publicId: z.string().regex(/^[a-f0-9]{24}$/) }),
]);

const response = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const parseInterests = (raw: string) => {
  try { const value = JSON.parse(raw); return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []; }
  catch { return []; }
};
async function opaqueId(owner: string) {
  const bytes = new TextEncoder().encode(`toveli-community-v1:${owner.toLowerCase()}`);
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((value) => value.toString(16).padStart(2, '0')).join('').slice(0, 24);
}
function safeProfile(profile: typeof communityProfiles.$inferSelect) {
  return { publicId: profile.publicId, displayName: profile.displayName, hub: profile.hub, cohort: profile.cohort, bio: profile.bio, interests: parseInterests(profile.interests), intent: profile.intent, introvert: profile.introvert, discoverable: profile.discoverable, updatedAt: profile.updatedAt };
}
async function getTarget(publicId: string) {
  return (await getDb().select().from(communityProfiles).where(eq(communityProfiles.publicId, publicId)).limit(1))[0];
}
async function isBlocked(a: string, b: string) {
  return (await getDb().select({ actor: communityBlocks.actor }).from(communityBlocks).where(or(and(eq(communityBlocks.actor, a), eq(communityBlocks.target, b)), and(eq(communityBlocks.actor, b), eq(communityBlocks.target, a)))).limit(1)).length > 0;
}
async function accepted(a: string, b: string) {
  return (await getDb().select({ id: connectionRequests.id }).from(connectionRequests).where(and(eq(connectionRequests.state, 'accepted'), or(and(eq(connectionRequests.sender, a), eq(connectionRequests.receiver, b)), and(eq(connectionRequests.sender, b), eq(connectionRequests.receiver, a))))).limit(1)).length > 0;
}
async function snapshot(owner: string) {
  const db = getDb();
  const me = (await db.select().from(communityProfiles).where(eq(communityProfiles.owner, owner)).limit(1))[0] ?? null;
  if (!me) return { me: null, people: [], requests: [], contacts: [], messages: [] };
  const allProfiles = await db.select().from(communityProfiles).where(eq(communityProfiles.discoverable, true));
  const blockRows = await db.select().from(communityBlocks).where(or(eq(communityBlocks.actor, owner), eq(communityBlocks.target, owner)));
  const blockedOwners = new Set(blockRows.flatMap((row) => [row.actor, row.target]).filter((value) => value !== owner));
  const people = allProfiles.filter((profile) => profile.owner !== owner && profile.cohort === me.cohort && profile.hub === me.hub && !blockedOwners.has(profile.owner)).map(safeProfile);
  const requestRows = await db.select().from(connectionRequests).where(or(eq(connectionRequests.sender, owner), eq(connectionRequests.receiver, owner))).orderBy(desc(connectionRequests.updatedAt));
  const profileRows = await db.select().from(communityProfiles);
  const byOwner = new Map(profileRows.map((profile) => [profile.owner, profile]));
  const requests = requestRows.map((request) => ({ id: request.id, direction: request.sender === owner ? 'outgoing' : 'incoming', state: request.state, person: safeProfile(byOwner.get(request.sender === owner ? request.receiver : request.sender)!), updatedAt: request.updatedAt }));
  const contactOwners = new Set(requestRows.filter((request) => request.state === 'accepted').map((request) => request.sender === owner ? request.receiver : request.sender).filter((target) => !blockedOwners.has(target)));
  const contacts = [...contactOwners].map((target) => byOwner.get(target)).filter((profile): profile is typeof communityProfiles.$inferSelect => Boolean(profile)).map(safeProfile);
  const messageRows = await db.select().from(communityMessages).where(or(eq(communityMessages.sender, owner), eq(communityMessages.receiver, owner))).orderBy(communityMessages.createdAt).limit(500);
  const messages = messageRows.filter((message) => contactOwners.has(message.sender === owner ? message.receiver : message.sender)).map((message) => ({ id: message.id, fromMe: message.sender === owner, personId: byOwner.get(message.sender === owner ? message.receiver : message.sender)?.publicId, body: message.body, createdAt: message.createdAt }));
  return { me: safeProfile(me), people, requests, contacts, messages };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return response({ error: 'Sign in to open the community.' }, 401);
  try { return response(await snapshot(user.email)); }
  catch { return response({ error: 'The community could not load. Please retry.' }, 503); }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return response({ error: 'Sign in first.' }, 401);
  if (request.headers.get('origin') !== new URL(request.url).origin) return response({ error: 'Request origin rejected.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 10_000) return response({ error: 'Request too large.' }, 413);
  try {
    const raw = await request.text();
    if (raw.length > 10_000) return response({ error: 'Request too large.' }, 413);
    const action = actionSchema.parse(JSON.parse(raw));
    const db = getDb();
    const now = Date.now();
    if (action.kind === 'join') {
      const profile = action.profile;
      await db.insert(communityProfiles).values({ owner: user.email, publicId: await opaqueId(user.email), displayName: profile.displayName, hub: profile.hub, cohort: profile.cohort, bio: profile.bio, interests: JSON.stringify(profile.interests), intent: profile.intent, introvert: profile.introvert, discoverable: profile.discoverable, createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: communityProfiles.owner, set: { displayName: profile.displayName, hub: profile.hub, cohort: profile.cohort, bio: profile.bio, interests: JSON.stringify(profile.interests), intent: profile.intent, introvert: profile.introvert, discoverable: profile.discoverable, updatedAt: now } });
      return response(await snapshot(user.email));
    }
    const me = (await db.select().from(communityProfiles).where(eq(communityProfiles.owner, user.email)).limit(1))[0];
    if (!me) return response({ error: 'Create your community profile first.' }, 409);
    if (action.kind === 'respond' || action.kind === 'cancel') {
      const item = (await db.select().from(connectionRequests).where(eq(connectionRequests.id, action.requestId)).limit(1))[0];
      if (!item) return response({ error: 'Request not found.' }, 404);
      if (action.kind === 'respond') {
        if (item.receiver !== user.email || item.state !== 'pending') return response({ error: 'This request cannot be changed.' }, 403);
        if (await isBlocked(item.sender, item.receiver)) return response({ error: 'This connection is unavailable.' }, 409);
        await db.update(connectionRequests).set({ state: action.accept ? 'accepted' : 'declined', updatedAt: now }).where(eq(connectionRequests.id, item.id));
      } else {
        if (item.sender !== user.email || item.state !== 'pending') return response({ error: 'This request cannot be cancelled.' }, 403);
        await db.update(connectionRequests).set({ state: 'cancelled', updatedAt: now }).where(eq(connectionRequests.id, item.id));
      }
      return response(await snapshot(user.email));
    }
    const target = await getTarget(action.publicId);
    if (!target || target.owner === user.email) return response({ error: 'This member is unavailable.' }, 404);
    if (action.kind === 'block') {
      await db.insert(communityBlocks).values({ actor: user.email, target: target.owner, createdAt: now }).onConflictDoNothing();
      await db.update(connectionRequests).set({ state: 'cancelled', updatedAt: now }).where(and(or(and(eq(connectionRequests.sender, user.email), eq(connectionRequests.receiver, target.owner)), and(eq(connectionRequests.sender, target.owner), eq(connectionRequests.receiver, user.email))), or(eq(connectionRequests.state, 'pending'), eq(connectionRequests.state, 'accepted'))));
      return response(await snapshot(user.email));
    }
    if (await isBlocked(user.email, target.owner)) return response({ error: 'This member is unavailable.' }, 409);
    if (action.kind === 'request') {
      if (target.cohort !== me.cohort || target.hub !== me.hub || !target.discoverable) return response({ error: 'This member is unavailable.' }, 404);
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(connectionRequests).where(and(eq(connectionRequests.sender, user.email), gte(connectionRequests.createdAt, now - 86_400_000)));
      if (Number(count) >= 20) return response({ error: 'Daily connection-request limit reached.' }, 429);
      const existing = (await db.select().from(connectionRequests).where(and(or(and(eq(connectionRequests.sender, user.email), eq(connectionRequests.receiver, target.owner)), and(eq(connectionRequests.sender, target.owner), eq(connectionRequests.receiver, user.email))), or(eq(connectionRequests.state, 'pending'), eq(connectionRequests.state, 'accepted')))).limit(1))[0];
      if (existing) return response({ error: 'A connection is already pending or accepted.' }, 409);
      await db.insert(connectionRequests).values({ id: crypto.randomUUID(), sender: user.email, receiver: target.owner, state: 'pending', createdAt: now, updatedAt: now });
    } else if (action.kind === 'message') {
      if (!(await accepted(user.email, target.owner))) return response({ error: 'Messages require an accepted connection.' }, 403);
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(communityMessages).where(and(eq(communityMessages.sender, user.email), gte(communityMessages.createdAt, now - 3_600_000)));
      if (Number(count) >= 60) return response({ error: 'Hourly message limit reached. Try again later.' }, 429);
      await db.insert(communityMessages).values({ id: crypto.randomUUID(), sender: user.email, receiver: target.owner, body: action.body, createdAt: now });
    }
    return response(await snapshot(user.email));
  } catch (error) {
    return response({ error: error instanceof z.ZodError ? 'Check your entries and try again.' : 'Unable to save. Please retry.' }, error instanceof z.ZodError ? 400 : 503);
  }
}
