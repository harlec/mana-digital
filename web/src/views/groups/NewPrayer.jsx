import React, { useState } from 'react';
import { api } from '../../config';
import { PrimaryBtn, inputStyle, Icon } from '../../ui';
import { KINDS, Kicker, TopBar } from './shared';

const NEEDS = [['prayer', 'Oración'], ['encouragement', 'Palabra de aliento'], ['help', 'Ayuda concreta']];
const WHO = [['group', 'Todo el grupo'], ['leader', 'Solo el líder'], ['anonymous', 'Anónimo']];

export const NewPrayer = ({ T, token, group, toast, onBack, onDone }) => {
    const [kind, setKind] = useState('spiritual');
    const [text, setText] = useState('');
    const [needs, setNeeds] = useState(['prayer']);
    const [visibility, setVisibility] = useState('group');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);

    const toggleNeed = (n) => setNeeds(needs.includes(n) ? needs.filter(x => x !== n) : [...needs, n]);
    const send = async () => {
        setBusy(true); setError(false);
        const r = await api.call('/prayers.php?action=create', 'POST', { group_id: group.id, kind, text, needs: needs.length ? needs : ['prayer'], visibility }, token);
        setBusy(false);
        if (!r.success) return setError(true);
        toast(r.under_review ? 'Compartido, pero solo lo ve el líder por los datos que incluye' : 'Compartido con confianza');
        onDone();
    };
    const chip = (on) => ({ minHeight: 46, padding: '0 14px', borderRadius: 14, border: `1.5px solid ${on ? T.accent : T.line2}`, background: on ? T.accentSoft : T.surface, color: T.ink, fontSize: 14, fontWeight: 600 });

    return (
        <div className="anim-up">
            <TopBar T={T} title="Nueva petición" onBack={onBack} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {Object.entries(KINDS).map(([k, v]) => (
                    <button key={k} onClick={() => setKind(k)} style={{ ...chip(kind === k), height: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Icon n={v.icon} size={20} style={{ color: v.fg }} />{v.label}
                    </button>
                ))}
            </div>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={5} maxLength={2000} placeholder="Cuéntalo con confianza. Estás entre hermanos." style={{ ...inputStyle(T), height: 'auto', padding: 16, resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, marginTop: 16 }} />
            <Kicker T={T} style={{ margin: '18px 4px 8px' }}>¿Qué necesitas?</Kicker>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {NEEDS.map(([n, l]) => <button key={n} onClick={() => toggleNeed(n)} style={chip(needs.includes(n))}>{l}</button>)}
            </div>
            <Kicker T={T} style={{ margin: '18px 4px 8px' }}>¿Quién lo ve?</Kicker>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {WHO.map(([v, l]) => <button key={v} onClick={() => setVisibility(v)} style={chip(visibility === v)}>{l}</button>)}
            </div>
            {visibility === 'anonymous' && <p style={{ margin: '8px 4px 0', fontSize: 12, color: T.muted }}>Nadie verá tu nombre en la pantalla, tampoco el líder.</p>}
            {error && <p style={{ color: T.danger, fontSize: 14 }}>No se pudo enviar. Intenta de nuevo.</p>}
            <PrimaryBtn T={T} disabled={!text.trim() || busy} onClick={send} style={{ width: '100%', marginTop: 20 }}>Pedir oración y apoyo</PrimaryBtn>
        </div>
    );
};
