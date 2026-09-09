'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SocialAction, SocialSnapshot } from '@/lib/social/types';
import { demoAction, demoSnapshot } from '@/lib/social/demo';

export function useSocial(demo: boolean) {
  const [data, setData] = useState<SocialSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const current = useRef<SocialSnapshot | null>(null);
  const pending = useRef(false);
  const sequence = useRef(0);
  const apply = useCallback((next: SocialSnapshot) => { current.current = next; setData(next); }, []);
  const invalidate = useCallback(() => { sequence.current++; }, []);
  const refresh = useCallback(async () => {
    if (demo || pending.current) return;
    const order = ++sequence.current;
    try {
      const response = await fetch('/api/social', { cache: 'no-store' });
      if (response.status === 401) { location.replace('/login'); return; }
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Could not load your campus. Please try again.');
      if (order === sequence.current) { apply(value); setError(''); }
    } catch (e) { if (order === sequence.current) setError(e instanceof Error ? e.message : 'Connection failed.'); }
    finally { setLoading(false); }
  }, [demo, apply]);
  useEffect(() => {
    if (demo) {
      let initial = demoSnapshot();
      try {
        const saved = sessionStorage.getItem('toveli_demo_v4');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed?.me && Array.isArray(parsed.items) && Array.isArray(parsed.contacts)) initial = parsed;
      } catch { /* A fresh demo also works with storage disabled. */ }
      // Browser storage is read after hydration so the server never renders sample identities.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      apply(initial); setLoading(false); return;
    }
    void refresh();
    const refreshVisible = () => { if (!document.hidden) void refresh(); };
    const interval = setInterval(refreshVisible, 20_000);
    window.addEventListener('focus', refreshVisible);
    return () => { clearInterval(interval); window.removeEventListener('focus', refreshVisible); invalidate(); };
  }, [demo, apply, refresh, invalidate]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  async function mutate(action: SocialAction, success = ''): Promise<boolean> {
    if (pending.current) return false;
    pending.current = true; sequence.current++; setBusy(true); setError('');
    try {
      let next: SocialSnapshot;
      if (demo) {
        next = demoAction(current.current!, action);
        try { sessionStorage.setItem('toveli_demo_v4', JSON.stringify(next)); } catch { setToast('This preview will reset when you reload. Browser storage is full or unavailable.'); }
      } else {
        const response = await fetch('/api/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action) });
        const value = await response.json();
        if (!response.ok) throw new Error(value.error || 'That didn’t go through. Try again.');
        next = value;
      }
      apply(next); if (success) setToast(success); return true;
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong. Try again.'); return false; }
    finally { pending.current = false; setBusy(false); }
  }
  function resetDemo() {
    const next = demoSnapshot(); apply(next);
    try { sessionStorage.setItem('toveli_demo_v4', JSON.stringify(next)); } catch { /* optional */ }
    setToast('Demo reset. All sample content is back.');
  }
  return { data, loading, error, busy, toast, setToast, setError, mutate, refresh, resetDemo };
}
