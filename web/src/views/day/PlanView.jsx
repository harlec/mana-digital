import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, Empty, GhostBtn, Icon, PageTitle, PrimaryBtn, Segmented, Spinner } from '../../ui';

const Chooser = ({ T, token, onStarted, onCancel }) => {
    const [catalog, setCatalog] = useState([]);
    const [book, setBook] = useState(null);
    const [pace, setPace] = useState(1);
    const [period, setPeriod] = useState('book');
    const [busy, setBusy] = useState(false);

    useEffect(() => { api.call('/plans.php?action=list', 'GET', null, token).then(r => r.success && setCatalog(r.catalog)).catch(() => {}); }, []);

    const days = book ? Math.min(Math.ceil(book.chapters / pace), period === 'week' ? 7 : period === 'month' ? 30 : 9999) : 0;
    const start = async () => {
        setBusy(true);
        const res = await api.call('/plans.php?action=start', 'POST', { book_id: book.id, pace, period }, token);
        setBusy(false);
        if (res.success) onStarted();
    };

    return (
        <div className="anim-up">
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, margin: '0 4px 10px' }}>¿Qué libro quieres leer?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {catalog.map(b => {
                    const on = book && book.id === b.id;
                    return (
                        <button key={b.id} onClick={() => setBook(b)} style={{ textAlign: 'left', padding: 16, borderRadius: 20, border: `1.5px solid ${on ? T.accent : T.line2}`, background: on ? T.accentSoft : T.surface, color: T.ink }}>
                            <div style={{ fontFamily: T.serif, fontSize: 22 * T.serifSize }}>{b.name_es}</div>
                            <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>{b.chapters} capítulos</div>
                        </button>
                    );
                })}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, margin: '0 4px 8px' }}>Ritmo</div>
            <Segmented T={T} value={pace} onChange={setPace} options={[{ value: 1, label: '1 cap./día' }, { value: 2, label: '2 cap./día' }, { value: 3, label: '3 cap./día' }]} />
            <div style={{ fontSize: 13, fontWeight: 700, color: T.muted, margin: '16px 4px 8px' }}>Duración</div>
            <Segmented T={T} value={period} onChange={setPeriod} options={[{ value: 'week', label: 'Semana' }, { value: 'month', label: 'Mes' }, { value: 'book', label: 'Todo el libro' }]} />
            {book && <p style={{ margin: '16px 4px', fontSize: 14, color: T.ink2, lineHeight: 1.5 }}>{book.name_es} · {pace} {pace === 1 ? 'capítulo' : 'capítulos'} por día · {days} {days === 1 ? 'día' : 'días'}. Empiezas hoy.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                <PrimaryBtn T={T} disabled={!book || busy} onClick={start}>Empezar mi plan</PrimaryBtn>
                {onCancel && <GhostBtn T={T} onClick={onCancel}>Cancelar</GhostBtn>}
            </div>
        </div>
    );
};

export const PlanView = ({ T, token, day, go, actions }) => {
    const [data, setData] = useState(undefined);
    const [choosing, setChoosing] = useState(false);

    const load = () => api.call('/plans.php?action=days', 'GET', null, token).then(r => setData(r.success ? r : null)).catch(() => setData(null));
    useEffect(() => { load(); }, []);

    if (data === undefined) return <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><Spinner T={T} /></div>;

    const started = async () => { setChoosing(false); await actions.reload(); load(); };
    if (choosing || !data || !data.plan) {
        return (<div><PageTitle T={T}>Leer</PageTitle><Chooser T={T} token={token} onStarted={started} onCancel={data && data.plan ? () => setChoosing(false) : null} /></div>);
    }

    const p = data.plan;
    const done = data.days.filter(d => d.done).length;
    return (
        <div className="anim-up">
            <PageTitle T={T}>Leer</PageTitle>
            <div style={{ borderRadius: 24, padding: 22, background: T.pill ? T.surface : '#26211C', border: T.pill ? `1px solid ${T.line}` : 'none', marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: T.pill ? T.accent : '#C9B8F0' }}>Día {Math.min(p.day, p.total_days)} de {p.total_days}</div>
                <div style={{ fontFamily: T.serif, fontSize: 28 * T.serifSize, margin: '6px 0 14px', color: T.pill ? T.ink : '#F5F0E8' }}>{p.title}</div>
                <div style={{ height: 6, borderRadius: 3, background: T.pill ? T.line : '#3D362F' }}>
                    <div style={{ height: 6, borderRadius: 3, width: `${Math.round(done / p.total_days * 100)}%`, background: T.pill ? T.accent : '#C9B8F0' }}></div>
                </div>
                <div style={{ fontSize: 13, marginTop: 10, color: T.pill ? T.muted : '#CFC6BA' }}>{done} de {p.total_days} días leídos{p.finished ? ' · ¡Plan completado!' : ''}</div>
            </div>

            {!day.read_done && <PrimaryBtn T={T} onClick={() => go('read')} style={{ width: '100%', marginBottom: 14 }}><Icon n="book-open" size={19} />Leer hoy</PrimaryBtn>}

            <Card T={T} style={{ overflow: 'hidden', marginBottom: 14 }}>
                {data.days.map((d, i) => (
                    <div key={d.day} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i === data.days.length - 1 ? 'none' : `1px solid ${T.line2}`, background: d.is_today ? T.accentSoft : 'transparent' }}>
                        <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: d.done ? T.accent : 'transparent', border: d.done ? 'none' : `1.5px solid ${d.is_today ? T.accent : T.line}`, color: T.accentInk }}>
                            {d.done && <Icon n="check" size={14} />}
                        </span>
                        <span style={{ flex: 1, fontSize: 15, color: T.ink }}>Día {d.day} · {d.reference}</span>
                        {d.is_today && <span style={{ fontSize: 12, fontWeight: 700, color: T.accentText }}>{d.done ? 'Hecho' : 'Hoy'}</span>}
                    </div>
                ))}
            </Card>

            <GhostBtn T={T} onClick={() => setChoosing(true)} style={{ width: '100%' }}>Cambiar de plan</GhostBtn>
            <p style={{ margin: '16px 4px 0', fontSize: 13, color: T.muted, lineHeight: 1.5 }}>Si no sigues un plan, cada mañana tu lectura sale de lo que marcaste en el examen de la noche anterior.</p>
        </div>
    );
};
