import React, { useState } from 'react';
import { THEMES } from '../../theme';
import { Icon, PrimaryBtn } from '../../ui';

const STEPS = [
    { kicker: 'Bienvenido a Maná', title: 'Un día entero con Dios, no solo un versículo.', rows: [['sun', 'Mañana · La Palabra', 'Lee, marca tu versículo y escribe lo que aprendiste.'], ['sparkles', 'Durante el día · Comunión', '3 momentos suaves para orar sin cesar.'], ['moon-star', 'Noche · Examen', 'Cierra tu día con Él y prepara el de mañana.']] },
    { kicker: 'Un hábito con sentido', title: 'Perseverar, un día a la vez.', sub: 'Constancia, no perfección.', rows: [['flame', 'Tu racha', 'Cuenta los días seguidos que lees la Palabra.'], ['notebook-pen', 'Tu diario', 'Guarda lo que Dios te habló.'], ['book-open', 'Tu plan', 'Un libro de la Biblia, a tu ritmo.']] },
];

export const Welcome = ({ day, actions }) => {
    const dark = THEMES.night;
    const T = THEMES.day;
    const [step, setStep] = useState(0);
    const [mode, setMode] = useState(day.settings.reading_mode);
    const [times, setTimes] = useState('normal');
    const TIMES = { early: ['06:00', '21:00', 'Temprano'], normal: ['07:00', '21:30', 'Normal'], late: ['08:30', '22:30', 'Tarde'] };

    const finish = async () => { const [m, e] = TIMES[times]; await actions.saveSettings({ reading_mode: mode, morning_time: m, examen_time: e, onboarded: true }); };
    const skip = () => actions.saveSettings({ onboarded: true });
    const night = step === 3;
    const C = night ? dark : T;

    const Row = ({ icon, title, sub, on, onClick }) => (
        <button onClick={onClick} disabled={!onClick} style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', padding: 16, borderRadius: 20, border: `1.5px solid ${on ? C.accent : C.line}`, background: on ? C.accentSoft : C.surface, color: C.ink }}>
            <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: C.accentSoft, color: C.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n={icon} size={19} /></span>
            <span><span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{title}</span>{sub && <span style={{ display: 'block', fontSize: 13, color: C.muted, marginTop: 2 }}>{sub}</span>}</span>
        </button>
    );

    let kicker, title, sub, body;
    if (step < 2) { ({ kicker, title, sub } = STEPS[step]); body = STEPS[step].rows.map(r => <Row key={r[1]} icon={r[0]} title={r[1]} sub={r[2]} />); }
    else if (step === 2) {
        kicker = 'Para empezar'; title = '¿Cómo quieres leer?';
        body = [['plan', 'book-open', 'Con un plan', 'Un libro de la Biblia, un capítulo a la vez.'], ['feeling', 'heart-pulse', 'Según cómo me siento', 'Cada mañana, un pasaje según tu examen de anoche.']]
            .map(([v, i, t, s]) => <Row key={v} icon={i} title={t} sub={s} on={mode === v} onClick={() => setMode(v)} />);
    } else {
        kicker = 'Recordatorios'; title = '¿Cuándo te acompañamos?';
        body = Object.entries(TIMES).map(([k, [m, e, label]]) => <Row key={k} icon="sunrise" title={label} sub={`Mañana ${m} · Examen ${e}`} on={times === k} onClick={() => setTimes(k)} />);
    }

    return (
        <div style={{ minHeight: '100dvh', background: C.bg, color: C.ink, fontFamily: C.sans, transition: 'background .4s' }}>
            <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 28px 40px', boxSizing: 'border-box', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ textAlign: 'right', height: 44 }}><button onClick={skip} style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: C.muted, height: 44 }}>Saltar</button></div>
                <div style={{ flex: 1, paddingTop: 16 }} className="anim-up" key={step}>
                    <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: C.accentText }}>{kicker}</div>
                    <h1 style={{ margin: '10px 0 8px', fontFamily: C.serif, fontWeight: 400, fontSize: 40 * C.serifSize, lineHeight: 1.05 }}>{title}</h1>
                    {sub && <p style={{ margin: '0 0 8px', fontSize: 16, color: C.muted }}>{sub}</p>}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>{body}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '24px 0 16px' }}>
                    {[0, 1, 2, 3].map(i => <span key={i} style={{ width: i === step ? 22 : 6, height: 6, borderRadius: 3, background: i === step ? C.accent : C.line }}></span>)}
                </div>
                <PrimaryBtn T={C} onClick={() => step < 3 ? setStep(step + 1) : finish()}>{step < 3 ? 'Continuar' : 'Empezar mi día con Dios'}</PrimaryBtn>
            </div>
        </div>
    );
};
