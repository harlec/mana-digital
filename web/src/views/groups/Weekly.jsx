import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { GhostBtn, Icon, PrimaryBtn, Spinner } from '../../ui';
import { TopBar } from './shared';

const fmt = (d) => new Date(d + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'long' });

export const weeklyText = (w) => [
    `*${w.group.name} · semana ${w.week}*`, w.chapters ? `Leímos ${w.chapters}.` : null,
    `📖 ${w.reads} de ${w.reads_possible} lecturas`, `💬 ${w.contributions} aportes`, `🙏 ${w.accompanied} peticiones acompañadas`, `✨ ${w.testimonies} testimonios`,
    w.top_verse ? `Versículo más marcado: ${w.top_verse.reference}` : null, 'Gloria a Dios. Seguimos juntos esta semana. — Maná Digital'
].filter(Boolean).join('\n');

export const Stat = ({ n, label, gold }) => (
    <div style={{ flex: 1, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Newsreader, serif', fontSize: 30, color: gold ? '#E8B04B' : '#F5F0E8' }}>{n}</div>
        <div style={{ fontSize: 11, color: '#CFC6BA', lineHeight: 1.25 }}>{label}</div>
    </div>
);

export const WeeklyCard = ({ w, large }) => (
    <div style={{ borderRadius: 28, padding: large ? 28 : 22, background: '#26211C', color: '#F5F0E8' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#C9B8F0' }}>{w.group.name} · semana {w.week}</div>
        <div style={{ fontFamily: 'Newsreader, serif', fontSize: large ? 40 : 28, margin: '6px 0 16px' }}>{w.chapters || `${fmt(w.from)} al ${fmt(w.to)}`}</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            <Stat n={`${w.reads}/${w.reads_possible}`} label="lecturas" />
            <Stat n={w.contributions} label="aportes" />
            <Stat n={w.accompanied} label="peticiones acompañadas" />
            <Stat n={w.testimonies} label="testimonios" gold />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#CFC6BA', marginBottom: 8 }}>Constancia</div>
        {w.members.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ width: 84, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                <span style={{ flex: 1, display: 'flex', gap: 4 }}>{m.days.map((on, k) => <span key={k} style={{ flex: 1, height: 10, borderRadius: 5, background: on ? '#C9B8F0' : '#3D362F' }}></span>)}</span>
                <span style={{ width: 22, textAlign: 'right', fontSize: 12, color: '#CFC6BA' }}>{m.count}</span>
            </div>
        ))}
        {w.top_verse && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #3D362F' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#CFC6BA' }}>Versículo más marcado</div>
                {w.top_verse.text && <p style={{ margin: '6px 0', fontFamily: 'Newsreader, serif', fontSize: 19, lineHeight: 1.4 }}>“{w.top_verse.text}”</p>}
                <div style={{ fontSize: 12, fontWeight: 700, color: '#C9B8F0' }}>{w.top_verse.reference}</div>
            </div>
        )}
    </div>
);

export const Weekly = ({ T, token, group, leader, onBack, onMeeting, toast }) => {
    const [offset, setOffset] = useState(0);
    const [w, setW] = useState(null);
    useEffect(() => { setW(null); api.call(`/leader.php?action=weekly&group_id=${group.id}&offset=${offset}`, 'GET', null, token).then(r => r.success && setW(r)).catch(() => {}); }, [offset]);

    const share = async () => {
        const text = weeklyText(w);
        if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
        window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
    };
    return (
        <div className="anim-up">
            <TopBar T={T} title="Resumen semanal" onBack={onBack} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <GhostBtn T={T} onClick={() => setOffset(offset - 1)} style={{ flex: 1, height: 42 }}>‹ Semana anterior</GhostBtn>
                <GhostBtn T={T} disabled={offset === 0} onClick={() => setOffset(offset + 1)} style={{ flex: 1, height: 42, opacity: offset === 0 ? .4 : 1 }}>Siguiente ›</GhostBtn>
            </div>
            {!w ? <Spinner T={T} /> : (
                <>
                    <WeeklyCard w={w} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                        <PrimaryBtn T={T} onClick={share} style={{ flex: 1, background: '#1FA855', color: '#fff' }}><Icon n="send" size={17} />Al grupo</PrimaryBtn>
                        {leader && <GhostBtn T={T} onClick={onMeeting} style={{ flex: 1 }}><Icon n="presentation" size={17} />En la reunión</GhostBtn>}
                    </div>
                </>
            )}
        </div>
    );
};
