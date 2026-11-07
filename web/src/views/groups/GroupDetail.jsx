import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, GhostBtn, Icon, PrimaryBtn, Spinner, inputStyle } from '../../ui';
import { Avatar, INVITE_BASE, Kicker, TopBar, groupMeta, shareInvite, timeLabel } from './shared';

const Dot = ({ T, on }) => <span style={{ width: 14, height: 14, borderRadius: '50%', background: on ? '#0F9D63' : T.line, display: 'inline-block' }}></span>;

export const GroupDetail = ({ T, token, id, toast, onBack, onChapter }) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);
    const [question, setQuestion] = useState('');
    const [editQ, setEditQ] = useState(false);

    const load = async () => {
        try {
            const r = await api.call(`/groups.php?action=get&id=${id}`, 'GET', null, token);
            if (r.success) setData(r); else setError(true);
        } catch (e) { setError(true); }
    };
    useEffect(() => { load(); }, [id]);

    if (error) return <div><TopBar T={T} title="Grupo" onBack={onBack} /><p style={{ color: T.muted }}>No se pudo abrir el grupo.</p></div>;
    if (!data) return <div><TopBar T={T} title="Grupo" onBack={onBack} /><Spinner T={T} /></div>;

    const { group: g, members, recent } = data;
    const leader = g.role === 'leader';
    const active = g.status === 'active';

    const nudge = async (m) => {
        const r = await api.call('/groups.php?action=nudge', 'POST', { group_id: g.id, to_user_id: m.id }, token);
        if (r.success) { toast('Recordatorio enviado'); load(); }
    };
    const saveQ = async () => {
        const r = await api.call('/groups.php?action=question', 'POST', { group_id: g.id, text: question }, token);
        if (r.success) { setEditQ(false); toast('Pregunta fijada para hoy'); load(); }
    };
    const adopt = async () => {
        const r = await api.call('/groups.php?action=adopt', 'POST', { group_id: g.id }, token);
        if (r.success) toast('Ahora tu lectura de cada día es la del grupo');
    };
    const leave = async () => {
        if (!window.confirm(`¿Salir de ${g.name}?`)) return;
        const r = await api.call('/groups.php?action=leave', 'POST', { group_id: g.id }, token);
        if (r.success) onBack();
    };
    const copyCode = async () => {
        try { await navigator.clipboard.writeText(INVITE_BASE + g.invite_code); toast('Enlace copiado'); } catch (e) { toast(`Código: ${g.invite_code}`); }
    };

    return (
        <div className="anim-up">
            <TopBar T={T} title={g.name} onBack={onBack} />
            <p style={{ margin: '-6px 4px 16px', fontSize: 13, color: T.muted }}>{groupMeta(g)} · {g.book}, {g.pace === 1 ? 'un capítulo diario' : `${g.pace} capítulos diarios`}</p>

            <div style={{ borderRadius: 24, padding: 20, marginBottom: 14, background: T.pill ? T.surface : '#26211C', border: T.pill ? `1px solid ${T.line}` : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.pill ? T.accent : '#C9B8F0' }}>
                    {active ? `Hoy leemos juntos · Día ${g.day} de ${g.total_days}` : g.status === 'upcoming' ? 'Aún no empieza' : 'Plan terminado'}
                </div>
                <div style={{ fontFamily: T.serif, fontSize: 30 * T.serifSize, margin: '6px 0 2px', color: T.pill ? T.ink : '#F5F0E8' }}>{active ? g.reference : g.book}</div>
                {active && <div style={{ fontSize: 13, color: T.pill ? T.muted : '#CFC6BA' }}>{g.contributions_today} {g.contributions_today === 1 ? 'aporte' : 'aportes'} hoy</div>}
                {data.question && <div style={{ display: 'flex', gap: 8, marginTop: 12, fontSize: 14, lineHeight: 1.4, color: T.pill ? T.ink2 : '#E8E0D4' }}><Icon n="pin" size={16} style={{ flexShrink: 0, marginTop: 2 }} />{data.question}</div>}
                {active && <PrimaryBtn T={T} onClick={onChapter} style={{ width: '100%', marginTop: 16, background: T.pill ? T.accent : '#F5F0E8', color: T.pill ? T.accentInk : '#26211C' }}>Ver y aportar</PrimaryBtn>}
            </div>

            {leader && active && (
                editQ ? (
                    <Card T={T} style={{ padding: 14, marginBottom: 14 }}>
                        <textarea value={question} onChange={e => setQuestion(e.target.value)} maxLength={400} rows={3} placeholder="Una pregunta para el capítulo de hoy" style={{ ...inputStyle(T), height: 'auto', padding: 14, resize: 'none', fontFamily: 'inherit' }} />
                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <GhostBtn T={T} onClick={() => setEditQ(false)} style={{ flex: 1 }}>Cancelar</GhostBtn>
                            <PrimaryBtn T={T} disabled={!question.trim()} onClick={saveQ} style={{ flex: 1 }}>Fijar</PrimaryBtn>
                        </div>
                    </Card>
                ) : (
                    <GhostBtn T={T} onClick={() => { setQuestion(data.question || ''); setEditQ(true); }} style={{ width: '100%', marginBottom: 14 }}><Icon n="pin" size={17} />{data.question ? 'Cambiar la pregunta de hoy' : 'Fijar una pregunta para hoy'}</GhostBtn>
                )
            )}

            <Card T={T} style={{ padding: 16, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Kicker T={T}>Invitar</Kicker>
                    <span style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '.16em', color: T.ink, fontWeight: 700 }}>{g.invite_code}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <GhostBtn T={T} onClick={copyCode} style={{ flex: 1, height: 46 }}><Icon n="link" size={17} />Copiar enlace</GhostBtn>
                    <PrimaryBtn T={T} onClick={() => shareInvite(g, g.invite_code)} style={{ flex: 1, height: 46 }}><Icon n="send" size={17} />Compartir</PrimaryBtn>
                </div>
            </Card>

            <Card T={T} style={{ overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px 8px' }}>
                    <Kicker T={T} style={{ flex: 1 }}>Hoy</Kicker>
                    {['P', 'C', 'E'].map(l => <span key={l} style={{ width: 34, textAlign: 'center', fontSize: 11, fontWeight: 700, color: T.muted }}>{l}</span>)}
                </div>
                {members.map((m, i) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderTop: `1px solid ${T.line2}` }}>
                        <Avatar name={m.name} color={m.color} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, color: T.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.me ? 'Tú' : m.name}{m.role === 'leader' ? ' · líder' : ''}</div>
                            <div style={{ fontSize: 12, color: T.muted }}>{m.streak > 0 ? `${m.streak} ${m.streak === 1 ? 'día' : 'días'} seguidos` : 'Sin racha'}</div>
                        </div>
                        {!m.me && !m.today.read && active && (
                            <button disabled={m.nudged} onClick={() => nudge(m)} style={{ height: 32, padding: '0 12px', borderRadius: 16, border: 'none', background: T.accentSoft, color: T.accentText, fontSize: 12, fontWeight: 700, opacity: m.nudged ? .55 : 1 }}>{m.nudged ? 'Enviado' : 'Recordar'}</button>
                        )}
                        {[m.today.read, m.today.communion, m.today.examen].map((on, k) => <span key={k} style={{ width: 34, textAlign: 'center' }}><Dot T={T} on={on} /></span>)}
                    </div>
                ))}
                <div style={{ padding: '8px 16px 12px', fontSize: 11, color: T.faint }}>P Palabra · C Comunión · E Examen</div>
            </Card>

            <Kicker T={T} style={{ margin: '4px 4px 8px' }}>Lo que Dios les habló</Kicker>
            {recent.length === 0 && <p style={{ margin: '0 4px 16px', color: T.muted, fontSize: 14 }}>Sé el primero en compartir lo que Dios te habló.</p>}
            {recent.map(c => (
                <Card key={c.id} T={T} style={{ padding: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <Avatar name={c.author} color={c.color} size={30} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.ink, flex: 1 }}>{c.author}</span>
                        <span style={{ fontSize: 12, color: T.muted }}>{timeLabel(c.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.5, color: T.ink2 }}>{c.text}</div>
                    {c.amens > 0 && <div style={{ marginTop: 8, fontSize: 12, color: T.accentText, fontWeight: 700 }}>Amén · {c.amens}</div>}
                </Card>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
                {active && <GhostBtn T={T} onClick={adopt}><Icon n="book-open" size={17} />Usar este plan como mi lectura</GhostBtn>}
                <button onClick={leave} style={{ background: 'none', border: 'none', color: T.danger, fontSize: 14, fontWeight: 600, height: 44 }}>Salir del grupo</button>
            </div>
        </div>
    );
};
