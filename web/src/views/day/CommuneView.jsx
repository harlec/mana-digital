import React from 'react';
import { Card, Icon, IconBtn } from '../../ui';

export const CommuneView = ({ T, day, actions, go }) => (
    <div className="anim-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <IconBtn T={T} n="chevron-left" onClick={() => go('today')} label="Atrás" />
            <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 24 * T.serifSize, color: T.ink }}>Comunión</h2>
        </div>

        <div style={{ padding: '8px 4px 18px' }}>
            <p style={{ margin: 0, fontFamily: T.serif, fontStyle: 'italic', fontSize: 22 * T.serifSize, lineHeight: 1.35, color: T.ink }}>
                “Una lechera puede ordeñar vacas para la gloria de Dios.”
            </p>
            <div style={{ marginTop: 10, fontSize: 13, color: T.muted }}>Atribuido a Martín Lutero · “Orad sin cesar” — 1 Tesalonicenses 5:17</div>
        </div>

        {day.rhema && (
            <div style={{ borderRadius: 22, padding: 20, marginBottom: 14, background: T.pill ? T.surface : '#26211C', border: T.pill ? `1px solid ${T.line}` : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.pill ? T.accent : '#C9B8F0' }}>Tu palabra para llevar hoy</div>
                {day.rhema.text && <p style={{ margin: '8px 0 6px', fontFamily: T.serif, fontSize: 20 * T.serifSize, lineHeight: 1.35, color: T.pill ? T.ink : '#F5F0E8' }}>“{day.rhema.text}”</p>}
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: T.pill ? T.muted : '#CFC6BA' }}>{day.rhema.reference}</div>
            </div>
        )}

        <Card T={T} style={{ padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.muted, marginBottom: 12 }}>Oración de respiración</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['Inhala', 'Señor Jesús'], ['Exhala', 'dame tu paz']].map(([k, v]) => (
                    <div key={k} style={{ borderRadius: 16, background: T.accentSoft, padding: '14px 12px', textAlign: 'center' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.accentText, textTransform: 'uppercase', letterSpacing: '.08em' }}>{k}</div>
                        <div style={{ fontFamily: T.serif, fontSize: 19 * T.serifSize, color: T.ink, marginTop: 4 }}>{v}</div>
                    </div>
                ))}
            </div>
        </Card>

        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.muted, margin: '0 4px 10px' }}>Momentos de hoy</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {day.moments.map(m => (
                <button key={m.slot} onClick={() => actions.setMoment(m.slot, !m.done)} style={{
                    display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: '14px 16px', borderRadius: 20,
                    border: `1px solid ${m.done ? T.accent : T.line2}`, background: T.surface, color: T.ink
                }}>
                    <span style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: m.done ? T.accent : 'transparent', border: m.done ? 'none' : `1.5px solid ${T.line}`, color: T.accentInk }}>
                        {m.done && <Icon n="check" size={17} />}
                    </span>
                    <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: T.accentText }}>{m.time} · {m.label}</span>
                        <span style={{ display: 'block', fontSize: 14, color: T.ink2, lineHeight: 1.45, marginTop: 3 }}>{m.text}</span>
                    </span>
                </button>
            ))}
        </div>
    </div>
);
