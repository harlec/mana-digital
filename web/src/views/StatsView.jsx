import React, { useState, useEffect } from 'react';
import { api } from '../config';
import { Card, FullCenter, PageTitle, Spinner } from '../ui';

// ============ ESTADÍSTICAS ============
export const StatsView = ({ T, token, lang, t }) => {
    const [stats, setStats] = useState(null);
    const night = T.name === 'night';
    useEffect(() => { api.call('/checkin.php?action=stats&days=30', 'GET', null, token).then(res => { if (res.success) setStats(res.stats); }); }, []);
    if (!stats) return <FullCenter T={T}><Spinner T={T} /></FullCenter>;
    const list = [...(stats.emotions || [])].filter(e => +e.count > 0).sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...list.map(e => +e.count));

    const Bars = () => list.map(e => (
        <div key={e.id || e.name_es} style={night ? { display: 'flex', flexDirection: 'column', gap: 6 } : { display: 'grid', gridTemplateColumns: '100px 1fr 28px', alignItems: 'center', gap: 10 }}>
            {night ? <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}><span>{lang === 'es' ? e.name_es : e.name_en}</span><span style={{ color: T.muted }}>{e.count}</span></div>
                   : <span style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'es' ? e.name_es : e.name_en}</span>}
            <span style={{ height: night ? 4 : 8, borderRadius: 4, background: T.track, display: 'block', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', width: `${(e.count / max) * 100}%`, background: e.color || T.accent, borderRadius: 4, transition: 'width .6s' }}></span>
            </span>
            {!night && <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>{e.count}</span>}
        </div>
    ));

    return night ? (
        <div style={{ padding: '8px 4px' }}>
            <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: T.muted }}>{t.currentStreak}</div>
            <div style={{ fontFamily: T.serif, fontSize: 96, lineHeight: 1, color: T.accent }}>{stats.current_streak} <span style={{ fontSize: 32, color: T.ink }}>{t.days}</span></div>
            <div style={{ fontSize: 15, color: T.muted, marginTop: 4 }}>{stats.total_checkins} {t.checkins.toLowerCase()} · {t.last30.toLowerCase()}</div>
            <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: T.muted }}>{t.mostFelt}</div>
                <Bars />
            </div>
        </div>
    ) : (
        <div>
            <PageTitle T={T}>{t.emotionalJourney}</PageTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Card T={T} style={{ padding: 18 }}><div style={{ fontSize: 13, color: T.muted }}>{t.currentStreak}</div><div style={{ fontFamily: T.serif, fontSize: 44, lineHeight: 1.1 }}>{stats.current_streak}<span style={{ fontSize: 18, color: T.muted }}> {t.days}</span></div></Card>
                    <Card T={T} style={{ padding: 18 }}><div style={{ fontSize: 13, color: T.muted }}>{t.checkins}</div><div style={{ fontFamily: T.serif, fontSize: 44, lineHeight: 1.1 }}>{stats.total_checkins}</div></Card>
                </div>
                <Card T={T} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>{t.mostFelt} · {t.last30.toLowerCase()}</div>
                    <Bars />
                </Card>
            </div>
        </div>
    );
};

