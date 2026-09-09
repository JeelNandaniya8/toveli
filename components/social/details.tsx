/* eslint-disable @next/next/no-img-element -- Local covers are precompressed; private media must retain same-origin session cookies. */
'use client';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Bookmark, CalendarPlus, Check, MapPin, MessageCircle, Send, Shield, UserPlus, Users } from 'lucide-react';
import { coverSrc, sharedInterests, type Member, type SocialItem, type SocialSnapshot, type SocialAction } from '@/lib/social/types';
import { Avatar, Modal, Tag, planDate, relativeTime } from './ui';
import { JoinButton, ItemMenu, type CardActions } from './cards';

export function downloadCalendar(item: SocialItem) {
  const escape = (text: string) => text.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll(',', '\\,').replaceAll(';', '\\;').replaceAll('\r', '');
  const stamp = (time: number) => new Date(time).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Toveli//Campus Plans//EN', 'BEGIN:VEVENT', `UID:${item.id}@toveli`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(item.startsAt!)}`, `DTEND:${stamp(item.startsAt! + 3_600_000)}`, `SUMMARY:${escape(item.title || 'Toveli plan')}`, `DESCRIPTION:${escape(item.body + '\nSuggested duration: one hour. Confirm with your host.')}`, `LOCATION:${escape(item.place || '')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'toveli-plan.ics'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ItemDetail({ item, actions, onClose }: { item: SocialItem; actions: CardActions; onClose: () => void }) {
  const [body, setBody] = useState('');
  const canComment = item.kind !== 'circle' || item.joined;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await actions.mutate({ kind: 'comment', id: item.id, body }, 'Your reply is shared.')) setBody('');
  }
  return <Modal title={item.title || 'A moment, shared.'} onClose={onClose} wide>
    {coverSrc(item.cover) && <img className="tv-detail-cover" src={coverSrc(item.cover)} alt={item.kind === 'post' ? `Image shared by ${item.author.name}` : 'Activity cover'}/>}
    <div className="tv-detail-body"><div className="tv-row between"><div className="tv-row"><Avatar person={item.author}/><div><strong>{item.author.name}</strong><small className="tv-block tv-muted">{item.kind === 'post' ? relativeTime(item.createdAt) : 'Your host'} · {item.author.hub}</small></div></div><ItemMenu item={item} actions={actions}/></div><div className="tv-spaced"><Tag>{item.topic}</Tag><p className="tv-preserve">{item.body}</p></div>
      {item.kind === 'plan' && <div className="tv-event-info"><span><CalendarPlus/>{planDate(item.startsAt)}</span><span><MapPin/>{item.place}</span><span><Users/>{item.members} going · {Math.max(0, (item.capacity ?? 20) - item.members)} spaces left</span></div>}
      {item.kind === 'circle' && <p className="tv-small"><Users size={17}/>{item.members} members · A shared space for {item.topic.toLowerCase()}</p>}
      <div className="tv-row tv-detail-buttons">{item.kind !== 'post' && <JoinButton item={item} actions={actions}/>}<button className="tv-btn secondary" disabled={actions.busy} onClick={() => void actions.mutate({ kind: 'react', id: item.id, reaction: 'save', enabled: !item.saved }, item.saved ? 'Removed from saved.' : 'Saved for later.')}><Bookmark size={17} fill={item.saved ? 'currentColor' : 'none'}/>{item.saved ? 'Saved' : 'Save'}</button>{item.kind === 'plan' && <button className="tv-btn secondary" onClick={() => downloadCalendar(item)}><CalendarPlus size={17}/>Add to calendar</button>}</div>
      {item.kind === 'plan' && <p className="tv-note"><Shield size={16}/>Meet in the public place listed above. Let someone you trust know your plans.</p>}
      <section className="tv-discussion"><h3>{item.kind === 'circle' ? 'The circle conversation' : 'Conversation'}<span>{item.comments.length}</span></h3>
        {item.comments.length ? <div className="tv-comment-list">{item.comments.map(comment => <div className="tv-comment" key={comment.id}><Avatar person={comment.author} size="sm"/><div><div className="tv-row"><strong>{comment.author.name}</strong><small>{relativeTime(comment.createdAt)}</small></div><p>{comment.body}</p></div></div>)}</div> : <p className="tv-muted">No replies yet. A small hello is a good place to start.</p>}
        {canComment ? <form className="tv-reply-form" onSubmit={submit}><label className="tv-sr-only" htmlFor="reply">Your reply</label><input id="reply" value={body} onChange={e => setBody(e.target.value)} required maxLength={500} placeholder="Add to the conversation…"/><button className="tv-icon-btn primary" aria-label="Send reply" disabled={actions.busy || !body.trim()}><Send size={18}/></button></form> : <p className="tv-note">Join this circle to add to the conversation.</p>}
      </section>
    </div>
  </Modal>;
}
export function PersonDetail({ person, data, mutate, busy, onClose, message, block }: { person: Member; data: SocialSnapshot; mutate: (a: SocialAction, msg?: string) => Promise<boolean>; busy: boolean; onClose: () => void; message: (id: string) => void; block: (p: Member) => void }) {
  const shared = data.me ? sharedInterests(data.me, person) : [];
  const connected = data.contacts.some(p => p.id === person.id);
  const request = data.requests.find(r => r.person.id === person.id && r.state === 'pending');
  const mine = data.me?.id === person.id;
  return <Modal title={mine ? 'A little about you.' : 'A familiar wavelength.'} onClose={onClose}><div className="tv-person-detail"><div className="tv-profile-pattern"/><Avatar person={person} size="xl"/><h2>{person.name}</h2><p className="tv-small"><MapPin size={15}/>{person.hub}</p><p className="tv-person-bio">{person.bio || 'Still finding the words. Start with a shared interest.'}</p><div className="tv-tags">{person.interests.map(t => <Tag key={t} tint={shared.includes(t) ? 'green' : ''}>{t}</Tag>)}</div>
    <div className="tv-compatibility"><span className="tv-eyebrow">WHY YOU MIGHT GET ALONG</span><p>{shared.length ? `You both enjoy ${shared.join(', ')}.` : 'You share a campus. Try getting to know a different perspective.'} {person.intent === data.me?.intent ? `You’re both here to ${person.intent.toLowerCase()}.` : `${person.name.split(' ')[0]} is here to ${person.intent.toLowerCase()}.`}</p><small>Based on interests you chose. Shared interests are a starting point, not a prediction.</small></div>
    {person.introvert && <p className="tv-note">Prefers a slower start. A short message is welcome; quick replies aren’t expected.</p>}
    {!mine && <div className="tv-person-cta">{connected ? <button className="tv-btn primary" onClick={() => message(person.id)}><MessageCircle size={18}/>Say hello</button> : request ? request.direction === 'incoming' ? <><button className="tv-btn primary" disabled={busy} onClick={() => void mutate({ kind: 'respond', id: request.id, accept: true }, 'Connected. You can now message each other.')}><Check size={18}/>Accept connection</button><button className="tv-btn secondary" disabled={busy} onClick={() => void mutate({ kind: 'respond', id: request.id, accept: false }, 'Request declined.')}>Decline</button></> : <button className="tv-btn secondary" disabled={busy} onClick={() => void mutate({ kind: 'cancel_request', id: request.id }, 'Request cancelled.')}><Check size={18}/>Request sent · Undo</button> : <button className="tv-btn primary" disabled={busy || !person.discoverable} onClick={() => void mutate({ kind: 'request', personId: person.id }, 'Connection request sent. They can choose when to respond.')}><UserPlus size={18}/>Let’s connect</button>}<button className="tv-text-btn muted" onClick={() => block(person)}>Block member<ArrowUpRight size={14}/></button></div>}
  </div></Modal>;
}
