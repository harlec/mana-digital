import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, GhostBtn, Icon, PrimaryBtn, Spinner, Toggle, inputStyle } from '../../ui';
import { Avatar, Kicker, TopBar } from './shared';

const Kpi = ({ T, value, label }) => (
    <div style={{ flex: 1, padding: '14px 8px', borderRadius: 18, background: T.surface, border: `1px solid ${T.line2}`, textAlign: 'center' }}>
        <div style={{ fontFamily: T.serif, fontSize: 26 * T.serifSize, color: T.ink }}>{value}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2, lineHeight: 1.2 }}>{label}</div>
    </div>
);

const CareRow = ({ T, m, groupId, token, dflt, toast }) => {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState(dflt);
    const [sent, setSent] = useState(false);
    const send = async () => {
        const r = await api.call('/leader.php?action=care-message', 'POST', { group_id: groupId, user_id: m.user_id, text }, token);
        if (r.success) { setSent(true); setOpen(false); toast('Mensaje enviado en privado'); }
    };
    return (
        <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.line2}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={m.name} color={m.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{m.reason}</div>
                </div>
                <button disabled={sent} onClick={() => setOpen(!open)} style={{ height: 34, padding: '0 14px', borderRadius: 17, border: 'none', background: T.accentSoft, color: T.accentText, fontSize: 13, fontWeight: 700, opacity: sent ? .55 : 1 }}>{sent ? 'Enviado' : 'Escribirle'}</button>
            </div>
            {open && (
                <div style={{ marginTop: 10 }}>
                    <textarea value={text} onChange={e => setText(e.target.value)} rows={3} maxLength={300} style={{ ...inputStyle(T), height: 'auto', padding: 12, resize: 'none', fontFamily: 'inherit', fontSize: 15 }} />
                    <PrimaryBtn T={T} onClick={send} disabled={!text.trim()} style={{ width: '100%', marginTop: 8, height: 46 }}>Enviar en privado</PrimaryBtn>
                </div>
            )}
        </div>
    );
};

export const Leader = ({ T, token, group, toast, onBack, onSafety, onMeeting, onWeekly }) => {
    const [d, setD] = useState(null);
    const [q, setQ] = useState('');
    const load = async () => { try { const r = await api.call(`/leader.php?action=dashboard&group_id=${group.id}`, 'GET', null, token); if (r.success) { setD(r); setQ(r.question_tomorrow || ''); } } catch (e) {} };
    useEffect(() => { load(); }, []);
    if (!d) return <div><TopBar T={T} title="Panel del líder" onBack={onBack} /><Spinner T={T} /></div>;
    const k = d.kpis;
    const saveQ = async () => {
        const r = await api.call('/leader.php?action=question', 'POST', { group_id: group.id, text: q, when: 'tomorrow' }, token);
        if (r.success) { toast('Pregunta programada para mañana a las 6:00'); load(); }
    };

    return (
        <div className="anim-up">
            <TopBar T={T} title="Panel del líder" onBack={onBack} />
            <p style={{ margin: '-6px 4px 14px', fontSize: 13, color: T.muted }}>{d.group.name}</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <Kpi T={T} value={`${k.reads_week}/${k.reads_possible}`} label="lecturas de la semana" />
                <Kpi T={T} value={k.contributions_today} label="aportes de hoy" />
                <Kpi T={T} value={k.open_prayers} label="peticiones abiertas" />
            </div>

            <Card T={T} style={{ overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ padding: '14px 16px 10px' }}><Kicker T={T}>Necesitan ánimo</Kicker></div>
                {d.needs_care.length === 0 && <div style={{ padding: '4px 16px 16px', fontSize: 14, color: T.muted }}>Todos van al día. Gracias a Dios.</div>}
                {d.needs_care.map(m => <CareRow key={m.user_id} T={T} m={m} groupId={group.id} token={token} dflt={d.care_default} toast={toast} />)}
            </Card>

            <Card T={T} style={{ padding: 16, marginBottom: 14 }}>
                <Kicker T={T} style={{ marginBottom: 8 }}>Pregunta de mañana</Kicker>
                <textarea value={q} onChange={e => setQ(e.target.value)} rows={3} maxLength={400} placeholder="Una pregunta para conversar sobre el capítulo" style={{ ...inputStyle(T), height: 'auto', padding: 14, resize: 'none', fontFamily: 'inherit' }} />
                <PrimaryBtn T={T} disabled={!q.trim()} onClick={saveQ} style={{ width: '100%', marginTop: 10, height: 48 }}>Programar para las 6:00</PrimaryBtn>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <GhostBtn T={T} onClick={onWeekly}><Icon n="chart-no-axes-column" size={17} />Resumen</GhostBtn>
                <GhostBtn T={T} onClick={onMeeting}><Icon n="presentation" size={17} />Modo reunión</GhostBtn>
            </div>

            <button onClick={onSafety} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', padding: 16, borderRadius: 20, border: 'none', background: '#FBE9E7', color: '#8C2A1E' }}>
                <Icon n="shield-check" size={22} />
                <span style={{ flex: 1, fontWeight: 600 }}>Cuidado y seguridad</span>
                {k.reports_open > 0 && <span style={{ fontSize: 13, fontWeight: 700 }}>{k.reports_open} {k.reports_open === 1 ? 'reporte' : 'reportes'} por revisar</span>}
                <Icon n="chevron-right" size={18} />
            </button>
        </div>
    );
};

