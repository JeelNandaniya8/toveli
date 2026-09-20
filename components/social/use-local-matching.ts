'use client';
import { useEffect, useRef, useState } from 'react';
import type { Member } from '@/lib/social/types';
import { interestText } from '@/lib/social/matching';
export function useLocalMatching(me: Member | null | undefined, people: Member[]) {
  const worker = useRef<Worker | null>(null);
  const [result, setResult] = useState<{ status: string; ids?: string[]; signature?: string; done?: number; total?: number }>({ status: 'off' });
  const signature = JSON.stringify([me && [me.id, interestText(me), me.places, me.hub], ...people.slice(0,50).map(p => [p.id,interestText(p),p.places,p.hub])]);
  useEffect(() => () => worker.current?.terminate(), []);
  const current = result.signature === signature;
  const loading = current && ['loading','ranking'].includes(result.status);
  function stop() { worker.current?.terminate(); worker.current = null; setResult({ status: 'off' }); }
  function start() {
    if (!me || !people.length) return;
    worker.current?.terminate();
    setResult({ status: 'loading', signature });
    try {
      const active = new Worker(new URL('../../lib/ai/matching.worker.ts', import.meta.url), { type: 'module' });
      worker.current = active;
      active.onmessage = event => { if (worker.current === active) setResult(event.data); };
      active.onerror = () => { active.terminate(); if (worker.current === active) setResult({ status: 'error', signature }); };
      active.postMessage({ me, people: people.slice(0,50), signature });
    } catch { setResult({ status: 'error', signature }); }
  }
  const ids = current && result.status === 'ready' ? result.ids ?? [] : [];
  const order = new Map(ids.map((id,index) => [id,index]));
  const ranked = [...people].sort((a,b) => (order.get(a.id) ?? 1000) - (order.get(b.id) ?? 1000));
  return { start, stop, loading, ranked, status: current ? result.status : 'off', progress: result.status === 'ranking' ? `${result.done}/${result.total}` : '' };
}
