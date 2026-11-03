import React from 'react';

// ============ PRIMITIVAS ============
export const Icon = ({ n, size = 20, style }) => <i className={`icon-${n}`} style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', ...style }}></i>;

export const Spinner = ({ T }) => (
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.line}`, borderTopColor: T.accent, animation: 'spin 1s linear infinite' }}></div>
);

export const FullCenter = ({ T, children }) => (
    <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
);

export const Segmented = ({ T, options, value, onChange }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, minmax(0,1fr))`, background: T.track, borderRadius: T.pill ? 999 : 14, padding: 4 }}>
        {options.map(o => {
            const on = o.value === value;
            return (
                <button key={o.value} onClick={() => onChange(o.value)} style={{
                    height: 40, border: 'none', borderRadius: T.pill ? 999 : 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: on ? (T.pill ? T.ink : T.surface) : 'transparent', color: on ? (T.pill ? T.bg : T.ink) : T.muted,
                    fontSize: 14, fontWeight: on ? 600 : 500, boxShadow: on && !T.pill ? '0 1px 2px rgba(0,0,0,.08)' : 'none', transition: 'all .2s'
                }}>{o.icon && <Icon n={o.icon} size={16} />}{o.label}</button>
            );
        })}
    </div>
);

export const Toggle = ({ T, on, onChange }) => (
    <button onClick={() => onChange(!on)} aria-pressed={on} style={{
        width: 52, height: 32, borderRadius: 16, border: 'none', padding: 3, flexShrink: 0, display: 'flex',
        justifyContent: on ? 'flex-end' : 'flex-start', background: on ? T.accent : T.track, transition: 'background .2s'
    }}>
        <span style={{ width: 26, height: 26, borderRadius: '50%', background: T.pill && on ? T.bg : '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }}></span>
    </button>
);

export const PrimaryBtn = ({ T, children, style, ...p }) => (
    <button {...p} style={{ height: 56, border: 'none', borderRadius: T.pill ? 28 : 16, background: T.accent, color: T.accentInk, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: p.disabled ? .45 : 1, ...style }}>{children}</button>
);
export const GhostBtn = ({ T, children, style, ...p }) => (
    <button {...p} style={{ height: 52, borderRadius: T.pill ? 26 : 16, border: `1px solid ${T.line}`, background: 'transparent', color: T.ink, fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, ...style }}>{children}</button>
);
export const IconBtn = ({ T, n, onClick, active, label }) => (
    <button onClick={onClick} aria-label={label} style={{
        width: 44, height: 44, borderRadius: '50%', border: active ? 'none' : `1px solid ${T.line}`, flexShrink: 0,
        background: active ? T.accentSoft : (T.pill ? 'transparent' : T.surface), color: active ? T.accentText : T.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}><Icon n={n} size={19} /></button>
);

export const Card = ({ T, children, style }) => (
    <div style={{ background: T.surface, border: `1px solid ${T.line2}`, borderRadius: T.pill ? 24 : 22, ...style }}>{children}</div>
);
export const Ref = ({ T, children, style }) => (
    <div style={{ fontSize: 12, fontWeight: T.pill ? 500 : 700, letterSpacing: T.pill ? '.14em' : '.06em', textTransform: 'uppercase', color: T.accentText, ...style }}>{children}</div>
);
export const PageTitle = ({ T, children, right }) => (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, padding: '8px 4px 16px' }}>
        <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 36 * T.serifSize, lineHeight: 1.05, color: T.ink }}>{children}</h2>
        {right}
    </div>
);
export const Empty = ({ T, icon, text }) => (
    <div style={{ padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, color: T.muted }}>
        <Icon n={icon} size={32} style={{ color: T.faint }} />
        <p style={{ margin: 0, maxWidth: 260, lineHeight: 1.5, fontSize: 15 }}>{text}</p>
    </div>
);
export const inputStyle = (T) => ({
    height: 54, borderRadius: T.pill ? 27 : 14, border: `1px solid ${T.line}`, background: T.surface, color: T.ink,
    padding: '0 18px', fontSize: 16, outline: 'none', width: '100%', boxSizing: 'border-box'
});

