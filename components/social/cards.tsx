/* eslint-disable @next/next/no-img-element -- Local covers are precompressed; private media must retain same-origin session cookies. */
'use client';
import { ArrowUpRight, Bookmark, CalendarDays, Check, Flag, Heart, MapPin, MessageCircle, MoreHorizontal, Share2, Trash2, Users, ArrowRight } from 'lucide-react';
import type { Member, SocialAction, SocialItem } from '@/lib/social/types';
import { coverSrc } from '@/lib/social/types';
import { Avatar, Tag, relativeTime, planDate } from './ui';

export type CardActions = {
  now: number; mutate: (a: SocialAction, message?: string) => Promise<boolean>; busy: boolean;
  openItem: (item: SocialItem) => void; openPerson: (person: Member) => void;
  share: (item: SocialItem) => void; manage: (item: SocialItem, action: 'report' | 'delete') => void;
};
export function ItemMenu({ item, actions }: { item: SocialItem; actions: CardActions }) {
  return <details className="tv-menu"><summary aria-label={`Options for ${item.title || 'post by ' + item.author.name}`}><MoreHorizontal size={20}/></summary><div>
    <button onClick={e => { e.currentTarget.closest('details')?.removeAttribute('open'); actions.share(item); }}><Share2 size={16}/>Copy link</button>
    <button onClick={e => { e.currentTarget.closest('details')?.removeAttribute('open'); actions.manage(item, item.mine ? 'delete' : 'report'); }}>{item.mine ? <Trash2 size={16}/> : <Flag size={16}/>} {item.mine ? (item.kind === 'plan' ? 'Cancel plan' : 'Delete') : 'Report'}</button>
  </div></details>;
}
export function PostCard({ item, actions }: { item: SocialItem; actions: CardActions }) {
  const image = coverSrc(item.cover);
  return <article className="tv-card tv-post" id={`post-${item.id}`}>
    <header className="tv-post-author"><Avatar person={item.author} onClick={() => actions.openPerson(item.author)}/><div><button className="tv-person-name" onClick={() => actions.openPerson(item.author)}>{item.author.name}</button><span>{relativeTime(item.createdAt)}<b>·</b>{item.author.hub}</span></div><ItemMenu item={item} actions={actions}/></header>
    <div className="tv-post-body"><Tag>{item.topic}</Tag><p>{item.body}</p></div>
    {image && <button className="tv-post-image" aria-label="Open post and conversation" onClick={() => actions.openItem(item)}><img src={image} alt={item.photo || item.cover?.startsWith('/api/') ? `Photo shared by ${item.author.name}` : `${item.topic} inspiration`} loading="lazy"/></button>}
    <footer className="tv-post-actions">
      <button className={item.liked ? 'liked' : ''} aria-pressed={item.liked} aria-label={`${item.liked ? 'Unlike' : 'Like'} post`} disabled={actions.busy} onClick={() => void actions.mutate({ kind: 'react', id: item.id, reaction: 'like', enabled: !item.liked })}><Heart size={20} fill={item.liked ? 'currentColor' : 'none'}/><span>{item.likes || 'Like'}</span></button>
      <button onClick={() => actions.openItem(item)} aria-label="Open comments"><MessageCircle size={20}/><span>{item.comments.length || 'Reply'}</span></button>
      <button onClick={() => actions.share(item)} aria-label="Share post"><Share2 size={19}/></button>
      <button className={item.saved ? 'saved' : ''} aria-pressed={item.saved} aria-label={item.saved ? 'Unsave post' : 'Save post'} disabled={actions.busy} onClick={() => void actions.mutate({ kind: 'react', id: item.id, reaction: 'save', enabled: !item.saved }, item.saved ? 'Removed from saved.' : 'Saved for another day.')}><Bookmark size={20} fill={item.saved ? 'currentColor' : 'none'}/></button>
    </footer>
    <button className="tv-comment-prompt" onClick={() => actions.openItem(item)}><span>There’s a conversation here. Join in.</span><ArrowUpRight size={16}/></button>
  </article>;
}
export function JoinButton({ item, actions, small = false }: { item: SocialItem; actions: CardActions; small?: boolean }) {
  const full = item.kind === 'plan' && item.members >= (item.capacity ?? 20);
  const ended = item.kind === 'plan' && (item.startsAt ?? 0) <= actions.now;
  return <button className={`tv-btn ${item.joined ? 'secondary' : 'primary'} ${small ? 'small' : ''}`} disabled={actions.busy || (!item.joined && (full || ended))} onClick={() => {
    if (item.mine) { actions.openItem(item); return; }
    void actions.mutate({ kind: 'react', id: item.id, reaction: 'join', enabled: !item.joined }, item.joined ? `You left the ${item.kind}.` : item.kind === 'plan' ? 'You’re going! Find it in your plans.' : 'You’re in. Say hello to your circle.');
  }}>{item.mine ? 'You’re hosting' : item.joined ? <><Check size={16}/>{item.kind === 'plan' ? 'Going' : 'Joined'}</> : ended ? 'Finished' : full ? 'Full' : item.kind === 'plan' ? <>Join plan<ArrowUpRight size={16}/></> : <>Join circle<ArrowRight size={16}/></>}</button>;
}
export function CircleCard({ item, actions }: { item: SocialItem; actions: CardActions }) {
  return <article className="tv-card tv-circle-card"><button className="tv-circle-cover" onClick={() => actions.openItem(item)} aria-label={`Open ${item.title}`}><img src={coverSrc(item.cover) || '/scenes/desk.jpg'} alt="" loading="lazy"/><Tag>{item.topic}</Tag></button><div className="tv-circle-content"><div className="tv-row between"><span className="tv-eyebrow">SMALL CIRCLE / BIG ENERGY</span><ItemMenu item={item} actions={actions}/></div><button className="tv-title-link" onClick={() => actions.openItem(item)}><h3>{item.title}</h3></button><p>{item.body}</p><div className="tv-circle-meta"><Users size={15}/>{item.members} {item.members === 1 ? 'member' : 'members'}<span>Hosted by {item.author.name.split(' ')[0]}</span></div><div className="tv-row between"><button className="tv-text-btn" onClick={() => actions.openItem(item)}>Explore circle<ArrowUpRight size={16}/></button><JoinButton item={item} actions={actions} small/></div></div></article>;
}
export function PlanCard({ item, actions }: { item: SocialItem; actions: CardActions }) {
  const date = new Date(item.startsAt ?? item.createdAt);
  return <article className="tv-card tv-plan-card"><button className="tv-plan-cover" onClick={() => actions.openItem(item)} aria-label={`Open ${item.title}`}><img src={coverSrc(item.cover) || '/campus.jpg'} alt="" loading="lazy"/><span className="tv-date-stamp"><small>{date.toLocaleDateString('en-IN', { month: 'short' })}</small><b>{date.getDate()}</b></span></button><div className="tv-plan-content"><div className="tv-row between"><Tag>{item.topic}</Tag><ItemMenu item={item} actions={actions}/></div><button className="tv-title-link" onClick={() => actions.openItem(item)}><h3>{item.title}</h3></button><p>{item.body}</p><div className="tv-plan-details"><span><CalendarDays size={16}/>{planDate(item.startsAt)}</span><span><MapPin size={16}/>{item.place}</span></div><div className="tv-row between"><span className="tv-small"><Users size={16}/>{item.members}/{item.capacity} going</span><JoinButton item={item} actions={actions} small/></div></div></article>;
}
