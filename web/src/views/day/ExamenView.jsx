import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { THEMES } from '../../theme';
import { Icon, IconBtn, PrimaryBtn } from '../../ui';

// El examen siempre va en tema Noche
export const ExamenView = ({ day, actions, go, token }) => {
    const T = THEMES.night;
    const [emotions, setEmotions] = useState([]);
    const [emotionId, setEmotionId] = useState(day.examen.emotion_id);
    const [learned, setLearned] = useState(day.examen.learned_check);
    const [communion, setCommunion] = useState(day.examen.communion_check);
    const [closed, setClosed] = useState(day.examen.closed);
    const [tomorrow, setTomorrow] = useState(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => { api.call('/checkin.php?action=emotions', 'GET', null, token).then(r => { if (r.success) setEmotions(r.emotions); }).catch(() => {}); }, []);
    useEffect(() => { document.body.style.background = T.bg; }, []);

    const moments = day.moments.filter(m => m.done).length;
    const checks = [
        { key: 'read', label: 'Leí la Palabra', hint: day.read_done ? day.reading.title : 'Toca para ir a la lectura', done: day.read_done, auto: true, onClick: () => !day.read_done && go('read') },
        { key: 'learned', label: 'Aprendí algo nuevo', hint: 'Lo que Dios me enseñó hoy', done: learned, onClick: () => setLearned(!learned) },
        { key: 'rhema', label: 'Mi palabra rema', hint: day.rhema ? day.rhema.reference : 'Sin versículo marcado hoy', done: !!day.rhema, auto: true, onClick: () => !day.rhema && go('read') },
        { key: 'communion', label: 'Viví en comunión', hint: `${moments} de 3 momentos`, done: communion, onClick: () => setCommunion(!communion) },
    ];

    const close = async () => {
        setBusy(true);
        const res = await actions.closeExamen({ learned_check: learned, communion_check: communion, emotion_id: emotionId });
        setBusy(false);
        if (res && res.success) { setTomorrow(res.tomorrow); setClosed(true); }
    };

    const back = () => { document.body.style.background = ''; go('today'); };
    const serif = { fontFamily: T.serif, fontWeight: 400, color: T.ink };

    return (
        <div className="anim-up" style={{ minHeight: '100dvh', background: T.bg, color: T.ink, fontFamily: T.sans, margin: 'calc(-1 * max(16px, env(safe-area-inset-top))) -16px 0', padding: 'max(16px, env(safe-area-inset-top)) 16px 120px', boxSizing: 'border-box' }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
                <IconBtn T={T} n={closed ? 'x' : 'chevron-left'} onClick={back} label="Cerrar" />

                {closed ? (
                    <div style={{ textAlign: 'center', padding: '56px 8px 0' }}>
                        <Icon n="moon-star" size={40} style={{ color: T.accent }} />
                        <h1 style={{ ...serif, fontSize: 44 * T.serifSize, margin: '18px 0 6px' }}>Descansa en Él.</h1>
                        <div style={{ fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase', color: T.muted }}>Salmos 4:8</div>
                        {tomorrow && (
                            <div style={{ marginTop: 36, textAlign: 'left', background: T.surface, border: `1px solid ${T.line}`, borderRadius: 24, padding: 20 }}>
                                <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: T.accent }}>Mañana a las {tomorrow.time}</div>
                                <div style={{ ...serif, fontSize: 28 * T.serifSize, marginTop: 6 }}>{tomorrow.title}</div>
                                <div style={{ fontSize: 14, color: T.muted, marginTop: 6, lineHeight: 1.45 }}>{tomorrow.reason}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div style={{ padding: '22px 4px 18px' }}>
                            <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: T.accent }}>Examen del día</div>
                            <h1 style={{ ...serif, fontSize: 38 * T.serifSize, lineHeight: 1.05, margin: '8px 0 0' }}>Antes de dormir, mira tu día con Él.</h1>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {checks.map(c => (
                                <button key={c.key} onClick={c.onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: '14px 16px', borderRadius: 24, border: `1px solid ${T.line}`, background: T.surface, color: T.ink }}>
                                    <span style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.done ? T.accent : 'transparent', border: c.done ? 'none' : `1.5px solid ${T.faint}`, color: T.accentInk }}>
                                        {c.done && <Icon n="check" size={16} />}
                                    </span>
                                    <span>
                                        <span style={{ display: 'block', fontSize: 16, fontWeight: 500 }}>{c.label}</span>
                                        <span style={{ display: 'block', fontSize: 13, color: T.muted, marginTop: 2 }}>{c.hint}</span>
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div style={{ ...serif, fontSize: 26 * T.serifSize, margin: '28px 4px 12px' }}>¿Cómo te sentiste hoy?</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {emotions.map(e => {
                                const on = emotionId === e.id;
                                return (
                                    <button key={e.id} onClick={() => setEmotionId(on ? null : e.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 20, border: `1px solid ${on ? T.accent : T.line}`, background: on ? T.accentSoft : 'transparent', color: on ? T.accentText : T.ink2, fontSize: 14, fontWeight: 500 }}>
                                        <span style={{ width: 9, height: 9, borderRadius: '50%', background: e.color }}></span>{e.name_es}
                                    </button>
                                );
                            })}
                        </div>
                        <p style={{ margin: '14px 4px 0', fontSize: 13, color: T.muted, lineHeight: 1.5 }}>
                            Mañana leerás {day.settings.reading_mode === 'feeling' ? 'un pasaje según cómo te sientes' : 'lo que sigue en tu plan'}.
                        </p>

                        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: T.bg, borderTop: `1px solid ${T.line}`, zIndex: 40 }}>
                            <div style={{ maxWidth: 560, margin: '0 auto' }}>
                                <PrimaryBtn T={T} onClick={close} disabled={busy} style={{ width: '100%' }}>Cerrar el día</PrimaryBtn>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
