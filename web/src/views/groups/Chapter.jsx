import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, GhostBtn, Icon, PrimaryBtn, Spinner, inputStyle } from '../../ui';
import { Avatar, Kicker, TopBar, timeLabel } from './shared';

const QUICK_REPLIES = ['Amén, me hacía falta leer esto.', 'Qué bueno lo que compartes.', 'Oro por eso que te turba.'];

const Contribution = ({ T, c, token, onChange }) => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState('');
    const amen = async () => { const r = await api.call('/contributions.php?action=amen', 'POST', { id: c.id }, token); if (r.success) onChange(); };
    const send = async (msg) => {
        const body = (msg ?? text).trim();
        if (!body) return;
        const r = await api.call('/contributions.php?action=comment', 'POST', { id: c.id, text: body }, token);
        if (r.success) { setText(''); setOpen(false); onChange(); }
    };
    return (
        <Card T={T} style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar name={c.author} color={c.color} />
                <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: T.ink }}>{c.is_me ? 'Tú' : c.author}</span>
                <span style={{ fontSize: 12, color: T.muted }}>{timeLabel(c.created_at)}</span>
            </div>
            {c.verse_ref && (
                <div style={{ borderLeft: `2px solid ${T.accent}`, paddingLeft: 12, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: T.accentText }}>{c.verse_ref}</div>
                    {c.verse_text && <div style={{ fontFamily: T.serif, fontSize: 16 * T.serifSize, color: T.ink2, marginTop: 2, lineHeight: 1.4 }}>{c.verse_text}</div>}
                </div>
            )}
            <div style={{ fontSize: 15, lineHeight: 1.55, color: T.ink }}>{c.text}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={amen} aria-pressed={c.i_amened} style={{ height: 36, padding: '0 14px', borderRadius: 18, border: c.i_amened ? 'none' : `1px solid ${T.line}`, background: c.i_amened ? T.accent : 'transparent', color: c.i_amened ? T.accentInk : T.ink, fontSize: 13, fontWeight: 700 }}>Amén{c.amens ? ` · ${c.amens}` : ''}</button>
                {!c.is_me && <button onClick={() => setOpen(!open)} style={{ height: 36, padding: '0 14px', borderRadius: 18, border: `1px solid ${T.line}`, background: 'transparent', color: T.ink, fontSize: 13, fontWeight: 700 }}>Animar</button>}
            </div>
            {c.comments.map(m => (
                <div key={m.id} style={{ marginTop: 8, padding: '8px 12px', borderRadius: 12, background: T.accentSoft, fontSize: 14, color: T.ink2, lineHeight: 1.45 }}>
                    <b style={{ color: T.ink }}>{m.author}</b> {m.text}
                </div>
            ))}
            {open && (
                <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {QUICK_REPLIES.map(q => <button key={q} onClick={() => send(q)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 12, border: `1px solid ${T.line2}`, background: T.surface, color: T.ink2, fontSize: 13 }}>{q}</button>)}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input value={text} onChange={e => setText(e.target.value)} placeholder="Escribe un ánimo" maxLength={1000} style={{ ...inputStyle(T), height: 44 }} />
                        <PrimaryBtn T={T} disabled={!text.trim()} onClick={() => send()} style={{ height: 44, padding: '0 16px' }}><Icon n="send" size={17} /></PrimaryBtn>
                    </div>
                </div>
            )}
        </Card>
    );
};

