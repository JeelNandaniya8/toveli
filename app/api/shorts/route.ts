import {getCurrentUser} from '../../auth';
import {getDb} from '@/db';
import {budgets} from '@/db/schema';
import {and,eq,sql} from 'drizzle-orm';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
// Conservative server reservations, not a claim to measure attention. One active five-second lease per account.
export async function GET(){const u=await getCurrentUser();if(!u)return reply({error:'Sign in first.'},401);try{const day=new Date().toISOString().slice(0,10);const r=(await getDb().select().from(budgets).where(and(eq(budgets.owner,u.email),eq(budgets.day,day))).limit(1))[0];return reply({used:r?.used||0,cap:1200,day});}catch{return reply({error:'Video budget unavailable.'},503);}}
export async function POST(req:Request){const u=await getCurrentUser();if(!u)return reply({error:'Sign in first.'},401);if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Request origin rejected.'},403);try{const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
const rows=await getDb().execute(sql`INSERT INTO budgets (owner,day,used,lease_until) VALUES (${u.email},${day},5,${now+5000}) ON CONFLICT(owner,day) DO UPDATE SET used=budgets.used+5,lease_until=EXCLUDED.lease_until WHERE budgets.used<=1195 AND budgets.lease_until<=${now} RETURNING used,lease_until`);
const r=rows[0] as {used:number;lease_until:number}|undefined;if(!r)return reply({error:'Daily limit reached or another short is already playing.'},409);return reply({used:Number(r.used),cap:1200,leaseUntil:Number(r.lease_until)});}catch{return reply({error:'Shorts are paused because your budget could not be checked.'},503);}}
