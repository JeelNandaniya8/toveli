export type Member = {
  id: string; name: string; hub: string; cohort: 'teen' | 'adult'; bio: string;
  interests: string[]; intent: string; introvert: boolean; discoverable: boolean;
};
export type ItemKind = 'post' | 'circle' | 'plan';
export type ItemData = {
  title?: string; body: string; topic: string; cover?: string; photo?: string;
  place?: string; startsAt?: number; capacity?: number;
};
export type Comment = { id: string; author: Member; body: string; createdAt: number };
export type SocialItem = ItemData & {
  id: string; kind: ItemKind; author: Member; createdAt: number; mine: boolean;
  liked: boolean; saved: boolean; joined: boolean; likes: number; members: number;
  comments: Comment[];
};
export type Connection = { id: string; direction: 'incoming' | 'outgoing'; state: string; person: Member };
export type ChatMessage = { id: string; personId: string; fromMe: boolean; body: string; createdAt: number };
export type Activity = { id: string; text: string; target: string; read: boolean; createdAt: number };
export type SocialSnapshot = {
  now: number; me: Member | null; account: { name: string }; people: Member[]; items: SocialItem[];
  requests: Connection[]; contacts: Member[]; messages: ChatMessage[]; notifications: Activity[];
};
export type View = 'feed' | 'radar' | 'circles' | 'plans' | 'chat' | 'profile' | 'onboard' | 'settings' | 'saved' | 'notifications';
export type SocialAction = Record<string, unknown> & { kind: string };
export const places = ['Campus library', 'Campus café', 'Student activity centre', 'Main campus garden'];
export const covers = [
  { id: 'campus', label: 'Outside together', src: '/campus.jpg' },
  { id: 'coffee', label: 'Coffee & conversation', src: '/scenes/coffee.jpg' },
  { id: 'desk', label: 'Make something', src: '/scenes/desk.jpg' },
  { id: 'stars', label: 'A bigger perspective', src: '/scenes/stars.jpg' },
];
export function coverSrc(value?: string) {
  if (value?.startsWith('/api/social/media/') || value?.startsWith('data:image/jpeg;base64,')) return value;
  return covers.find(cover => cover.id === value)?.src;
}
export function sharedInterests(a: Member, b: Member) { return a.interests.filter(topic => b.interests.includes(topic)); }