export const Chapter = ({ T, token, id, toast, onBack }) => {
    const [d, setD] = useState(null);
    const [composing, setComposing] = useState(false);
    const [verse, setVerse] = useState(null); // {chapter, n}
    const [text, setText] = useState('');
    const [showText, setShowText] = useState(false);
    const [busy, setBusy] = useState(false);

    const load = async () => {
        try { const r = await api.call(`/contributions.php?action=day&group_id=${id}`, 'GET', null, token); if (r.success) setD(r); } catch (e) {}
    };
    useEffect(() => { load(); }, [id]);

    if (!d) return <div><TopBar T={T} title="Capítulo del día" onBack={onBack} /><Spinner T={T} /></div>;

    const multi = d.day.chapter_end > d.day.chapter;
    const share = async () => {
        setBusy(true);
        const r = await api.call('/contributions.php?action=create', 'POST', { group_id: id, chapter: verse ? verse.chapter : d.day.chapter, verse: verse ? verse.n : null, text }, token);
        setBusy(false);
        if (r.success) { setComposing(false); setText(''); setVerse(null); toast('Compartido con el grupo'); load(); }
    };

    if (composing) {
        return (
            <div className="anim-up">
                <TopBar T={T} title="Aportar" onBack={() => setComposing(false)} />
                <Kicker T={T} style={{ margin: '0 4px 8px' }}>¿Qué versículo te habló? (opcional)</Kicker>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
                    {d.verses.map(v => {
                        const on = verse && verse.chapter === v.chapter && verse.n === v.n;
                        return (
                            <button key={v.chapter + ':' + v.n} onClick={() => setVerse(on ? null : { chapter: v.chapter, n: v.n })} style={{ textAlign: 'left', padding: '10px 14px', borderRadius: 14, border: `1.5px solid ${on ? T.accent : T.line2}`, background: on ? T.accentSoft : T.surface, color: T.ink2, fontSize: 14, lineHeight: 1.4 }}>
                                <b style={{ color: T.accentText }}>{multi ? `${v.chapter}:` : ''}{v.n}</b> {v.text}
                            </button>
                        );
                    })}
                </div>
                <textarea value={text} onChange={e => setText(e.target.value)} rows={5} maxLength={2000} placeholder="Lo que aprendí y cómo lo aplico" style={{ ...inputStyle(T), height: 'auto', padding: 16, resize: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
                <PrimaryBtn T={T} disabled={!text.trim() || busy} onClick={share} style={{ width: '100%', marginTop: 14 }}>Compartir con el grupo</PrimaryBtn>
            </div>
        );
    }

    return (
        <div className="anim-up">
            <TopBar T={T} title={d.day.reference || 'Capítulo del día'} onBack={onBack} />
            <p style={{ margin: '-6px 4px 14px', fontSize: 13, color: T.muted }}>{d.group.name} · Día {d.day.day} de {d.group.total_days} · {d.contributions.length} {d.contributions.length === 1 ? 'aporte' : 'aportes'}</p>

            {d.question && (
                <div style={{ borderRadius: 20, padding: 16, marginBottom: 14, background: T.pill ? T.surface : '#26211C', border: T.pill ? `1px solid ${T.line}` : 'none', display: 'flex', gap: 10, color: T.pill ? T.ink : '#F5F0E8', lineHeight: 1.45 }}>
                    <Icon n="pin" size={18} style={{ flexShrink: 0, marginTop: 2 }} />{d.question}
                </div>
            )}

            <GhostBtn T={T} onClick={() => setShowText(!showText)} style={{ width: '100%', marginBottom: 14 }}><Icon n="book-open" size={17} />{showText ? 'Ocultar el texto' : 'Leer el capítulo'}</GhostBtn>
            {showText && (
                <Card T={T} style={{ padding: 18, marginBottom: 14 }}>
                    {d.verses.length === 0 && <p style={{ margin: 0, color: T.muted }}>El texto bíblico aún no está cargado en el servidor.</p>}
                    {d.verses.map((v, i) => (
                        <p key={v.chapter + ':' + v.n} style={{ margin: '0 0 8px', fontFamily: T.serif, fontSize: 18 * T.serifSize, lineHeight: 1.55, color: T.ink }}>
                            {multi && v.n === 1 && <b style={{ display: 'block', margin: i ? '14px 0 6px' : '0 0 6px', color: T.accentText }}>Capítulo {v.chapter}</b>}
                            <sup style={{ color: T.accentText, fontWeight: 700, fontSize: 11, marginRight: 4 }}>{v.n}</sup>{v.text}
                        </p>
                    ))}
                </Card>
            )}

            {d.contributions.length === 0 && <p style={{ margin: '8px 4px 18px', color: T.muted, fontSize: 14 }}>Sé el primero en compartir lo que Dios te habló.</p>}
            {d.contributions.map(c => <Contribution key={c.id} T={T} c={c} token={token} onChange={load} />)}

            <p style={{ textAlign: 'center', margin: '20px 0 12px', fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: 15 * T.serifSize }}>“Y perseveraban… en la comunión unos con otros.” — Hechos 2:42</p>
            <PrimaryBtn T={T} onClick={() => { const mine = d.contributions.find(c => c.is_me); setText(mine ? mine.text : ''); setComposing(true); }} style={{ width: '100%' }}>
                {d.i_contributed ? 'Editar mi aporte' : 'Aportar lo que aprendí'}
            </PrimaryBtn>
        </div>
    );
};
