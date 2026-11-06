import React, { useState, useEffect, useRef } from 'react';
import { Icon, IconBtn, PrimaryBtn, Segmented } from '../../ui';

export const ReadView = ({ T, day, actions, go }) => {
    const r = day.reading;
    const [rhema, setRhema] = useState(day.rhema ? { chapter: day.rhema.chapter, verse: day.rhema.verse } : null);
    const [speaking, setSpeaking] = useState(false);
    const [busy, setBusy] = useState(false);
    const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const rhemaKey = useRef(null);

    useEffect(() => () => { if (canSpeak) window.speechSynthesis.cancel(); }, []);
    useEffect(() => { // al cambiar de lectura, el rhema anterior ya no aplica
        const key = `${r.book_id}:${r.chapter}`;
        if (rhemaKey.current && rhemaKey.current !== key) setRhema(null);
        rhemaKey.current = key;
        if (canSpeak) { window.speechSynthesis.cancel(); setSpeaking(false); }
    }, [r.book_id, r.chapter]);

    const toggleAudio = () => {
        if (!canSpeak) return;
        if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
        const u = new SpeechSynthesisUtterance(`${r.title}. ` + r.verses.map(v => v.text).join(' '));
        u.lang = 'es-ES'; u.rate = 0.9;
        u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
        window.speechSynthesis.speak(u); setSpeaking(true);
    };

    const finish = async () => {
        setBusy(true);
        await actions.markRead(rhema);
        setBusy(false);
        go('devo');
    };

    const multi = r.chapter_end > r.chapter;
    let lastChapter = null;

    return (
        <div className="anim-up" style={{ paddingBottom: 96 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                <IconBtn T={T} n="chevron-left" onClick={() => go('today')} label="Atrás" />
                <div style={{ flex: 1 }}>
                    <Segmented T={T} value={r.source} onChange={(v) => actions.setSource(v)}
                        options={[{ value: 'plan', label: 'Mi plan' }, { value: 'feeling', label: 'Según ayer' }]} />
                </div>
                {canSpeak && r.has_text && <IconBtn T={T} n={speaking ? 'pause' : 'headphones'} active onClick={toggleAudio} label="Escuchar" />}
            </div>

            <div style={{ padding: '0 4px' }}>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.45 }}>{r.reason}</div>
                <h1 style={{ margin: '6px 0 16px', fontFamily: T.serif, fontWeight: 400, fontSize: 34 * T.serifSize, lineHeight: 1.05, color: T.ink }}>{r.title}</h1>

                {!r.has_text && (
                    <div style={{ padding: 18, borderRadius: 18, background: T.accentSoft, color: T.accentText, fontSize: 14, lineHeight: 1.5 }}>
                        El texto de este pasaje aún no está cargado. Puedes leer <b>{r.title}</b> en tu Biblia y marcar “Terminé de leer”.
                    </div>
                )}

                {r.verses.map(v => {
                    const first = multi && v.chapter !== lastChapter; lastChapter = v.chapter;
                    const on = rhema && rhema.chapter === v.chapter && rhema.verse === v.n;
                    return (
                        <React.Fragment key={`${v.chapter}:${v.n}`}>
                            {first && <div style={{ margin: '14px 0 6px', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: T.accentText }}>Capítulo {v.chapter}</div>}
                            <button onClick={() => setRhema(on ? null : { chapter: v.chapter, verse: v.n })} style={{
                                display: 'block', width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '8px 10px', margin: '2px -10px',
                                background: on ? T.accentSoft : 'transparent', color: T.ink, fontFamily: T.serif, fontSize: 20 * T.serifSize, lineHeight: 1.5
                            }}>
                                <sup style={{ fontFamily: T.sans, fontSize: 11, fontWeight: 700, color: T.accentText, marginRight: 6 }}>{v.n}</sup>{v.text}
                            </button>
                        </React.Fragment>
                    );
                })}

                {r.has_text && r.version && <div style={{ marginTop: 14, fontSize: 12, color: T.faint }}>{r.version}</div>}
                {r.has_text && (
                    <p style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '18px 0 0', fontSize: 13, color: T.muted }}>
                        <Icon n="sparkles" size={15} />Toca el versículo que Dios te hable: será tu palabra rhema de hoy.
                    </p>
                )}
            </div>

            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px calc(12px + env(safe-area-inset-bottom))', background: T.bg, borderTop: `1px solid ${T.line2}`, zIndex: 40 }}>
                <div style={{ maxWidth: 560, margin: '0 auto' }}>
                    <PrimaryBtn T={T} onClick={finish} disabled={busy} style={{ width: '100%' }}>Terminé de leer</PrimaryBtn>
                </div>
            </div>
        </div>
    );
};
