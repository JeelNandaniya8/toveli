import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createSocialService } from '../lib/social/service.ts';
import { canDiscover, cosine, interestText, rankScore } from '../lib/social/matching.ts';

test('shared places respect opt-in, age, city and residential privacy', async () => {
  const db = new PGlite();
  try {
    for (const file of (await readdir('drizzle')).filter(f => f.endsWith('.sql')).sort()) await db.exec(await readFile(`drizzle/${file}`, 'utf8'));
    const service = createSocialService(db);
    const place = (kind, name, match = true, city = 'Ahmedabad') => ({ kind, name, match, city });
    async function make(n, cohort, hub, places) {
      const user = { id: crypto.randomUUID(), email: `places${n}@example.test`, displayName: `Person ${n}` };
      await db.query('INSERT INTO users VALUES($1,$2,$3,$4,$5,$6)', [user.id,user.email,user.displayName,'hash','salt',Date.now()]);
      const profile = { name: user.displayName, hub, cohort, places, bio: '', interests: ['Coding'], intent: 'Build something', introvert: false, discoverable: true };
      const state = await service.act(user, { kind: 'profile', profile });
      return { user, profile: state.me };
    }
    const a = await make(1,'adult','Silver Oak University',[place('workplace','Studio A'),place('society','Private Home',false)]);
    const b = await make(2,'adult','Nirma University',[place('workplace','  studio   a  '),place('society','Never reveal this',false)]);
    const c = await make(3,'adult','Nirma University',[place('workplace','Studio A',false)]);
    const d = await make(4,'adult','Nirma University',[place('workplace','Studio A',true,'Surat')]);
    const teen = await make(5,'teen','Nirma University',[place('workplace','Studio A'),place('society','Private Home')]);
    const state = await service.snapshot(a.user);
    assert.ok(state.people.some(p => p.id === b.profile.id));
    for (const p of [c,d,teen]) assert.ok(!state.people.some(x => x.id === p.profile.id));
    assert.deepEqual(state.people.find(p => p.id === b.profile.id).places.map(p => p.kind), ['workplace']);
    assert.ok(!JSON.stringify(state).includes('Never reveal this'));
    assert.equal(teen.profile.places.find(p => p.kind === 'society').match,false);
    // New discovery does not silently widen the audience of existing campus posts.
    const posted = await service.act(b.user,{kind:'create',itemKind:'post',data:{body:'Campus-only post',topic:'Coding'}});
    assert.equal((await service.snapshot(a.user)).items.length,0);
    await assert.rejects(service.photo(a.user,posted.items[0].id),/unavailable/);
    for (let i=0;i<2;i++) await service.act(a.user,{kind:'follow',personId:b.profile.id,enabled:true});
    assert.deepEqual((await service.snapshot(a.user)).following,[b.profile.id]);
    assert.deepEqual((await service.snapshot(b.user)).followers,[a.profile.id]);
    await assert.rejects(service.act(a.user,{kind:'message',personId:b.profile.id,body:'No consent yet'}),/accepted/);
    await assert.rejects(service.act(a.user,{kind:'follow',personId:teen.profile.id,enabled:true}),/unavailable/);
    await service.act(a.user,{kind:'follow',personId:b.profile.id,enabled:false});
    assert.deepEqual((await service.snapshot(a.user)).following,[]);
    await service.act(a.user,{kind:'follow',personId:b.profile.id,enabled:true});
    await service.act(b.user,{kind:'block',personId:a.profile.id});
    assert.deepEqual((await service.snapshot(a.user)).following,[]);
    assert.equal((await db.query('SELECT count(*) FROM social_follows')).rows[0].count,0);
  } finally { await db.close(); }
});

test('ranking is bounded and model inputs exclude identity and places', () => {
  const a = { id:'one',name:'Private Name',bio:'Private biography',hub:'Nirma University',cohort:'teen',interests:['Coding'],intent:'Build something',places:[] };
  const b = { ...a, id:'two', cohort:'adult' };
  assert.equal(canDiscover(a,b),false);
  assert.equal(cosine([1,0],[1,0]),1);
  assert.equal(cosine([0,0],[1,0]),0);
  assert.equal(cosine([NaN],[1]),0);
  assert.ok(rankScore(a,a,1) <= 1);
  assert.equal(interestText(a),'Interests: Coding. Goal: Build something.');
});
