import React from 'react';
import { Icon } from '../ui';

// ============ NAVEGACIÓN ============
export const BottomNav = ({ T, view, setView, t }) => {
    const items = [
        { id: 'today', icon: 'sun', label: 'Hoy' },
        { id: 'plan', icon: 'book-open', label: 'Leer' },
        { id: 'me', icon: 'circle-user', label: 'Yo' }
    ];
    // Pantallas que pertenecen a cada pestaña
    const TAB_OF = { today: 'today', commune: 'today', examen: 'today', plan: 'plan', read: 'plan' };
    const tab = TAB_OF[view] || 'me';
    if (T.pill) {
        return (
            <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(16px + env(safe-area-inset-bottom))', display: 'flex', justifyContent: 'center', padding: '0 20px', zIndex: 40 }}>
                <div style={{ width: '100%', maxWidth: 420, height: 64, borderRadius: 32, background: T.surface, border: `1px solid ${T.line}`, display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)`, alignItems: 'center', padding: '0 6px', boxSizing: 'border-box', boxShadow: '0 12px 30px rgba(0,0,0,.35)' }}>
                    {items.map(it => {
                        const on = tab === it.id;
                        return <button key={it.id} onClick={() => setView(it.id)} aria-label={it.label} aria-current={on ? 'page' : undefined} style={{ height: 52, borderRadius: 26, border: 'none', background: on ? T.line : 'transparent', color: on ? T.accent : T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}><Icon n={it.icon} size={21} />{on && <span>{it.label}</span>}</button>;
                    })}
                </div>
            </nav>
        );
    }
    return (
        <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: T.surface, borderTop: `1px solid ${T.line2}`, paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 40 }}>
            <div style={{ maxWidth: 560, margin: '0 auto', display: 'grid', gridTemplateColumns: `repeat(${items.length},1fr)` }}>
                {items.map(it => {
                    const on = tab === it.id;
                    return <button key={it.id} onClick={() => setView(it.id)} aria-current={on ? 'page' : undefined} style={{ height: 68, border: 'none', background: 'none', color: on ? T.accent : T.faint, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: on ? 700 : 600 }}><Icon n={it.icon} size={22} />{it.label}</button>;
                })}
            </div>
        </nav>
    );
};

