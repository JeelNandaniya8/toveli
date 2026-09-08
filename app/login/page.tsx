'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Leaf, LockKeyhole, Users } from 'lucide-react';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to continue.');
      location.href = '/onboard';
    } catch (reason) { setError((reason as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="v3-app auth-page"><section className="auth-story"><Link className="v3-logo" href="/"><i>t</i>toveli<b>.</b></Link><div><span><Leaf/>DESIGNED TO LET YOU LEAVE</span><h1>Your people.<br/>Your place.<br/>Today.</h1><p>A finite social home for interests, small circles, and plans that happen away from the screen.</p></div><footer><Users/>Meet through something you already care about.</footer></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow">PRIVATE ALPHA</p><h2>{mode === 'login' ? 'Welcome back.' : 'Create your Toveli account.'}</h2><p>Your account belongs only to Toveli and does not require another social profile.</p><div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={()=>setMode('login')}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={()=>setMode('register')}>Create account</button></div><form onSubmit={submit}>{mode === 'register'&&<label>Name<input name="displayName" required minLength={2} maxLength={40} autoComplete="name"/></label>}<label>Email<input name="email" required type="email" autoComplete="email"/></label><label>Password<input name="password" required type="password" minLength={mode === 'register' ? 12 : 1} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'}/></label>{mode === 'register'&&<small>Use at least 12 characters. Never reuse your email password.</small>}{error&&<div className="auth-error">{error}</div>}<button className="v3-primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight/></button></form><footer><LockKeyhole/>HttpOnly sessions. Passwords are salted and hashed.</footer></div></section></main>;
}
