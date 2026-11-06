import React, { useState } from 'react';
import { IconBtn, PrimaryBtn } from '../../ui';

const Field = ({ T, label, value, onChange, placeholder }) => (
    <label style={{ display: 'block', marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{label}</div>
        <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} maxLength={4000} style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical', borderRadius: 16, border: `1px solid ${T.line}`, background: T.surface,
            color: T.ink, padding: '14px 16px', fontFamily: T.serif, fontSize: 17 * T.serifSize, lineHeight: 1.45, outline: 'none'
        }} />
    </label>
);

export const DevoView = ({ T, day, actions, go, toast }) => {
    const [learned, setLearned] = useState(day.devotional.learned);
    const [apply, setApply] = useState(day.devotional.apply);
    const [prayer, setPrayer] = useState(day.devotional.prayer);
    const [busy, setBusy] = useState(false);

    const save = async () => {
        setBusy(true);
        const res = await actions.saveDevotional({ learned, apply, prayer });
        setBusy(false);
        if (res && res.success) { toast('Guardado. Llévala contigo hoy.'); go('today'); }
        else toast('No se pudo guardar. Inténtalo de nuevo.');
    };

    return (
        <div className="anim-up" style={{ paddingBottom: 96 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <IconBtn T={T} n="chevron-left" onClick={() => go('read')} label="Atrás" />
                <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 24 * T.serifSize, color: T.ink }}>Mi devocional</h2>
            </div>

            <div style={{ borderRadius: 24, padding: 22, marginBottom: 20, background: T.pill ? T.surface : '#26211C', border: T.pill ? `1px solid ${T.line}` : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.pill ? T.accent : '#C9B8F0' }}>Mi palabra rema</div>
                {day.rhema ? (
                    <>
                        {day.rhema.text && <p style={{ margin: '10px 0 8px', fontFamily: T.serif, fontSize: 21 * T.serifSize, lineHeight: 1.35, color: T.pill ? T.ink : '#F5F0E8' }}>“{day.rhema.text}”</p>}
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: T.pill ? T.muted : '#CFC6BA' }}>{day.rhema.reference}</div>
                    </>
                ) : (
                    <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: T.pill ? T.muted : '#CFC6BA' }}>
                        No marcaste un versículo hoy. Puedes volver a <button onClick={() => go('read')} style={{ background: 'none', border: 'none', padding: 0, color: T.pill ? T.accent : '#C9B8F0', fontWeight: 700, textDecoration: 'underline' }}>la lectura</button> y tocar el que te habló.
                    </p>
                )}
            </div>

            <Field T={T} label="¿Qué aprendí?" value={learned} onChange={setLearned} placeholder="Lo que Dios me mostró…" />
            <Field T={T} label="¿Cómo lo aplico hoy?" value={apply} onChange={setApply} placeholder="Un paso concreto para hoy…" />
            <Field T={T} label="Mi oración" value={prayer} onChange={setPrayer} placeholder="Señor…" />

            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: T.bg, borderTop: `1px solid ${T.line2}`, zIndex: 40 }}>
                <div style={{ maxWidth: 560, margin: '0 auto' }}>
                    <PrimaryBtn T={T} onClick={save} disabled={busy} style={{ width: '100%' }}>Guardar y llevarla conmigo</PrimaryBtn>
                </div>
            </div>
        </div>
    );
};
