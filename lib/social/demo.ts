import { actionInput } from './validation';
import type { Member, SocialSnapshot, SocialItem } from './types';

const person = (n: number, name: string, interests: string[], bio: string, intent = 'Make friends'): Member => ({
  id: n.toString(16).padStart(24, '0'), name, interests, bio, intent,
  hub: 'Nirma University', cohort: 'teen', introvert: false, discoverable: true,
});
export function demoSnapshot(): SocialSnapshot {
  const now = Date.now();
  const me = person(1, 'Sam Patel', ['Photography', 'Design', 'Books'], 'Collecting little moments. Always up for a good conversation.');
  const people = [
    person(2, 'Aarav Shah', ['Photography', 'Outdoors', 'Design'], 'Taking the scenic route, usually with a camera. Let’s make something worth remembering.'),
    person(3, 'Isha Patel', ['Books', 'Writing', 'Music'], 'Currently between a good book and my next playlist.', 'Study together'),
    person(4, 'Dev Mehta', ['Coding', 'Design', 'Gaming'], 'Small projects, big curiosity. Looking for people to build with.', 'Build something'),
    person(5, 'Diya Joshi', ['Photography', 'Astronomy', 'Outdoors'], 'Looking up more. Phone cameras and beginner questions welcome.'),
    person(6, 'Riya Desai', ['Design', 'Writing', 'Music'], 'Sketchbooks, indie music, and ideas that start on a napkin.', 'Create together'),
  ];
  const item = (n: number, kind: SocialItem['kind'], author: Member, body: string, extra: Partial<SocialItem>): SocialItem => ({
    id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, kind, author, body,
    topic: 'Photography', createdAt: now - n * 600_000, mine: false, liked: false, saved: false,
    joined: false, likes: 0, members: 0, comments: [], ...extra,
  });
  return {
    now, me, account: { name: me.name }, people, items: [
      item(1, 'post', people[0], 'The best part of campus is the part you haven’t noticed yet. A few of us are taking the long way home this week. Bring your camera. Or just your curiosity. 🌿', { cover: 'campus', likes: 24, comments: [{ id: crypto.randomUUID(), author: people[3], body: 'Phone camera gang, I’m in 🙋', createdAt: now - 240_000 }] }),
      item(2, 'post', people[1], 'What’s one book you wish you could read again for the first time? Building a little reading list for the weekend. 📚', { topic: 'Books', likes: 12, comments: [] }),
      item(3, 'post', people[4], 'An afternoon with no agenda. Just coffee, a sketchbook, and a few ideas that might become something.', { topic: 'Design', cover: 'coffee', likes: 18, saved: true }),
      item(4, 'circle', people[0], 'A little community for seeing ordinary things differently. Photo walks, weekly prompts, and plenty of beginner questions.', { title: 'The Shutter Club', topic: 'Photography', cover: 'campus', members: 8, joined: true, comments: [{ id: crypto.randomUUID(), author: people[0], body: 'This week’s prompt: something you walk past every day. Share what you notice!', createdAt: now - 3_600_000 }] }),
      item(5, 'circle', people[1], 'Good books are better with good company. Bring whatever you’re reading; there’s no homework here.', { title: 'One More Chapter', topic: 'Books', cover: 'coffee', members: 6 }),
      item(6, 'circle', people[2], 'Ship a small project. Learn from each other. A low-pressure space for people who like making things.', { title: 'The Sunday Build', topic: 'Coding', cover: 'desk', members: 5 }),
      item(7, 'circle', people[3], 'For the people who always stop to look up. Talk astronomy, share discoveries, and find a bigger perspective.', { title: 'After the Stars', topic: 'Astronomy', cover: 'stars', members: 4, joined: true }),
      item(8, 'plan', people[0], 'A relaxed walk around the garden to notice the little things. We’ll meet at the main entrance. Any camera, any experience level.', { title: 'Golden hour, good company', cover: 'campus', place: 'Main campus garden', startsAt: now + 86_400_000, capacity: 8, members: 5 }),
      item(9, 'plan', people[4], 'Bring your sketchbook or borrow a page. We’ll trade ideas over a coffee and draw whatever comes to mind.', { title: 'Coffee & a blank page', topic: 'Design', cover: 'coffee', place: 'Campus café', startsAt: now + 172_800_000, capacity: 6, members: 3, joined: true }),
      item(10, 'plan', people[2], 'One hour to work on that side project you keep thinking about. Come with an idea, leave with a first step.', { title: 'A little co-working session', topic: 'Coding', cover: 'desk', place: 'Campus library', startsAt: now + 259_200_000, capacity: 5, members: 2 }),
    ],
    requests: [{ id: crypto.randomUUID(), direction: 'incoming', state: 'pending', person: people[3] }, { id: crypto.randomUUID(), direction: 'outgoing', state: 'accepted', person: people[0] }],
    contacts: [people[0]],
    messages: [{ id: crypto.randomUUID(), personId: people[0].id, fromMe: false, body: 'Hey! Saw you joined The Shutter Club. What do you like taking photos of?', createdAt: now - 3_600_000 }],
    notifications: [{ id: crypto.randomUUID(), text: 'Diya Joshi would like to connect with you.', target: '/messages', read: false, createdAt: now - 1_800_000 }],
  };
}

