import React, { useState } from 'react';
import { GhostBtn, PrimaryBtn, Segmented, inputStyle } from '../ui';

// ============ CHECK-IN ============
export const CheckinSheet = ({ T, emotions, lang, t, user, onSubmit, onSkip }) => {
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');
    const [contentPref, setContentPref] = useState('verse');
    const night = T.name === 'night';
    const today = new Date().toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="anim-fade" style={{ position: 'fixed', inset: 0, zIndex: 50, background: T.overlay, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div className="anim-up" style={{ width: '100%', maxWidth: 560, maxHeight: '92dvh', overflowY: 'auto', background: T.bg, borderRadius: '32px 32px 0 0', padding: '12px 24px calc(28px + env(safe-area-inset-bottom))', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: T.sans, color: T.ink }}>
                <div style={{ width: 40, height: 5, borderRadius: 3, background: T.line, alignSelf: 'center' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: night ? T.accent : T.muted }}>
                        {night && user ? `${t.hello}, ${user.name.split(' ')[0]}` : today}
                    </div>
                    <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 32 * T.serifSize, lineHeight: 1.08 }}>{t.howFeeling}</h2>
                </div>
                <div style={night ? { display: 'flex', flexWrap: 'wrap', gap: 10 } : { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
                    {emotions.map(e => {
                        const on = selected === e.id;
                        return (
                            <button key={e.id} onClick={() => setSelected(e.id)} aria-pressed={on} style={{
                                height: night ? 44 : 48, borderRadius: night ? 22 : 14, padding: night ? '0 16px' : '0 12px',
                                display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, textAlign: 'left',
                                border: `1px solid ${on ? (night ? T.ink : T.accent) : T.line}`,
                                background: on ? (night ? T.ink : T.accentSoft) : (night ? 'transparent' : T.surface),
                                color: on && night ? T.bg : T.ink, transition: 'all .15s'
                            }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: e.color || T.accent, flexShrink: 0 }}></span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lang === 'es' ? e.name_es : e.name_en}</span>
                            </button>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.muted }}>{t.receive}</div>
                    <Segmented T={T} value={contentPref} onChange={setContentPref} options={[{ value: 'verse', label: t.verse, icon: 'book-open' }, { value: 'story', label: t.story, icon: 'scroll-text' }]} />
                </div>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.notes} style={inputStyle(T)} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                    <GhostBtn T={T} onClick={onSkip} style={{ height: 56 }}>{t.skip}</GhostBtn>
                    <PrimaryBtn T={T} disabled={!selected} onClick={() => selected && onSubmit(selected, notes, contentPref)}>{t.submit}</PrimaryBtn>
                </div>
            </div>
        </div>
    );
};

