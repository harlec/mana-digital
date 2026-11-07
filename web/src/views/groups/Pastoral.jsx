import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, Icon, Spinner } from '../../ui';
import { Kicker, TopBar, GroupLogo } from './shared';

export const Pastoral = ({ T, token, onBack, onOpen }) => {
    const [d, setD] = useState(null);
    useEffect(() => { api.call('/leader.php?action=overview', 'GET', null, token).then(r => r.success && setD(r)).catch(() => {}); }, []);
    if (!d) return <div><TopBar T={T} title="Vista pastoral" onBack={onBack} /><Spinner T={T} /></div>;
    const t = d.totals;
    const Tot = ({ v, l, warn }) => (
        <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: T.serif, fontSize: 28 * T.serifSize, color: warn && v > 0 ? '#BE185D' : T.ink }}>{v}</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.2 }}>{l}</div>
        </div>
    );
    return (
        <div className="anim-up">
            <TopBar T={T} title="Vista pastoral" onBack={onBack} />
            <p style={{ margin: '-6px 4px 14px', fontSize: 14, color: T.muted, lineHeight: 1.4 }}>Todos los grupos y células que acompañas, en un solo lugar.</p>
            <Card T={T} style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                    <Tot v={d.groups.length} l="grupos" />
                    <Tot v={t.members} l="personas" />
                    <Tot v={`${t.reads_possible ? Math.round(100 * t.reads_week / t.reads_possible) : 0}%`} l="lectura de la semana" />
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.line2}` }}>
                    <Tot v={t.needs_care} l="necesitan ánimo" warn />
                    <Tot v={t.open_prayers} l="peticiones abiertas" />
                    <Tot v={t.reports_open} l="reportes" warn />
                </div>
            </Card>
            <Kicker T={T} style={{ margin: '0 4px 8px' }}>Tus grupos</Kicker>
            {d.groups.map(g => (
                <button key={g.id} onClick={() => onOpen(g)} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', padding: 14, marginBottom: 10, borderRadius: 22, border: `1px solid ${T.line2}`, background: T.surface, color: T.ink }}>
                    <GroupLogo g={g} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontFamily: T.serif, fontSize: 19 * T.serifSize }}>{g.name}</span>
                        <span style={{ display: 'block', fontSize: 12, color: T.muted, marginTop: 2 }}>{g.members} personas · lecturas {g.reads_week}/{g.reads_possible} · {g.open_prayers} peticiones</span>
                        {g.needs_care > 0 && <span style={{ display: 'block', fontSize: 13, color: '#BE185D', marginTop: 4 }}>Necesitan ánimo: {g.care_names.join(', ')}{g.needs_care > 3 ? ` y ${g.needs_care - 3} más` : ''}</span>}
                        {g.reports_open > 0 && <span style={{ display: 'block', fontSize: 12, color: '#8C2A1E', marginTop: 2 }}>{g.reports_open} {g.reports_open === 1 ? 'reporte' : 'reportes'} por revisar</span>}
                    </span>
                    <Icon n="chevron-right" size={18} style={{ color: T.faint }} />
                </button>
            ))}
        </div>
    );
};
