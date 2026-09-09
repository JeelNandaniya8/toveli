'use client';
import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from 'react';
import { ArrowUpRight, Check, Compass, X } from 'lucide-react';
import type { Member } from '@/lib/social/types';

export const ModalErrorContext = createContext('');
export function Brand({ compact = false }: { compact?: boolean }) {
  return <span className="tv-brand"><span className="tv-brand-mark" aria-hidden="true"><i/><i/><i/></span>{!compact && <span>toveli<span className="tv-brand-dot">.</span></span>}</span>;
}
export function Avatar({ person, size = '', onClick }: { person: Pick<Member, 'name' | 'id'>; size?: string; onClick?: () => void }) {
  const color = [...person.id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 6;
  const initials = person.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('');
  const props = { className: `tv-avatar tone-${color} ${size}`, title: person.name };
  return onClick ? <button {...props} aria-label={`View ${person.name}'s profile`} onClick={onClick}>{initials}</button> : <span {...props} aria-hidden="true">{initials}</span>;
}
export function Tag({ children, tint = '' }: { children: ReactNode; tint?: string }) { return <span className={`tv-tag ${tint}`}>{children}</span>; }
export function Empty({ title, text, action, onAction, icon = <Compass/> }: { title: string; text: string; action?: string; onAction?: () => void; icon?: ReactNode }) {
  return <div className="tv-empty"><div className="tv-empty-icon">{icon}</div><h3>{title}</h3><p>{text}</p>{action && <button className="tv-btn primary" onClick={onAction}>{action}<ArrowUpRight size={17}/></button>}</div>;
}
export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const error = useContext(ModalErrorContext);
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = ref.current; element?.showModal();
    const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = overflow; };
  }, []);
  return <dialog ref={ref} className={`tv-modal ${wide ? 'wide' : ''}`} aria-labelledby={id} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="tv-modal-inner"><header><div><span className="tv-eyebrow">TOVELI / TOGETHER</span><h2 id={id}>{title}</h2></div><button className="tv-icon-btn" onClick={onClose} aria-label="Close dialog"><X/></button></header>{error && <div className="tv-form-error" role="alert" style={{marginBottom: 16}}>{error}</div>}{children}</div>
  </dialog>;
}
export function Toggle({ checked, onChange, label, detail, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; detail: string; disabled?: boolean }) {
  return <label className="tv-toggle-row"><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" role="switch" checked={checked} onChange={e => onChange(e.target.checked)} disabled={disabled}/><span className="tv-switch" aria-hidden="true"><Check size={12}/></span></label>;
}
export function relativeTime(time: number) {
  const elapsed = Math.max(0, Date.now() - time);
  if (elapsed < 60_000) return 'Just now';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h ago`;
  return new Date(time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
export function planDate(time?: number) { return time ? new Date(time).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'Date to be announced'; }
