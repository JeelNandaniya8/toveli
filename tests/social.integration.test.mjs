import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createSocialService } from '../lib/social/service.ts';

test('PostgreSQL social journeys enforce persistence and access', async t => {
  const db = new PGlite();
  for (const name of (await readdir('drizzle')).filter(n => n.endsWith('.sql')).sort()) await db.exec(await readFile(`drizzle/${name}`, 'utf8'));
  const now = Date.now();
  const service = createSocialService(db, () => now);
  const people = [];
  for (let n = 0; n < 5; n++) {
    const user = { id: crypto.randomUUID(), email: `member${n}@example.test`, displayName: `Member ${n}` };
    await db.query('INSERT INTO users VALUES($1,$2,$3,$4,$5,$6)', [user.id, user.email, user.displayName, 'testhash', 'testsalt', now]);
    const state = await service.act(user, { kind: 'profile', profile: { name: user.displayName, hub: n === 4 ? 'Nirma University' : 'Silver Oak University', cohort: n === 3 ? 'adult' : 'teen', bio: 'Hello', interests: ['Photography'], intent: 'Make friends', introvert: false, discoverable: true } });
    people.push({ user, profile: state.me });
  }
  const [a,b,c,adult,otherHub] = people;
  let post;
  await t.test('shared post and comments persist for eligible peers', async () => {
    const state = await service.act(a.user, { kind: 'create', itemKind: 'post', data: { body: 'A real shared photo walk invitation', topic: 'Photography', cover: 'campus' } });
    post = state.items.find(i => i.mine);
    assert.ok((await service.snapshot(b.user)).items.some(i => i.id === post.id));
    await service.act(b.user, { kind: 'comment', id: post.id, body: 'I would love to join.' });
    assert.equal((await service.snapshot(a.user)).items.find(i => i.id === post.id).comments[0].body, 'I would love to join.');
  });
  await t.test('mutations cannot cross hub or age boundaries', async () => {
    for (const person of [adult, otherHub]) {
      assert.equal((await service.snapshot(person.user)).items.length, 0);
      await assert.rejects(service.act(person.user, { kind: 'comment', id: post.id, body: 'Not allowed' }), /unavailable/);
    }
    await assert.rejects(service.act(b.user, { kind: 'delete', id: post.id }), /creator/);
  });
  await t.test('likes are idempotent and saves are private', async () => {
    for (let n=0;n<2;n++) await service.act(b.user, { kind: 'react', id: post.id, reaction: 'like', enabled: true });
    await service.act(b.user, { kind: 'react', id: post.id, reaction: 'save', enabled: true });
    const state = await service.snapshot(a.user);
    assert.equal(state.items.find(i => i.id === post.id).likes, 1);
    assert.equal(state.items.find(i => i.id === post.id).saved, false);
  });
  await t.test('plan capacity includes the host and prevents overbooking', async () => {
    const state = await service.act(a.user, { kind: 'create', itemKind: 'plan', data: { title: 'Two-person study', body: 'One hour together', topic: 'Photography', startsAt: now + 3600_000, place: 'Campus library', capacity: 2 } });
    const plan = state.items.find(i => i.kind === 'plan');
    const results = await Promise.allSettled([b,c].map(p => service.act(p.user, { kind: 'react', id: plan.id, reaction: 'join', enabled: true })));
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal((await service.snapshot(a.user)).items.find(i => i.id === plan.id).members, 2);
  });
  await t.test('circle conversations require membership', async () => {
    const state = await service.act(a.user, { kind: 'create', itemKind: 'circle', data: { title: 'Shutter club', body: 'Walks and photos', topic: 'Photography' } });
    const circle = state.items.find(i => i.kind === 'circle');
    await assert.rejects(service.act(b.user, { kind: 'comment', id: circle.id, body: 'Hi' }), /Join the circle/);
    await service.act(b.user, { kind: 'react', id: circle.id, reaction: 'join', enabled: true });
    assert.ok((await service.act(b.user, { kind: 'comment', id: circle.id, body: 'Now I am a member' })).items.find(i => i.id === circle.id).comments.length);
  });
  await t.test('messages require mutual acceptance', async () => {
    await assert.rejects(service.act(a.user, { kind: 'message', personId: b.profile.id, body: 'Before consent' }), /accepted/);
    await service.act(a.user, { kind: 'request', personId: b.profile.id });
    const request = (await service.snapshot(b.user)).requests.find(r => r.person.id === a.profile.id);
    await assert.rejects(service.act(c.user, { kind: 'respond', id: request.id, accept: true }), /cannot be changed/);
    await service.act(b.user, { kind: 'respond', id: request.id, accept: true });
    await service.act(a.user, { kind: 'message', personId: b.profile.id, body: 'Hello after consent' });
    assert.equal((await service.snapshot(b.user)).messages.at(-1).body, 'Hello after consent');
  });
  await t.test('notifications persist and read state belongs to recipient', async () => {
    assert.ok((await service.snapshot(a.user)).notifications.some(n => !n.read));
    await service.act(a.user, { kind: 'read_notifications' });
    assert.ok((await service.snapshot(a.user)).notifications.every(n => n.read));
  });
  await t.test('private photo bytes are only readable inside the correct audience', async () => {
    const photo = 'data:image/jpeg;base64,' + (await readFile('public/scenes/coffee.jpg')).toString('base64');
    const state = await service.act(a.user, { kind: 'create', itemKind: 'post', data: { body: 'Photo access test', topic: 'Photography', photo } });
    const item = state.items.find(i => i.body === 'Photo access test');
    assert.equal(await service.photo(b.user, item.id), photo);
    assert.equal(item.photo, undefined);
    assert.equal(item.cover, `/api/social/media/${item.id}`);
    await assert.rejects(service.photo(adult.user, item.id), /unavailable/);
  });
  await t.test('age groups cannot be changed after the initial profile', async () => {
    await assert.rejects(service.act(a.user, { kind: 'profile', profile: { ...a.profile, cohort: 'adult' } }), /cannot be changed/);
  });
  await t.test('reciprocal requests cannot create duplicate active connections', async () => {
    const results = await Promise.allSettled([
      service.act(a.user, { kind: 'request', personId: c.profile.id }),
      service.act(c.user, { kind: 'request', personId: a.profile.id }),
    ]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal((await service.snapshot(a.user)).requests.filter(r => r.person.id === c.profile.id && r.state === 'pending').length, 1);
  });
  await t.test('cancelling a plan removes RSVPs and notifies participants', async () => {
    const state = await service.act(c.user, { kind: 'create', itemKind: 'plan', data: { title: 'Cancellation test', body: 'A test plan', topic: 'Books', startsAt: now + 3600_000, place: 'Campus library', capacity: 3 } });
    const plan = state.items.find(i => i.title === 'Cancellation test');
    await service.act(a.user, { kind: 'react', id: plan.id, reaction: 'join', enabled: true });
    await service.act(c.user, { kind: 'delete', id: plan.id });
    const result = await service.snapshot(a.user);
    assert.equal(result.items.some(i => i.id === plan.id), false);
    assert.ok(result.notifications.some(n => n.text.includes('cancelled Cancellation test')));
    assert.equal((await db.query('SELECT count(*) FROM social_reactions WHERE item_id=$1', [plan.id])).rows[0].count, 0);
  });
  await t.test('blocking removes both-way discovery, content and messaging', async () => {
    await service.act(b.user, { kind: 'block', personId: a.profile.id });
    const state = await service.snapshot(a.user);
    assert.ok(!state.people.some(p => p.id === b.profile.id));
    assert.ok(!state.contacts.some(p => p.id === b.profile.id));
    assert.equal((await service.snapshot(b.user)).items.filter(i => i.author.id === a.profile.id).length, 0);
    await assert.rejects(service.act(a.user, { kind: 'message', personId: b.profile.id, body: 'No' }), /unavailable/);
  });
  await t.test('reports are persisted without exposing them in the feed', async () => {
    await service.act(c.user, { kind: 'report', id: post.id, reason: 'Unwanted solicitation' });
    assert.equal((await db.query('SELECT count(*) FROM social_reports')).rows[0].count, 1);
    assert.ok(!('reports' in await service.snapshot(a.user)));
  });
  await db.close();
});