export const Safety = ({ T, token, group, toast, onBack }) => {
    const [rules, setRules] = useState(null);
    const [reports, setReports] = useState(null);
    const load = async () => {
        try {
            const [a, b] = await Promise.all([api.call(`/leader.php?action=rules&group_id=${group.id}`, 'GET', null, token), api.call(`/leader.php?action=reports&group_id=${group.id}`, 'GET', null, token)]);
            if (a.success) setRules(a.rules);
            setReports(b.success ? b.reports : []);
        } catch (e) { setReports([]); }
    };
    useEffect(() => { load(); }, []);
    const setRule = async (key, value) => {
        const next = { ...rules, [key]: value };
        setRules(next);
        await api.call('/leader.php?action=rules', 'PUT', { group_id: group.id, ...next }, token);
    };
    const resolve = async (id, action) => {
        const r = await api.call('/leader.php?action=resolve-report', 'POST', { id, action }, token);
        if (r.success) { toast(action === 'keep' ? 'Conservado' : 'Eliminado'); load(); }
    };
    const Rule = ({ title, sub, k, last }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: last ? 'none' : `1px solid ${T.line2}` }}>
            <div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600, color: T.ink }}>{title}</div><div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{sub}</div></div>
            <Toggle T={T} on={rules[k]} onChange={(v) => setRule(k, v)} />
        </div>
    );
    return (
        <div className="anim-up">
            <TopBar T={T} title="Cuidado y seguridad" onBack={onBack} />
            <Kicker T={T} style={{ margin: '0 4px 8px' }}>Reglas del grupo</Kicker>
            {rules && (
                <Card T={T} style={{ overflow: 'hidden', marginBottom: 8 }}>
                    <Rule T={T} title="Permitir peticiones anónimas" sub="Si lo apagas, todas las peticiones llevan nombre." k="allow_anonymous" />
                    <Rule T={T} title="Cerrar peticiones a los 30 días" sub="Las peticiones sin respuesta se cierran solas." k="close_after_30d" last />
                </Card>
            )}
            <p style={{ margin: '0 4px 18px', fontSize: 12, color: T.muted, lineHeight: 1.45 }}>Siempre activas: los teléfonos nunca se muestran a otros miembros, y los ofrecimientos de ayuda son privados (solo el autor de la petición y el líder).</p>

            <Kicker T={T} style={{ margin: '0 4px 8px' }}>Reportes por revisar</Kicker>
            {!reports && <Spinner T={T} />}
            {reports && reports.length === 0 && <p style={{ margin: '0 4px', color: T.muted, fontSize: 14 }}>No hay nada por revisar.</p>}
            {reports && reports.map(r => (
                <Card T={T} key={r.id} style={{ padding: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, fontSize: 12, fontWeight: 700 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 10, background: '#FBE9E7', color: '#8C2A1E' }}>{r.auto ? 'Detectado automáticamente' : 'Reportado'}</span>
                        <span style={{ color: T.muted }}>{{ prayer: 'Petición', comment: 'Comentario', contribution: 'Aporte' }[r.type]} de {r.author}</span>
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.5, color: T.ink }}>{r.text}</div>
                    {r.reason && <div style={{ marginTop: 6, fontSize: 13, color: T.muted }}>Motivo: {r.reason}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                        <GhostBtn T={T} onClick={() => resolve(r.id, 'keep')} style={{ flex: 1, height: 44 }}>Está bien</GhostBtn>
                        <PrimaryBtn T={T} onClick={() => resolve(r.id, 'remove')} style={{ flex: 1, height: 44, background: '#B42318', color: '#fff' }}>Eliminar</PrimaryBtn>
                    </div>
                </Card>
            ))}
        </div>
    );
};
