import { actionInput } from './validation.ts';
import type { ItemData, Member, SocialSnapshot } from './types.ts';

export type Row = Record<string, unknown>;
export interface Queryable { query<T extends Row = Row>(text: string, params?: unknown[]): Promise<{ rows: T[] }> }
export interface Database extends Queryable { transaction<T>(run: (tx: Queryable) => Promise<T>): Promise<T> }
export type Actor = { id: string; email: string; displayName: string };
type ProfileRow = Row & { owner: string; account_id: string; public_id: string; display_name: string; hub: string; cohort: 'teen' | 'adult'; bio: string; interests: string; intent: string; introvert: boolean; discoverable: boolean };
type ItemRow = Row & { id: string; owner: string; kind: 'post' | 'circle' | 'plan'; data: ItemData; created_at: string | number; hub: string; cohort: string; has_photo?: boolean };

export class SocialError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}
const profileSelect = 'SELECT p.*, u.id AS account_id FROM community_profiles p JOIN users u ON u.email=p.owner';
function member(p: ProfileRow): Member {
  return { id: p.public_id, name: p.display_name, hub: p.hub, cohort: p.cohort, bio: p.bio,
    interests: JSON.parse(p.interests), intent: p.intent, introvert: p.introvert, discoverable: p.discoverable };
}
async function first<T extends Row>(db: Queryable, text: string, params: unknown[] = []) { return (await db.query<T>(text, params)).rows[0]; }
async function blocked(db: Queryable, a: string, b: string) {
  return !!await first(db, 'SELECT actor FROM community_blocks WHERE (actor=$1 AND target=$2) OR (actor=$2 AND target=$1)', [a, b]);
}
async function myProfile(db: Queryable, user: Actor) {
  return first<ProfileRow>(db, `${profileSelect} WHERE p.owner=$1`, [user.email]);
}
async function targetProfile(db: Queryable, me: ProfileRow, id: string) {
  const target = await first<ProfileRow>(db, `${profileSelect} WHERE p.public_id=$1`, [id]);
  if (!target || target.owner === me.owner || target.hub !== me.hub || target.cohort !== me.cohort || await blocked(db, me.owner, target.owner)) throw new SocialError('This member is unavailable.', 404);
  return target;
}
async function allowedItem(db: Queryable, me: ProfileRow, id: string, lock = false) {
  const item = await first<ItemRow>(db, `SELECT * FROM social_items WHERE id=$1 ${lock ? 'FOR UPDATE' : ''}`, [id]);
  if (!item || item.hub !== me.hub || item.cohort !== me.cohort) throw new SocialError('This post or activity is unavailable.', 404);
  const author = await first<ProfileRow>(db, `${profileSelect} WHERE u.id=$1`, [item.owner]);
  if (!author || author.hub !== me.hub || author.cohort !== me.cohort || await blocked(db, me.owner, author.owner)) throw new SocialError('This post or activity is unavailable.', 404);
  return { item, author };
}
async function notify(db: Queryable, to: string, user: Actor, text: string, target: string, now: number) {
  if (to === user.id) return;
  await db.query('INSERT INTO social_notifications(id,recipient,actor,text,target,created_at) VALUES ($1,$2,$3,$4,$5,$6)', [crypto.randomUUID(), to, user.id, text, target, now]);
}
async function limit(db: Queryable, user: Actor, now: number) {
  // Serialize mutations for an account before checking its rolling write budget.
  await db.query('SELECT id FROM users WHERE id=$1 FOR NO KEY UPDATE', [user.id]);
  const key = 'v4:rate';
  const old = await first<{ value: string }>(db, 'SELECT value FROM records WHERE owner=$1 AND key=$2', [user.email, key]);
  const previous = old ? JSON.parse(old.value) as { start: number; count: number } : null;
  const next = previous && previous.start > now - 60_000 ? { start: previous.start, count: previous.count + 1 } : { start: now, count: 1 };
  if (next.count > 40) throw new SocialError('Please take a moment before trying again.', 429);
  await db.query('INSERT INTO records(owner,key,value,created) VALUES ($1,$2,$3,$4) ON CONFLICT(owner,key) DO UPDATE SET value=EXCLUDED.value', [user.email, key, JSON.stringify(next), now]);
}

