/* eslint-disable @next/next/no-img-element -- Local covers are precompressed; private media must retain same-origin session cookies. */
'use client';
import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, ImagePlus, LoaderCircle, X } from 'lucide-react';
import { interests } from '@/lib/model';
import { covers, places, type ItemKind, type SocialAction } from '@/lib/social/types';
import { Modal } from './ui';

async function preparePhoto(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP photo.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a photo under 10 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not prepare this photo.');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  let quality = 0.82; let photo = canvas.toDataURL('image/jpeg', quality);
  while (photo.length > 345_000 && quality > 0.26) { quality -= 0.1; photo = canvas.toDataURL('image/jpeg', quality); }
  if (photo.length > 345_000) throw new Error('This image is too detailed. Try a smaller photo.');
  return photo;
}
export function Composer({ initialKind, busy, mutate, onClose }: { initialKind: ItemKind; busy: boolean; mutate: (action: SocialAction, success?: string) => Promise<boolean>; onClose: () => void }) {
  const [kind, setKind] = useState(initialKind);
  const [cover, setCover] = useState<string>(initialKind === 'post' ? '' : 'campus');
  const [photo, setPhoto] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const values = new FormData(event.currentTarget);
    const data = { title: kind !== 'post' ? String(values.get('title')) : undefined, body: String(values.get('body')), topic: String(values.get('topic')), cover: !photo && cover ? cover : undefined, photo: photo || undefined,
      ...(kind === 'plan' ? { place: String(values.get('place')), startsAt: new Date(String(values.get('startsAt'))).getTime(), capacity: Number(values.get('capacity')) } : {}),
    };
    const ok = await mutate({ kind: 'create', itemKind: kind, data }, kind === 'post' ? 'Shared with your campus.' : `${kind === 'circle' ? 'Circle' : 'Plan'} created. You’re the host!`);
    if (ok) onClose();
  }
  return <Modal title="Start something good." onClose={onClose}><div className="tv-compose-tabs" role="group" aria-label="What would you like to create?">{(['post', 'circle', 'plan'] as const).map(value => <button type="button" key={value} className={kind === value ? 'active' : ''} aria-pressed={kind === value} onClick={() => { setKind(value); if (value !== 'post' && !cover) setCover('campus'); }}>{value === 'post' ? 'Share a moment' : value === 'circle' ? 'Start a circle' : 'Make a plan'}</button>)}</div>
    <form className="tv-form" onSubmit={submit}>
      <p className="tv-muted">{kind === 'post' ? 'A photo, a thought, a question. Give someone a reason to say hello.' : kind === 'circle' ? 'A small place for a shared interest. You’ll host the conversation.' : 'Something simple, somewhere public. Small plans are easier to say yes to.'}</p>
      {kind !== 'post' && <label>{kind === 'circle' ? 'Circle name' : 'What’s the plan?'}<input name="title" placeholder={kind === 'circle' ? 'The Sunday Sketch Club' : 'Coffee & a blank page'} required maxLength={100}/></label>}
      <label>{kind === 'post' ? 'Your moment' : 'Tell people a little more'}<textarea name="body" placeholder={kind === 'post' ? 'What’s on your mind?' : 'Who’s it for? What should people bring?'} required maxLength={2000} rows={4}/></label>
      <label>Interest<select name="topic" defaultValue="Photography">{interests.map(i => <option key={i}>{i}</option>)}</select></label>
      {kind === 'plan' && <><div className="tv-form-grid"><label>Date & time<input type="datetime-local" name="startsAt" required/></label><label>Group size, including you<select name="capacity" defaultValue="6">{[2,3,4,5,6,8,10,12,15,20].map(n => <option key={n} value={n}>{n} people</option>)}</select></label></div><label>Public meeting place<select name="place">{places.map(p => <option key={p}>{p}</option>)}</select></label></>}
      <fieldset><legend>{kind === 'post' ? 'Add a photo or a little atmosphere' : 'Choose a cover'}</legend><div className="tv-cover-picker">{covers.map(c => <button type="button" key={c.id} aria-label={c.label} aria-pressed={cover === c.id && !photo} className={cover === c.id && !photo ? 'selected' : ''} onClick={() => { setCover(cover === c.id && kind === 'post' ? '' : c.id); setPhoto(''); }}><img src={c.src} alt=""/><span>{c.label}</span></button>)}</div><small>Curated covers are illustrative. You can also add your own photo.</small></fieldset>
      <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose photo" onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return;
        setPreparing(true); setError('');
        try { setPhoto(await preparePhoto(file)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not prepare this image.'); }
        finally { setPreparing(false); if (input.current) input.current.value = ''; }
      }}/>
      {photo ? <div className="tv-upload-preview"><img src={photo} alt="Your selected photo"/><button type="button" className="tv-icon-btn" onClick={() => setPhoto('')} aria-label="Remove photo"><X size={18}/></button></div> : <button type="button" className="tv-btn secondary" disabled={preparing} onClick={() => input.current?.click()}>{preparing ? <LoaderCircle className="tv-spin" size={17}/> : <ImagePlus size={17}/>}Upload your photo</button>}
      {error && <p className="tv-form-error" role="alert">{error}</p>}
      <div className="tv-form-footer"><small>Visible to your campus and age group.</small><button className="tv-btn primary" disabled={busy || preparing}>{busy ? 'Sharing…' : kind === 'post' ? 'Share moment' : kind === 'circle' ? 'Create circle' : 'Publish plan'}<ArrowUpRight size={18}/></button></div>
    </form>
  </Modal>;
}
