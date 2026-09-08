import {env} from 'cloudflare:workers';
import {getCurrentUser} from '../../auth';
const reply=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
// Conservative server reservations, not a claim to measure attention. One active five-second lease per account.
export async function GET(){const u=await getCurrentUser();if(!u)return reply({error:'Sign in first.'},401);try{const day=new Date().toISOString().slice(0,10);const r=await env.DB.prepare('SELECT used,lease_until FROM budgets WHERE owner=? AND day=?').bind(u.email,day).first<{used:number;lease_until:number}>();return reply({used:r?.used||0,cap:1200,day});}catch{return reply({error:'Video budget unavailable.'},503);}}
export async function POST(req:Request){const u=await getCurrentUser();if(!u)return reply({error:'Sign in first.'},401);if(req.headers.get('origin')!==new URL(req.url).origin)return reply({error:'Request origin rejected.'},403);try{const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
const r=await env.DB.prepare('INSERT INTO budgets (owner,day,used,lease_until) VALUES (?,?,5,?) ON CONFLICT(owner,day) DO UPDATE SET used=used+5,lease_until=excluded.lease_until WHERE used<=1195 AND lease_until<=? RETURNING used,lease_until').bind(u.email,day,now+5000,now).first<{used:number;lease_until:number}>();
if(!r)return reply({error:'Daily limit reached or another short is already playing.'},409);return reply({used:r.used,cap:1200,leaseUntil:r.lease_until});}catch{return reply({error:'Shorts are paused because your budget could not be checked.'},503);}}
