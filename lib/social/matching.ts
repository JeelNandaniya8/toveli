import type { Member, ProfilePlace } from './types.ts';
export const normalizePlace = (value: string) => value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
export function sharedPlaces(a: Pick<Member, 'places' | 'cohort'>, b: Pick<Member, 'places' | 'cohort'>): ProfilePlace[] {
  if (a.cohort !== b.cohort) return [];
  return (b.places ?? []).filter(p => p.match && !(b.cohort === 'teen' && ['society', 'area'].includes(p.kind)) &&
    a.places?.some(q => q.match && p.kind === q.kind && normalizePlace(p.city) === normalizePlace(q.city) && normalizePlace(p.name) === normalizePlace(q.name)));
}
export function canDiscover(a: Member, b: Member) { return a.cohort === b.cohort && (a.hub === b.hub || sharedPlaces(a, b).length > 0); }
export function matchReasons(a: Member, b: Member) {
  return [...sharedPlaces(a, b).map(p => `Same ${p.kind}: ${p.name}`), ...(a.hub === b.hub ? [`Same community: ${b.hub}`] : []), ...a.interests.filter(i => b.interests.includes(i)).map(i => `Both enjoy ${i}`), ...(a.intent === b.intent ? [`Both here to ${b.intent.toLowerCase()}`] : [])];
}
export function cosine(a: number[], b: number[]) {
  if (!a.length || a.length !== b.length || [...a, ...b].some(n => !Number.isFinite(n))) return 0;
  const norm = Math.sqrt(a.reduce((s,n) => s+n*n,0) * b.reduce((s,n) => s+n*n,0));
  return norm ? Math.max(-1, Math.min(1, a.reduce((s,n,i) => s+n*b[i],0)/norm)) : 0;
}
// No names, addresses, affiliations or private conversations enter the embedding model.
export function interestText(p: Member) { return `Interests: ${p.interests.join(', ')}. Goal: ${p.intent}.`; }
export function rankScore(a: Member, b: Member, similarity?: number) {
  const overlap = a.interests.filter(i => b.interests.includes(i)).length / Math.max(1, new Set([...a.interests, ...b.interests]).size);
  return .5 * (similarity === undefined ? overlap : Math.max(0, similarity)) + .3 * (sharedPlaces(a,b).length ? 1 : a.hub === b.hub ? .7 : 0) + .2 * Number(a.intent === b.intent);
}
