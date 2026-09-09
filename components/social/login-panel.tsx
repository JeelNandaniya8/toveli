/* eslint-disable @next/next/no-img-element -- Local covers are precompressed; private media must retain same-origin session cookies. */
'use client';
import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Flower2, Leaf, LoaderCircle } from 'lucide-react';
import { Brand } from '@/components/social/ui';

export default function LoginPanel({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to continue.');
      location.href = mode === 'register' ? '/onboard' : '/feed';
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="tv-auth"><section className="tv-auth-story"><Link href="/" aria-label="Toveli home"><Brand/></Link><div className="tv-auth-story-copy"><span className="tv-eyebrow"><Leaf size={15}/>GOOD COMPANY STARTS HERE</span><h1>A small hello.<br/><em>A bigger world.</em></h1><p>Find a little in common.<br/>Make room for something good.</p></div><div className="tv-auth-photo"><img src="/campus.jpg" alt="A green campus path"/><span><Flower2 size={31} strokeWidth={1.3}/>Your best moments happen out there.</span></div><footer>A little online. A lot more together.</footer></section><section className="tv-auth-panel"><Link href="/" className="tv-auth-back"><ArrowLeft size={16}/>Back to Toveli</Link><div className="tv-auth-card"><span className="tv-eyebrow">YOUR LITTLE WORLD IS WAITING</span><h2>{mode === 'login' ? 'Good to have you here.' : 'Make yourself at home.'}</h2><p>{mode === 'login' ? 'Sign in and pick up where your people left off.' : 'A few details. A few shared interests. A whole new beginning.'}</p><div className="tv-auth-tabs" role="group" aria-label="Account access"><button type="button" className={mode === 'login' ? 'active' : ''} aria-pressed={mode === 'login'} onClick={() => { setMode('login'); setError(''); }}>Sign in</button><button type="button" className={mode === 'register' ? 'active' : ''} aria-pressed={mode === 'register'} onClick={() => { setMode('register'); setError(''); }}>Create an account</button></div><form className="tv-form" onSubmit={submit}>{mode === 'register' && <label>Your name<input name="displayName" required minLength={2} maxLength={40} autoComplete="name" placeholder="What should we call you?"/></label>}<label>Email address<input name="email" required type="email" autoComplete="email" placeholder="you@example.com"/></label><label>Password<span className="tv-password-input"><input name="password" required type={visible ? 'text' : 'password'} minLength={mode === 'register' ? 12 : 1} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder={mode === 'register' ? 'At least 12 characters' : 'Your password'}/><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></span></label>{mode === 'register' && <small>Use a unique password with at least 12 characters.</small>}{error && <div className="tv-form-error" role="alert">{error}</div>}<button className="tv-btn primary full" disabled={busy}>{busy ? <><LoaderCircle className="tv-spin" size={17}/>One moment…</> : <>{mode === 'login' ? 'Let me in' : 'Create my account'}<ArrowRight size={17}/></>}</button></form><div className="tv-auth-demo"><span>Just curious?</span><Link href="/demo">Explore the demo first<ArrowRight size={15}/></Link></div></div><footer><Leaf size={15}/>Made for more than scrolling.</footer></section></main>;
}