export function createSocialService(db: Database, clock = Date.now) {
  async function snapshot(user: Actor): Promise<SocialSnapshot> {
    const me = await myProfile(db, user);
    const result: SocialSnapshot = { now: clock(), me: me ? member(me) : null, account: { name: user.displayName }, people: [], items: [], requests: [], contacts: [], messages: [], notifications: [] };
    if (!me) return result;
    const profiles = (await db.query<ProfileRow>(`${profileSelect} WHERE p.hub=$2 AND p.cohort=$3 AND NOT EXISTS
      (SELECT 1 FROM community_blocks b WHERE (b.actor=$1 AND b.target=p.owner) OR (b.target=$1 AND b.actor=p.owner))
      ORDER BY p.updated_at DESC LIMIT 1000`, [user.email, me.hub, me.cohort])).rows;
    const byAccount = new Map(profiles.map(p => [p.account_id, p]));
    const byEmail = new Map(profiles.map(p => [p.owner, p]));
    result.people = profiles.filter(p => p.account_id !== user.id && p.discoverable).map(member).sort((a, b) => {
      const overlap = (p: Member) => p.interests.filter(t => result.me!.interests.includes(t)).length + (p.intent === me.intent ? 1 : 0);
      return overlap(b) - overlap(a);
    });
    const items = (await db.query<ItemRow>(`SELECT i.id,i.owner,i.kind,i.hub,i.cohort,i.data-'photo' AS data,i.data ? 'photo' AS has_photo,i.created_at
      FROM social_items i JOIN users u ON u.id=i.owner JOIN community_profiles p ON p.owner=u.email
      WHERE i.hub=$2 AND i.cohort=$3 AND p.hub=$2 AND p.cohort=$3 AND NOT EXISTS
      (SELECT 1 FROM community_blocks b WHERE (b.actor=$1 AND b.target=p.owner) OR (b.target=$1 AND b.actor=p.owner))
      ORDER BY i.created_at DESC LIMIT 80`, [user.email, me.hub, me.cohort])).rows;
    const ids = items.map(i => i.id);
    if (ids.length) {
      const reactions = (await db.query<{ item_id: string; actor: string; kind: string }>('SELECT item_id,actor,kind FROM social_reactions WHERE item_id=ANY($1::uuid[])', [ids])).rows;
      const comments = (await db.query<{ id: string; item_id: string; actor: string; body: string; created_at: number }>('SELECT * FROM social_comments WHERE item_id=ANY($1::uuid[]) ORDER BY created_at DESC LIMIT 500', [ids])).rows;
      result.items = items.filter(i => byAccount.has(i.owner)).map(i => {
        const reactionsForItem = reactions.filter(r => r.item_id === i.id);
        const has = (kind: string) => reactionsForItem.some(r => r.actor === user.id && r.kind === kind);
        return { ...i.data, cover: i.has_photo ? `/api/social/media/${i.id}` : i.data.cover,
          id: i.id, kind: i.kind, author: member(byAccount.get(i.owner)!), createdAt: Number(i.created_at), mine: i.owner === user.id,
          liked: has('like'), saved: has('save'), joined: has('join'), likes: reactionsForItem.filter(r => r.kind === 'like').length,
          members: reactionsForItem.filter(r => r.kind === 'join').length,
          comments: comments.filter(c => c.item_id === i.id && byAccount.has(c.actor)).reverse().map(c => ({ id: c.id, body: c.body, createdAt: Number(c.created_at), author: member(byAccount.get(c.actor)!) })) };
      });
    }
    const requests = (await db.query<{ id: string; sender: string; receiver: string; state: string }>('SELECT id,sender,receiver,state FROM connection_requests WHERE sender=$1 OR receiver=$1 ORDER BY updated_at DESC LIMIT 200', [user.email])).rows;
    result.requests = requests.filter(r => byEmail.has(r.sender === user.email ? r.receiver : r.sender)).map(r => ({ id: r.id, direction: r.sender === user.email ? 'outgoing' : 'incoming', state: r.state, person: member(byEmail.get(r.sender === user.email ? r.receiver : r.sender)!) }));
    result.contacts = [...new Map(result.requests.filter(r => r.state === 'accepted').map(r => [r.person.id, r.person])).values()];
    const contacts = new Set(result.contacts.map(p => p.id));
    const messages = (await db.query<{ id: string; sender: string; receiver: string; body: string; created_at: number }>('SELECT * FROM community_messages WHERE sender=$1 OR receiver=$1 ORDER BY created_at DESC LIMIT 200', [user.email])).rows;
    result.messages = messages.reverse().flatMap(m => {
      const p = byEmail.get(m.sender === user.email ? m.receiver : m.sender);
      return p && contacts.has(p.public_id) ? [{ id: m.id, personId: p.public_id, fromMe: m.sender === user.email, body: m.body, createdAt: Number(m.created_at) }] : [];
    });
    const notifications = (await db.query<{ id: string; actor: string; text: string; target: string; read: boolean; created_at: number }>('SELECT * FROM social_notifications WHERE recipient=$1 ORDER BY created_at DESC LIMIT 50', [user.id])).rows;
    result.notifications = notifications.filter(n => byAccount.has(n.actor)).map(n => ({ id: n.id, text: n.text, target: n.target, read: n.read, createdAt: Number(n.created_at) }));
    return result;
  }

  async function act(user: Actor, raw: unknown) {
    const action = actionInput.parse(raw);
    const now = clock();
    await db.transaction(async tx => {
      await limit(tx, user, now);
      const me = await myProfile(tx, user);
      if (action.kind === 'profile') {
        const p = action.profile;
        if (me && me.cohort !== p.cohort) throw new SocialError('Your age group cannot be changed here.');
        const id = me?.public_id ?? crypto.randomUUID().replaceAll('-', '').slice(0, 24);
        await tx.query(`INSERT INTO community_profiles(owner,public_id,display_name,hub,cohort,bio,interests,intent,introvert,discoverable,created_at,updated_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11) ON CONFLICT(owner) DO UPDATE SET display_name=$3,hub=$4,bio=$6,interests=$7,intent=$8,introvert=$9,discoverable=$10,updated_at=$11`,
        [user.email, id, p.name, p.hub, p.cohort, p.bio, JSON.stringify(p.interests), p.intent, p.introvert, p.discoverable, now]);
        await tx.query('UPDATE users SET display_name=$1 WHERE id=$2', [p.name, user.id]);
        await tx.query('INSERT INTO records(owner,key,value,created) VALUES($1,$2,$3,$4) ON CONFLICT(owner,key) DO UPDATE SET value=EXCLUDED.value', [user.email, 'profile', JSON.stringify({ ...p, behavior: false }), now]);
        return;
      }
      if (!me) throw new SocialError('Complete your profile first.', 409);
      if (action.kind === 'create') {
        const data = action.data;
        if (action.itemKind !== 'post' && !data.title?.trim()) throw new SocialError('Give your activity a title.');
        if (action.itemKind === 'plan' && (!data.place || !data.capacity || !data.startsAt || data.startsAt < now + 60_000 || data.startsAt > now + 90 * 86_400_000)) throw new SocialError('Choose a public place and a time within the next 90 days.');
        const count = await first<{ count: string }>(tx, 'SELECT count(*) FROM social_items WHERE owner=$1 AND created_at>$2', [user.id, now - 86_400_000]);
        if (Number(count?.count) >= 30) throw new SocialError('Your daily sharing limit has been reached.', 429);
        const id = crypto.randomUUID();
        await tx.query('INSERT INTO social_items(id,owner,kind,hub,cohort,data,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)', [id, user.id, action.itemKind, me.hub, me.cohort, JSON.stringify(data), now]);
        if (action.itemKind !== 'post') await tx.query('INSERT INTO social_reactions(item_id,actor,kind,created_at) VALUES($1,$2,$3,$4)', [id, user.id, 'join', now]);
        return;
      }
      if (action.kind === 'read_notifications') { await tx.query('UPDATE social_notifications SET read=true WHERE recipient=$1', [user.id]); return; }
      if (['request', 'message', 'block'].includes(action.kind) && 'personId' in action) {
        const target = await targetProfile(tx, me, action.personId);
        if (action.kind === 'block') {
          await tx.query('INSERT INTO community_blocks(actor,target,created_at) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [user.email, target.owner, now]);
          await tx.query("UPDATE connection_requests SET state='cancelled',updated_at=$3 WHERE (sender=$1 AND receiver=$2) OR (sender=$2 AND receiver=$1)", [user.email, target.owner, now]);
          return;
        }
        await tx.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [[user.email, target.owner].sort().join('|')]);
        const existing = await first<{ id: string; state: string }>(tx, "SELECT id,state FROM connection_requests WHERE ((sender=$1 AND receiver=$2) OR (sender=$2 AND receiver=$1)) AND state IN ('pending','accepted')", [user.email, target.owner]);
        if (action.kind === 'request') {
          if (!target.discoverable) throw new SocialError('This member is unavailable.', 404);
          const sent = await first<{ count: string }>(tx, 'SELECT count(*) FROM connection_requests WHERE sender=$1 AND created_at>$2', [user.email, now - 86_400_000]);
          if (Number(sent?.count) >= 20) throw new SocialError('You’ve reached today’s limit of 20 introductions.', 429);
          if (existing) throw new SocialError('A connection is already pending or accepted.', 409);
          await tx.query("INSERT INTO connection_requests(id,sender,receiver,state,created_at,updated_at) VALUES($1,$2,$3,'pending',$4,$4)", [crypto.randomUUID(), user.email, target.owner, now]);
          await notify(tx, target.account_id, user, `${me.display_name} would like to connect with you.`, '/messages', now);
        } else if (action.kind === 'message') {
          if (existing?.state !== 'accepted') throw new SocialError('Messages open after your connection is accepted.', 403);
          const sent = await first<{ count: string }>(tx, 'SELECT count(*) FROM community_messages WHERE sender=$1 AND created_at>$2', [user.email, now - 3_600_000]);
          if (Number(sent?.count) >= 60) throw new SocialError('Your hourly message limit has been reached. Try again later.', 429);
          await tx.query('INSERT INTO community_messages(id,sender,receiver,body,created_at) VALUES($1,$2,$3,$4,$5)', [crypto.randomUUID(), user.email, target.owner, action.body, now]);
          await notify(tx, target.account_id, user, `${me.display_name} sent you a message.`, `/chat/${me.public_id}`, now);
        }
        return;
      }
      if (action.kind === 'respond' || action.kind === 'cancel_request') {
        const request = await first<{ sender: string; receiver: string; state: string }>(tx, 'SELECT sender,receiver,state FROM connection_requests WHERE id=$1 FOR UPDATE', [action.id]);
        if (!request || request.state !== 'pending' || (action.kind === 'respond' ? request.receiver : request.sender) !== user.email) throw new SocialError('This request cannot be changed.', 403);
        const target = await first<ProfileRow>(tx, `${profileSelect} WHERE p.owner=$1`, [action.kind === 'respond' ? request.sender : request.receiver]);
        if (!target) throw new SocialError('Member unavailable.', 404);
        await targetProfile(tx, me, target.public_id);
        const state = action.kind === 'cancel_request' ? 'cancelled' : action.accept ? 'accepted' : 'declined';
        await tx.query('UPDATE connection_requests SET state=$2,updated_at=$3 WHERE id=$1', [action.id, state, now]);
        if (state === 'accepted') await notify(tx, target.account_id, user, `${me.display_name} accepted your connection. Say hello!`, `/chat/${me.public_id}`, now);
        return;
      }
      if (!('id' in action)) throw new SocialError('Unknown action.');
      const { item, author } = await allowedItem(tx, me, action.id, true);
      if (action.kind === 'delete') {
        if (item.owner !== user.id) throw new SocialError('Only the creator can remove this.', 403);
        if (item.kind !== 'post') {
          const members = (await tx.query<{ actor: string }>("SELECT actor FROM social_reactions WHERE item_id=$1 AND kind='join' AND actor<>$2", [item.id, user.id])).rows;
          for (const joined of members) await notify(tx, joined.actor, user, `${me.display_name} ${item.kind === 'plan' ? 'cancelled' : 'closed'} ${item.data.title || 'an activity you joined'}.`, item.kind === 'plan' ? '/plans' : '/circles', now);
        }
        await tx.query('DELETE FROM social_items WHERE id=$1', [item.id]); return;
      }
      if (action.kind === 'report') {
        await tx.query('INSERT INTO social_reports(id,item_id,actor,reason,created_at) VALUES($1,$2,$3,$4,$5)', [crypto.randomUUID(), item.id, user.id, action.reason, now]); return;
      }
      if (action.kind === 'comment') {
        if (item.kind === 'circle' && !await first(tx, "SELECT actor FROM social_reactions WHERE item_id=$1 AND actor=$2 AND kind='join'", [item.id, user.id])) throw new SocialError('Join the circle to add to its conversation.', 403);
        await tx.query('INSERT INTO social_comments(id,item_id,actor,body,created_at) VALUES($1,$2,$3,$4,$5)', [crypto.randomUUID(), item.id, user.id, action.body, now]);
        await notify(tx, item.owner, user, `${me.display_name} replied to your ${item.kind}.`, `/feed#${item.id}`, now); return;
      }
      if (action.kind === 'react') {
        if (action.reaction === 'join') {
          if (item.kind === 'post') throw new SocialError('Posts cannot be joined.');
          if (item.owner === user.id && !action.enabled) throw new SocialError('You are the host. Cancel the activity to leave it.');
          if (item.kind === 'plan' && action.enabled) {
            if ((item.data.startsAt ?? 0) <= now) throw new SocialError('This plan has already started.');
            const existing = await first(tx, "SELECT actor FROM social_reactions WHERE item_id=$1 AND actor=$2 AND kind='join'", [item.id, user.id]);
            const count = await first<{ count: string }>(tx, "SELECT count(*) FROM social_reactions WHERE item_id=$1 AND kind='join'", [item.id]);
            if (!existing && Number(count?.count) >= (item.data.capacity ?? 20)) throw new SocialError('This plan is full.', 409);
          }
        }
        if (action.enabled) {
          const added = await first(tx, 'INSERT INTO social_reactions(item_id,actor,kind,created_at) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING RETURNING actor', [item.id, user.id, action.reaction, now]);
          if (added && action.reaction === 'join') await notify(tx, author.account_id, user, `${me.display_name} joined your ${item.kind}.`, `/${item.kind === 'plan' ? 'plans' : 'circles'}#${item.id}`, now);
        } else await tx.query('DELETE FROM social_reactions WHERE item_id=$1 AND actor=$2 AND kind=$3', [item.id, user.id, action.reaction]);
      }
    });
    return snapshot(user);
  }
  async function photo(user: Actor, id: string) {
    const me = await myProfile(db, user);
    if (!me || !/^[a-f0-9-]{36}$/.test(id)) throw new SocialError('Photo not found.', 404);
    const { item } = await allowedItem(db, me, id);
    if (!item.data.photo) throw new SocialError('Photo not found.', 404);
    return item.data.photo;
  }
  return { snapshot, act, photo };
}
