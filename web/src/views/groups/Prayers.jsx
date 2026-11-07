import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, GhostBtn, Icon, PrimaryBtn, Spinner, inputStyle } from '../../ui';
import { Avatar, KINDS, KindTag, TopBar, OFFER_TYPES, offerLabel, timeLabel } from './shared';

const VERSES = ['“Echa sobre Jehová tu carga, y él te sustentará.” — Salmos 55:22', '“No temas, porque yo estoy contigo.” — Isaías 41:10', '“Llevad los unos las cargas de los otros.” — Gálatas 6:2'];

const Prayer = ({ T, p, token, onChange, toast }) => {
    const [panel, setPanel] = useState(null); // 'encourage' | 'help' | 'answered'
    const [text, setText] = useState('');
    const [type, setType] = useState('food');
    const call = (a, body) => api.call(`/prayers.php?action=${a}`, 'POST', { id: p.id, ...body }, token);
    const done = (msg) => { setPanel(null); setText(''); if (msg) toast(msg); onChange(); };

    const pill = (on) => ({ height: 40, padding: '0 14px', borderRadius: 14, border: on ? 'none' : `1px solid ${T.line}`, background: on ? '#26211C' : 'transparent', color: on ? '#fff' : T.ink, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 });

    return (
        <Card T={T} style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Avatar name={p.initial} color={p.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{p.author}{p.visibility === 'leader' && ' · solo líder'}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{timeLabel(p.created_at)}</div>
                </div>
                <KindTag kind={p.kind} />
                {!p.is_me && <button onClick={async () => { if (window.confirm('¿Reportar esta petición al líder del grupo?')) { const r = await api.call('/leader.php?action=report', 'POST', { target_type: 'prayer', target_id: p.id }, token); if (r.success) toast('Reporte enviado al líder'); } }} aria-label="Reportar" style={{ height: 32, width: 32, borderRadius: 16, border: 'none', background: 'transparent', color: T.faint }}><Icon n="flag" size={15} /></button>}
            </div>
            {p.under_review && <div style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 12, background: '#FBF1DC', color: '#8A5A12', fontSize: 13, lineHeight: 1.4 }}>Tu mensaje parece incluir datos de cuenta, teléfono o enlaces, así que solo lo ven tú y el líder. Para pedir ayuda concreta, usa “Puedo ayudar”: se coordina en privado.</div>}
            <div style={{ fontSize: 15, lineHeight: 1.55, color: T.ink }}>{p.text}</div>

            {p.offers.length > 0 && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {p.offers.map(o => (
                        <div key={o.id} style={{ padding: '8px 12px', borderRadius: 12, background: '#E3F4EC', color: '#0F5F43', fontSize: 14, lineHeight: 1.4 }}>
                            <b>{o.mine ? 'Tú' : o.author}</b> ofreció {offerLabel(o.type).toLowerCase()}{o.detail ? `: ${o.detail}` : ''}
                        </div>
                    ))}
                </div>
            )}
            {p.my_offer && !p.offers.length && <div style={{ marginTop: 10, fontSize: 13, color: '#0F5F43' }}>Ofreciste {offerLabel(p.my_offer.type).toLowerCase()}. Solo {p.author} y el líder lo ven.</div>}
            {p.comments.map(m => (
                <div key={m.id} style={{ marginTop: 8, padding: '8px 12px', borderRadius: 12, background: T.accentSoft, fontSize: 14, color: T.ink2, lineHeight: 1.45 }}><b style={{ color: T.ink }}>{m.author}</b> {m.text}</div>
            ))}

            {!p.is_me ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button onClick={async () => { await call('pray'); onChange(); }} aria-pressed={p.i_praying} style={pill(p.i_praying)}><Icon n="hand-heart" size={16} />Oraré{p.praying ? ` · ${p.praying}` : ''}</button>
                    {p.needs.includes('encouragement') && <button onClick={() => setPanel(panel === 'encourage' ? null : 'encourage')} style={pill(false)}>Aliento</button>}
                    {p.needs.includes('help') && <button onClick={() => setPanel(panel === 'help' ? null : 'help')} style={pill(false)}>Puedo ayudar</button>}
                </div>
            ) : (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 13, color: T.muted, marginBottom: 8 }}>{p.praying > 0 ? `${p.praying} ${p.praying === 1 ? 'persona oró' : 'personas oraron'} por esto.` : 'Aún nadie ha orado por esto.'}</div>
                    {p.stale && <div style={{ fontSize: 14, color: T.ink, marginBottom: 8 }}>Hace más de 30 días de esta petición. ¿Dios respondió?</div>}
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setPanel(panel === 'answered' ? null : 'answered')} style={{ ...pill(false), flex: 1, justifyContent: 'center', background: '#FBF1DC', border: 'none', color: '#8A5A12' }}><Icon n="sparkles" size={16} />Dios respondió</button>
                        <button onClick={async () => { if (window.confirm('¿Cerrar esta petición?')) { await call('close'); done(); } }} style={pill(false)}>Cerrar</button>
                    </div>
                </div>
            )}

            {panel === 'encourage' && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
                        {VERSES.map(v => <button key={v} onClick={() => setText(v)} style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 12, border: `1px solid ${T.line2}`, background: T.surface, color: T.ink2, fontSize: 13, lineHeight: 1.4 }}>{v}</button>)}
                    </div>
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={1000} placeholder="Una palabra de aliento" style={{ ...inputStyle(T), height: 'auto', padding: 14, resize: 'none', fontFamily: 'inherit' }} />
                    <PrimaryBtn T={T} disabled={!text.trim()} onClick={async () => { const r = await call('encourage', { text }); if (r.success) done('Aliento enviado'); }} style={{ width: '100%', marginTop: 8, height: 48 }}>Enviar aliento</PrimaryBtn>
                </div>
            )}
            {panel === 'help' && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                        {OFFER_TYPES.map(([v, l]) => <button key={v} onClick={() => setType(v)} style={{ height: 42, borderRadius: 12, border: `1.5px solid ${type === v ? T.accent : T.line2}`, background: type === v ? T.accentSoft : T.surface, color: T.ink, fontSize: 13, fontWeight: 600 }}>{l}</button>)}
                    </div>
                    <input value={text} onChange={e => setText(e.target.value)} maxLength={300} placeholder="Detalle (opcional)" style={{ ...inputStyle(T), height: 46 }} />
                    <p style={{ margin: '8px 2px', fontSize: 12, color: T.muted }}>Solo {p.author} y el líder verán tu ofrecimiento. Coordinan en privado; no publiques cuentas ni teléfonos aquí.</p>
                    <PrimaryBtn T={T} onClick={async () => { const r = await call('offer', { type, detail: text }); if (r.success) done('Ofrecimiento enviado'); }} style={{ width: '100%', height: 48 }}>Ofrecer ayuda</PrimaryBtn>
                </div>
            )}
            {panel === 'answered' && (
                <div style={{ marginTop: 12 }}>
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={2000} placeholder="¿Cómo respondió Dios?" style={{ ...inputStyle(T), height: 'auto', padding: 14, resize: 'none', fontFamily: 'inherit' }} />
                    <PrimaryBtn T={T} disabled={!text.trim()} onClick={async () => { const r = await call('answered', { testimony: text }); if (r.success) done('Gloria a Dios. Ya está en Testimonios.'); }} style={{ width: '100%', marginTop: 8, height: 48, background: '#B7791F', color: '#fff' }}>Compartir el testimonio</PrimaryBtn>
                </div>
            )}
        </Card>
    );
};

