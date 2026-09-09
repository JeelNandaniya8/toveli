'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Check, MapPin, Sparkles } from 'lucide-react';
import { hubs, interests, intents } from '@/lib/model';
import type { Member, SocialAction } from '@/lib/social/types';
import { Toggle } from './ui';

export function ProfileEditor({ me, accountName, busy, mutate, onDone }: { me: Member | null; accountName: string; busy: boolean; mutate: (a: SocialAction, msg?: string) => Promise<boolean>; onDone: () => void }) {
  const [selected, setSelected] = useState(me?.interests ?? []);
  const [introvert, setIntrovert] = useState(me?.introvert ?? false);
  const [discoverable, setDiscoverable] = useState(me?.discoverable ?? true);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!selected.length) { setError('Choose at least one interest.'); return; }
    const values = new FormData(event.currentTarget);
    const profile = { name: String(values.get('name')), hub: String(values.get('hub')), cohort: me?.cohort ?? String(values.get('cohort')), bio: String(values.get('bio')), interests: selected, intent: String(values.get('intent')), introvert, discoverable };
    if (await mutate({ kind: 'profile', profile }, me ? 'Profile updated.' : 'Welcome to your campus. Make yourself at home.')) onDone();
  }
  return <section className="tv-card tv-profile-editor"><div className="tv-editor-intro"><span className="tv-round-icon"><Sparkles/></span><span className="tv-eyebrow">{me ? 'YOUR CORNER OF TOVELI' : 'A GOOD PLACE TO BEGIN'}</span><h2>{me ? 'A little more you.' : 'People start with a little in common.'}</h2><p>{me ? 'Let your interests do the introducing.' : 'Choose your campus, what you love, and what brings you here. You can change your interests anytime.'}</p></div>
    <form className="tv-form" onSubmit={submit}><div className="tv-form-grid"><label>Your name<input name="name" defaultValue={me?.name ?? accountName} required minLength={2} maxLength={40} autoComplete="name"/></label><label><span><MapPin size={14}/>Your campus</span><select name="hub" defaultValue={me?.hub ?? hubs[0]}>{hubs.map(hub => <option key={hub}>{hub}</option>)}</select></label></div>
      {!me && <label>Your age group<select name="cohort" defaultValue="teen"><option value="teen">13–17</option><option value="adult">18 or older</option></select><small>Your feed and connections stay within this group. This selection cannot be changed here later.</small></label>}
      <label>A little about you<textarea name="bio" defaultValue={me?.bio} maxLength={240} rows={3} placeholder="Small things you love. Something you’re curious about."/></label>
      <fieldset><legend>What lights you up? <small>Choose at least one</small></legend><div className="tv-interest-picker">{interests.map(interest => <button key={interest} type="button" aria-pressed={selected.includes(interest)} className={selected.includes(interest) ? 'selected' : ''} onClick={() => setSelected(selected.includes(interest) ? selected.filter(i => i !== interest) : [...selected, interest])}>{selected.includes(interest) && <Check size={14}/>} {interest}</button>)}</div></fieldset>
      <label>I’m here to…<select name="intent" defaultValue={me?.intent ?? intents[0]}>{intents.map(intent => <option key={intent}>{intent}</option>)}</select></label>
      <div className="tv-settings-group"><Toggle checked={introvert} onChange={setIntrovert} label="A slower start" detail="Let people know you prefer low-pressure introductions."/><Toggle checked={discoverable} onChange={setDiscoverable} label="Show me in Discover" detail="People in your campus and age group can find you and request a connection. Your posts remain visible in the campus feed."/></div>
      {!me && <label className="tv-checkbox"><input type="checkbox" required/>I’m at least 13 and I’ve selected my correct age group.</label>}
      {error && <p role="alert" className="tv-form-error">{error}</p>}
      <div className="tv-form-footer"><small>{me ? `Age group: ${me.cohort === 'teen' ? '13–17' : '18+'}` : 'No location tracking. Just your chosen campus.'}</small><button className="tv-btn primary" disabled={busy}>{busy ? 'Saving…' : me ? 'Save changes' : 'Find my people'}<ArrowRight size={18}/></button></div>
    </form>
  </section>;
}
