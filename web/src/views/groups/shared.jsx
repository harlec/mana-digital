import React from 'react';
import { Icon, IconBtn } from '../../ui';

export const INVITE_BASE = 'https://manadigital.harlec.com.pe/?join=';
export const JOIN_KEY = 'mana_pending_join';

export const Avatar = ({ name, color, size = 36 }) => (
    <span style={{ width: size, height: size, borderRadius: '50%', background: color, color: '#fff', fontWeight: 700, fontSize: size * .38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {(name || '?').charAt(0).toUpperCase()}
    </span>
);

export const GroupLogo = ({ g, size = 48 }) => (
    <span style={{ width: size, height: size, borderRadius: size / 3, background: g.color, color: '#fff', fontFamily: 'Newsreader, serif', fontSize: size * .46, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{g.initial}</span>
);

export const TopBar = ({ T, title, onBack, right }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <IconBtn T={T} n="chevron-left" onClick={onBack} label="Atrás" />
        <h2 style={{ margin: 0, flex: 1, minWidth: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 24 * T.serifSize, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h2>
        {right}
    </div>
);

export const Kicker = ({ T, children, style }) => (
    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.muted, ...style }}>{children}</div>
);

export const timeLabel = (ts) => {
    const d = new Date(String(ts).replace(' ', 'T'));
    return isNaN(d) ? '' : d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' });
};

export const groupMeta = (g) => `${g.type_label} · ${g.members} ${g.members === 1 ? 'persona' : 'personas'}${g.role === 'leader' ? ' · eres líder' : ''}`;

export const todayLine = (g) => {
    if (g.status === 'upcoming') return `Empieza el ${new Date(g.start_date + 'T12:00').toLocaleDateString('es', { day: 'numeric', month: 'long' })}`;
    if (g.status === 'finished') return `${g.book} · plan terminado`;
    return `Hoy: ${g.reference} · ${g.contributions_today} ${g.contributions_today === 1 ? 'aporte' : 'aportes'}`;
};

export const shareInvite = async (g, code) => {
    const url = INVITE_BASE + code;
    const text = `Te invito a leer ${g.book} juntos en Maná Digital, en el grupo “${g.name}”. Entra con este enlace: ${url} (o usa el código ${code}).`;
    if (navigator.share) {
        try { await navigator.share({ text }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank');
};
export { Icon };
