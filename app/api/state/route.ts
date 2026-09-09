import { sameOrigin } from '@/lib/http';
import { getCurrentUser } from '../../auth';
import {getDb} from '@/db';
import {records} from '@/db/schema';
import {and,eq} from 'drizzle-orm';
import {z} from 'zod';
import {defaultProfile,rankPeople,interests,intents,hubs,people,circles} from '@/lib/model';
const profileSchema=z.object({name:z.string().trim().min(1).max(40),hub:z.string().refine(v=>hubs.includes(v)),interests:z.array(z.string().refine(v=>interests.includes(v))).min(1).max(10).transform(v=>[...new Set(v)]),intent:z.string().refine(v=>intents.includes(v)),introvert:z.boolean(),behavior:z.literal(false),cohort:z.enum(['teen','adult'])});
const actionSchema=z.discriminatedUnion('kind',[
z.object({kind:z.literal('profile'),data:profileSchema}),
z.object({kind:z.enum(['save','like']),id:z.string().min(1).max(80),enabled:z.boolean()}),
z.object({kind:z.enum(['request','block']),id:z.string().refine(v=>people.some(p=>p.id===v)),enabled:z.boolean()}),
z.object({kind:z.literal('circle'),id:z.string().refine(v=>circles.some(p=>p.id===v)),enabled:z.boolean()}),
z.object({kind:z.literal('post'),text:z.string().trim().min(1).max(1200),tag:z.string().refine(v=>interests.includes(v))}),
z.object({kind:z.literal('pulse'),text:z.string().trim().min(1).max(80)}),
z.object({kind:z.literal('remove_pulse')}),
z.object({kind:z.literal('plan'),title:z.string().trim().min(3).max(100),place:z.enum(['Campus library','Campus café','Student activity centre']),date:z.string().datetime(),size:z.number().int().min(3).max(12)}),
z.object({kind:z.literal('draft'),id:z.string().refine(v=>people.some(p=>p.id===v)),text:z.string().max(1500)}),
z.object({kind:z.literal('report'),id:z.string().max(80),text:z.string().trim().min(3).max(500)}),
z.object({kind:z.literal('delete'),id:z.string().regex(/^(post|plan):[a-f0-9-]+$/)})]);
async function snapshot(owner:string){const rows=await getDb().select().from(records).where(eq(records.owner,owner));const data=Object.fromEntries(rows.map(r=>[r.key,JSON.parse(r.value)]));const profile=data.profile||defaultProfile;const blocked=rows.filter(r=>r.key.startsWith('block:')).map(r=>r.key.slice(6));return {data,profile,matches:rankPeople(profile,blocked)};}
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){const u=await getCurrentUser();if(!u)return json({error:'Sign in to open your private alpha.'},401);try{return json(await snapshot(u.email));}catch{return json({error:'Your workspace could not load. Please retry.'},503);}}
export async function POST(request:Request){const u=await getCurrentUser();if(!u)return json({error:'Sign in first.'},401);if(!sameOrigin(request))return json({error:'Request origin rejected.'},403);try{
if(Number(request.headers.get('content-length')||0)>10000)return json({error:'Request too large.'},413);
const raw=await request.text();if(raw.length>10000)return json({error:'Request too large.'},413);const a=actionSchema.parse(JSON.parse(raw));const db=getDb();let key='',value:unknown=a;
if(a.kind==='profile'){key='profile';value=a.data;}
else if(a.kind==='pulse'){key='pulse';value={text:a.text,expiresAt:Date.now()+24*60*60*1000};}
else if(a.kind==='remove_pulse'){await db.delete(records).where(and(eq(records.owner,u.email),eq(records.key,'pulse')));return json(await snapshot(u.email));}
else if(a.kind==='post'||a.kind==='plan'){key=a.kind+':'+crypto.randomUUID();if(a.kind==='plan'&&(Date.parse(a.date)<Date.now()||Date.parse(a.date)>Date.now()+90*86400000))return json({error:'Choose a time within the next 90 days.'},400);}
else if(a.kind==='report'){key='report:'+crypto.randomUUID();}
else if(a.kind==='delete'){await db.delete(records).where(and(eq(records.owner,u.email),eq(records.key,a.id)));return json(await snapshot(u.email));}
else {key=a.kind+':'+a.id;if('enabled'in a&&!a.enabled){await db.delete(records).where(and(eq(records.owner,u.email),eq(records.key,key)));return json(await snapshot(u.email));}}
await db.insert(records).values({owner:u.email,key,value:JSON.stringify(value),created:Date.now()}).onConflictDoUpdate({target:[records.owner,records.key],set:{value:JSON.stringify(value)}});
return json(await snapshot(u.email));
}catch(e){return json({error:e instanceof z.ZodError?'Check your entries and try again.':'Unable to save. Please retry.'},e instanceof z.ZodError?400:503);}}