export const Prayers = ({ T, token, group, toast, onBack, onNew }) => {
    const [kind, setKind] = useState('');
    const [list, setList] = useState(null);
    const load = async () => {
        try { const r = await api.call(`/prayers.php?action=list&group_id=${group.id}${kind ? `&kind=${kind}` : ''}`, 'GET', null, token); setList(r.success ? r.prayers : []); } catch (e) { setList([]); }
    };
    useEffect(() => { load(); }, [kind]);

    return (
        <div className="anim-up">
            <TopBar T={T} title="Peticiones y ayuda" onBack={onBack} />
            <p style={{ margin: '-4px 4px 14px', fontFamily: T.serif, fontStyle: 'italic', color: T.muted, fontSize: 15 * T.serifSize, lineHeight: 1.4 }}>“Y tenían todas las cosas en común.” — Hechos 2:44</p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12 }}>
                {[['', 'Todas'], ...Object.entries(KINDS).map(([k, v]) => [k, v.label])].map(([k, l]) => (
                    <button key={k} onClick={() => setKind(k)} style={{ height: 38, padding: '0 16px', borderRadius: 19, border: 'none', flexShrink: 0, background: kind === k ? '#26211C' : T.accentSoft, color: kind === k ? '#fff' : T.accentText, fontSize: 14, fontWeight: 600 }}>{l}</button>
                ))}
            </div>
            {!list && <Spinner T={T} />}
            {list && list.length === 0 && <p style={{ margin: '24px 8px', textAlign: 'center', color: T.muted, lineHeight: 1.5 }}>No hay peticiones abiertas. Comparte una con confianza: estás entre hermanos.</p>}
            {list && list.map(p => <Prayer key={p.id} T={T} p={p} token={token} onChange={load} toast={toast} />)}
            <PrimaryBtn T={T} onClick={onNew} style={{ width: '100%', marginTop: 8 }}><Icon n="plus" size={18} />Compartir una petición</PrimaryBtn>
        </div>
    );
};
