import { z } from 'zod';
import { hubs, interests, intents } from '../model.ts';
import { places } from './types.ts';

const id = z.string().uuid();
const personId = z.string().regex(/^[a-f0-9]{24}$/);
const photo = z.string().max(350_000).regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=\r\n]+$/).optional();
export const memberInput = z.object({
  name: z.string().trim().min(2).max(40), hub: z.string().refine(v => hubs.includes(v)),
  cohort: z.enum(['teen', 'adult']), bio: z.string().trim().max(240),
  interests: z.array(z.string().refine(v => interests.includes(v))).min(1).max(10).transform(v => [...new Set(v)]),
  intent: z.string().refine(v => intents.includes(v)), introvert: z.boolean(), discoverable: z.boolean(),
});
export const actionInput = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('profile'), profile: memberInput }),
  z.object({ kind: z.literal('create'), itemKind: z.enum(['post', 'circle', 'plan']), data: z.object({
    title: z.string().trim().max(100).optional(), body: z.string().trim().min(1).max(2000),
    topic: z.string().refine(v => interests.includes(v)), cover: z.enum(['campus', 'coffee', 'desk', 'stars']).optional(), photo,
    place: z.string().refine(v => places.includes(v)).optional(), startsAt: z.number().int().optional(),
    capacity: z.number().int().min(2).max(20).optional(),
  }) }),
  z.object({ kind: z.literal('react'), id, reaction: z.enum(['like', 'save', 'join']), enabled: z.boolean() }),
  z.object({ kind: z.literal('comment'), id, body: z.string().trim().min(1).max(500) }),
  z.object({ kind: z.literal('delete'), id }),
  z.object({ kind: z.literal('request'), personId }),
  z.object({ kind: z.literal('respond'), id, accept: z.boolean() }),
  z.object({ kind: z.literal('cancel_request'), id }),
  z.object({ kind: z.literal('message'), personId, body: z.string().trim().min(1).max(1500) }),
  z.object({ kind: z.literal('block'), personId }),
  z.object({ kind: z.literal('report'), id, reason: z.string().trim().min(3).max(500) }),
  z.object({ kind: z.literal('read_notifications') }),
]);