// Demo-only reducer. No demo content is ever written to the live database.
export function demoAction(current: SocialSnapshot, raw: unknown): SocialSnapshot {
  const action = actionInput.parse(raw);
  const next = structuredClone(current);
  const me = next.me!;
  const now = Date.now(); next.now = now;
  if (action.kind === 'profile') {
    next.me = { ...me, ...action.profile }; next.account.name = action.profile.name;
    next.items.forEach(i => { if (i.mine) i.author = next.me!; });
  } else if (action.kind === 'create') {
    if (action.itemKind !== 'post' && !action.data.title) throw new Error('Add a title first.');
    if (action.itemKind === 'plan' && (!action.data.startsAt || action.data.startsAt < now + 60_000)) throw new Error('Choose a future date and time.');
    next.items.unshift({ ...action.data, cover: action.data.photo ?? action.data.cover, id: crypto.randomUUID(), kind: action.itemKind, author: me, createdAt: now, mine: true, liked: false, saved: false, joined: action.itemKind !== 'post', likes: 0, members: action.itemKind === 'post' ? 0 : 1, comments: [] });
  } else if (action.kind === 'read_notifications') {
    next.notifications.forEach(n => { n.read = true; });
  } else if (action.kind === 'request') {
    const person = next.people.find(p => p.id === action.personId);
    if (!person) throw new Error('Member unavailable.');
    if (next.requests.some(r => r.person.id === person.id && ['pending', 'accepted'].includes(r.state))) throw new Error('You already have a connection or a pending request.');
    next.requests.unshift({ id: crypto.randomUUID(), direction: 'outgoing', state: 'pending', person });
  } else if (action.kind === 'respond' || action.kind === 'cancel_request') {
    const r = next.requests.find(r => r.id === action.id);
    if (!r) throw new Error('Request unavailable.');
    r.state = action.kind === 'cancel_request' ? 'cancelled' : action.accept ? 'accepted' : 'declined';
    if (r.state === 'accepted') next.contacts.push(r.person);
  } else if (action.kind === 'message') {
    if (!next.contacts.some(p => p.id === action.personId)) throw new Error('Connect before sending a message.');
    next.messages.push({ id: crypto.randomUUID(), personId: action.personId, body: action.body, fromMe: true, createdAt: now });
  } else if (action.kind === 'block') {
    next.people = next.people.filter(p => p.id !== action.personId);
    next.contacts = next.contacts.filter(p => p.id !== action.personId);
    next.messages = next.messages.filter(m => m.personId !== action.personId);
    next.requests = next.requests.filter(r => r.person.id !== action.personId);
    next.items = next.items.filter(i => i.author.id !== action.personId);
  } else if ('id' in action) {
    const item = next.items.find(i => i.id === action.id);
    if (!item) throw new Error('This item is unavailable.');
    if (action.kind === 'delete') {
      if (!item.mine) throw new Error('Only the creator can remove this.');
      next.items = next.items.filter(i => i.id !== item.id);
    } else if (action.kind === 'comment') {
      if (item.kind === 'circle' && !item.joined) throw new Error('Join the circle first.');
      item.comments.push({ id: crypto.randomUUID(), author: me, body: action.body, createdAt: now });
    } else if (action.kind === 'react') {
      const enabled = action.enabled;
      if (action.reaction === 'like' && enabled !== item.liked) { item.liked = enabled; item.likes += enabled ? 1 : -1; }
      if (action.reaction === 'save') item.saved = enabled;
      if (action.reaction === 'join' && enabled !== item.joined) {
        if (item.mine && !enabled) throw new Error('You host this activity. Use the menu to cancel it.');
        if (enabled && item.kind === 'plan' && item.members >= (item.capacity ?? 20)) throw new Error('This plan is full.');
        item.joined = enabled; item.members += enabled ? 1 : -1;
      }
    }
  }
  return next;
}
