import test from 'node:test';
import assert from 'node:assert/strict';
import {rankPeople,defaultProfile} from '../lib/model.ts';
test('cohort and block eligibility precede scoring',()=>{
 const people=rankPeople(defaultProfile,['aarav']);
 assert.ok(people.every(p=>p.cohort==='teen'&&p.id!=='aarav'));
 assert.ok(rankPeople({...defaultProfile,cohort:'adult'}).every(p=>p.cohort==='adult'));
});
test('onboarding changes ranking and scores are honest',()=>{
 const initial=rankPeople(defaultProfile);
 assert.equal(initial[0].id,'aarav');
 const next=rankPeople({...defaultProfile,interests:['Books','Philosophy','Writing','Music'],intent:'Study together'});
 assert.equal(next[0].id,'isha');
 assert.ok(initial.every(p=>p.score>=0&&p.score<=100));
 assert.equal(rankPeople({...defaultProfile,interests:[]})[0].breakdown.interest,0);
});
