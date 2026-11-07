import React from 'react';
import { Card, Icon, PrimaryBtn } from '../../ui';
import { dateLabel, greeting, streakLabel } from '../../useDay';

const Row = ({ T, icon, kicker, title, status, statusColor, last, onClick }) => (
    <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', background: 'none', border: 'none',
        padding: '16px 18px', color: T.ink, borderBottom: last ? 'none' : `1px solid ${T.line2}`
    }}>
        <span style={{ width: 40, height: 40, borderRadius: '50%', background: T.accentSoft, color: T.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon n={icon} size={19} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.muted }}>{kicker}</span>
            <span style={{ display: 'block', fontFamily: T.serif, fontSize: 19 * T.serifSize, marginTop: 2 }}>{title}</span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: statusColor || T.accentText, display: 'flex', alignItems: 'center', gap: 6 }}>{status}</span>
    </button>
);

export const TodayView = ({ T, user, day, go }) => {
    const moments = day.moments.filter(m => m.done).length;
    const green = '#0F7A55';
    return (
        <div className="anim-up">
            <div style={{ padding: '4px 4px 18px' }}>
                <div style={{ fontSize: 13, color: T.muted }}>{dateLabel()}{streakLabel(day.streak)}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 }}>
                    <h1 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 30 * T.serifSize, lineHeight: 1.1, color: T.ink }}>{greeting()}, {user.name}</h1>
                    <button onClick={() => go('me')} aria-label="Yo" style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: T.accentSoft, color: T.accentText, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {(user.name || '?').charAt(0).toUpperCase()}
                    </button>
                </div>
            </div>

            {(day.nudges || []).map((n, i) => (
                <button key={i} onClick={() => go(day.read_done ? 'devo' : 'read')} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', marginBottom: 10, padding: '12px 16px', borderRadius: 18, border: 'none', background: T.accentSoft, color: T.accentText, fontSize: 14, lineHeight: 1.4 }}>
                    <Icon n="bell-ring" size={18} />
                    <span><b>{n.from_name}</b> te recuerda en {n.group_name}: {n.message}</span>
                </button>
            ))}

            <Card T={T} style={{ overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '16px 18px 4px', fontFamily: T.serif, fontSize: 22 * T.serifSize, color: T.ink }}>Tu día con Dios</div>
                <Row T={T} icon="sun" kicker="Mañana · La Palabra" title={day.reading.title}
                    status={day.read_done ? <><Icon n="check" size={16} />Hecho</> : day.settings.morning_time}
                    statusColor={day.read_done ? green : undefined} onClick={() => go(day.read_done ? 'devo' : 'read')} />
                <Row T={T} icon="sparkles" kicker="Durante el día · Comunión" title={`${moments} de 3 momentos`}
                    status={<span style={{ display: 'flex', gap: 5 }}>{day.moments.map(m => <span key={m.slot} style={{ width: 8, height: 8, borderRadius: '50%', background: m.done ? T.accent : T.line }}></span>)}</span>}
                    onClick={() => go('commune')} />
                <Row T={T} icon="moon-star" kicker="Noche · Examen del día" title={day.examen.closed ? 'Día cerrado' : 'Checklist y oración'}
                    status={day.examen.closed ? <><Icon n="check" size={16} />Hecho</> : day.settings.examen_time}
                    statusColor={day.examen.closed ? green : undefined} last onClick={() => go('examen')} />
            </Card>

            {!day.read_done && (
                <PrimaryBtn T={T} onClick={() => go('read')} style={{ width: '100%' }}>
                    <Icon n="book-open" size={19} />Abrir la Palabra de hoy
                </PrimaryBtn>
            )}
            {day.rhema && (
                <Card T={T} style={{ padding: 22, marginTop: 14, background: T.pill ? T.surface : '#26211C', border: 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.pill ? T.accent : '#C9B8F0' }}>Tu palabra para llevar hoy</div>
                    {day.rhema.text && <p style={{ margin: '10px 0 8px', fontFamily: T.serif, fontSize: 21 * T.serifSize, lineHeight: 1.35, color: T.pill ? T.ink : '#F5F0E8' }}>“{day.rhema.text}”</p>}
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: T.pill ? T.muted : '#CFC6BA' }}>{day.rhema.reference}</div>
                </Card>
            )}
        </div>
    );
};
