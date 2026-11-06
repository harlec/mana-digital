import React from 'react';
import { Card, Icon } from '../../ui';
import { streakLabel } from '../../useDay';

const Item = ({ T, icon, title, sub, onClick, danger, last }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', minHeight: 60, textAlign: 'left', background: 'none', border: 'none', padding: '10px 16px', color: danger ? T.danger : T.ink, borderBottom: last ? 'none' : `1px solid ${T.line2}` }}>
        <span style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: danger ? 'rgba(180,35,24,.1)' : T.accentSoft, color: danger ? T.danger : T.accentText }}><Icon n={icon} size={18} /></span>
        <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 600 }}>{title}</span>
            {sub && <span style={{ display: 'block', fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</span>}
        </span>
        {!danger && <Icon n="chevron-right" size={18} style={{ color: T.faint }} />}
    </button>
);
const Section = ({ T, title, children }) => (
    <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.muted, margin: '0 4px 8px' }}>{title}</div>
        <Card T={T} style={{ overflow: 'hidden' }}>{children}</Card>
    </div>
);

export const MeView = ({ T, user, day, go, onLogout }) => (
    <div className="anim-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 4px 22px' }}>
            <span style={{ width: 56, height: 56, borderRadius: '50%', background: T.accentSoft, color: T.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22 }}>{(user.name || '?').charAt(0).toUpperCase()}</span>
            <div>
                <div style={{ fontFamily: T.serif, fontSize: 26 * T.serifSize, color: T.ink }}>{user.name}</div>
                <div style={{ fontSize: 13, color: T.muted }}>{user.email}{day ? streakLabel(day.streak) : ''}</div>
            </div>
        </div>

        <Section T={T} title="Mi vida devocional">
            <Item T={T} icon="notebook-pen" title="Mi diario" sub="Tus palabras rhema y devocionales" onClick={() => go('diary')} />
            <Item T={T} icon="map" title="Mi plan de lectura" onClick={() => go('plan')} />
            <Item T={T} icon="sparkles" title="Momentos de comunión" onClick={() => go('commune')} />
            <Item T={T} icon="moon-star" title="Examen de la noche" onClick={() => go('examen')} last />
        </Section>

        <Section T={T} title="Más palabras">
            <Item T={T} icon="heart-pulse" title="Un versículo según cómo me siento" onClick={() => go('home')} />
            <Item T={T} icon="heart" title="Favoritos" onClick={() => go('favorites')} />
            <Item T={T} icon="history" title="Historial" onClick={() => go('history')} />
            <Item T={T} icon="chart-no-axes-column" title="Mi camino" onClick={() => go('stats')} last />
        </Section>

        <Section T={T} title="Cuenta">
            <Item T={T} icon="settings" title="Recordatorios y tema" onClick={() => go('settings')} />
            <Item T={T} icon="log-out" title="Cerrar sesión" onClick={onLogout} danger last />
        </Section>
    </div>
);
