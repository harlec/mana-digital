import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Icon, Spinner } from '../../ui';
import { KINDS } from './shared';
import { WeeklyCard } from './Weekly';

const BG = '#14110F', INK = '#F5F0E8', MUTED = '#CFC6BA', GOLD = '#E8B04B';
const Title = ({ children }) => <div style={{ fontFamily: 'Newsreader, serif', fontSize: 'clamp(30px, 5vw, 48px)', color: INK, marginBottom: 18 }}>{children}</div>;

export const Meeting = ({ token, group, onExit }) => {
    const [d, setD] = useState(null);
    const [i, setI] = useState(0);
    useEffect(() => { api.call(`/leader.php?action=meeting&group_id=${group.id}`, 'GET', null, token).then(r => r.success && setD(r)).catch(() => {}); }, []);

    const slides = d ? [
        <div key="a"><WeeklyCard w={d.weekly} large /></div>,
        <div key="b">
            <Title>Lo que Dios les habló</Title>
            {d.featured.length === 0 && <p style={{ color: MUTED, fontSize: 20 }}>Esta semana nadie compartió aún un aporte.</p>}
            {d.featured.map((c, k) => (
                <div key={k} style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: 18, marginBottom: 22 }}>
                    {c.verse_ref && <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: GOLD }}>{c.verse_ref}</div>}
                    <p style={{ margin: '6px 0', fontFamily: 'Newsreader, serif', fontSize: 'clamp(20px, 3.2vw, 30px)', lineHeight: 1.4, color: INK }}>{c.text}</p>
                    <div style={{ color: MUTED, fontSize: 16 }}>{c.author}{c.amens ? ` · Amén ${c.amens}` : ''}</div>
                </div>
            ))}
            {d.question && <div style={{ marginTop: 10, padding: 18, borderRadius: 20, background: '#26211C', color: INK, fontSize: 'clamp(18px, 2.6vw, 26px)', lineHeight: 1.4 }}><Icon n="pin" size={20} /> {d.question}</div>}
        </div>,
        <div key="c">
            <Title>Oremos juntos</Title>
            {d.prayers.length === 0 && <p style={{ color: MUTED, fontSize: 20 }}>No hay peticiones abiertas.</p>}
            {d.prayers.map((p, k) => (
                <div key={k} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'baseline' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 10, background: KINDS[p.kind].bg, color: KINDS[p.kind].fg, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{KINDS[p.kind].label}</span>
                    <span style={{ fontSize: 'clamp(18px, 2.6vw, 26px)', lineHeight: 1.4, color: INK }}>{p.text}<span style={{ color: MUTED, fontSize: 16 }}> — {p.author}</span></span>
                </div>
            ))}
        </div>,
        <div key="d">
            <Title>Dios respondió</Title>
            {d.testimonies.length === 0 && <p style={{ color: MUTED, fontSize: 20 }}>Cuando Dios responda, aquí lo celebramos.</p>}
            {d.testimonies.map((t, k) => (
                <div key={k} style={{ marginBottom: 22 }}>
                    <div style={{ color: MUTED, fontSize: 16 }}>Pidió: {t.asked}</div>
                    <p style={{ margin: '6px 0', fontFamily: 'Newsreader, serif', fontSize: 'clamp(22px, 3.4vw, 32px)', lineHeight: 1.4, color: GOLD }}>{t.testimony}</p>
                    <div style={{ color: MUTED, fontSize: 16 }}>{t.author}</div>
                </div>
            ))}
        </div>
    ] : [];

    const last = slides.length - 1;
    useEffect(() => {
        const key = (e) => { if (e.key === 'ArrowRight') setI(n => Math.min(n + 1, last)); if (e.key === 'ArrowLeft') setI(n => Math.max(n - 1, 0)); if (e.key === 'Escape') onExit(); };
        window.addEventListener('keydown', key);
        return () => window.removeEventListener('keydown', key);
    }, [last]);

    const btn = { height: 52, padding: '0 22px', borderRadius: 26, border: '1px solid #3D362F', background: 'transparent', color: INK, fontSize: 16, fontWeight: 600 };
    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: BG, color: INK, display: 'flex', flexDirection: 'column', padding: 'max(16px, env(safe-area-inset-top)) 20px max(16px, env(safe-area-inset-bottom))', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: 900, width: '100%', margin: '0 auto' }}>
                <div style={{ flex: 1, display: 'flex', gap: 6 }}>{slides.map((_, k) => <span key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: k <= i ? GOLD : '#3D362F' }}></span>)}</div>
                <button onClick={onExit} aria-label="Salir" style={{ ...btn, height: 40, padding: '0 14px' }}>Salir</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxWidth: 900, width: '100%', margin: '0 auto', padding: '28px 0' }}>
                {!d ? <Spinner T={{ accent: GOLD }} /> : slides[i]}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 900, width: '100%', margin: '0 auto' }}>
                <button onClick={() => setI(Math.max(i - 1, 0))} disabled={i === 0} style={{ ...btn, opacity: i === 0 ? .35 : 1 }}>Anterior</button>
                <button onClick={() => (i === last ? onExit() : setI(i + 1))} style={{ ...btn, background: GOLD, color: '#26211C', border: 'none' }}>{i === last ? 'Terminar' : 'Siguiente'}</button>
            </div>
        </div>
    );
};
