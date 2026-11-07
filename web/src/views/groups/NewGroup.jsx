import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, PrimaryBtn, Segmented, inputStyle } from '../../ui';
import { Kicker, TopBar } from './shared';

const TYPES = [['family', 'Grupo familiar'], ['cell', 'Célula'], ['friends', 'Amigos'], ['ministry', 'Ministerio']];
const QUICK = [43, 44, 19, 20, 45, 41]; // Juan, Hechos, Salmos, Proverbios, Romanos, Marcos

export const NewGroup = ({ T, token, onBack, onCreated }) => {
    const [books, setBooks] = useState([]);
    const [name, setName] = useState('');
    const [type, setType] = useState('friends');
    const [book, setBook] = useState(null);
    const [filter, setFilter] = useState('');
    const [pace, setPace] = useState(1);
    const [period, setPeriod] = useState('book');
    const [start, setStart] = useState('today');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { api.call('/bible.php?action=books', 'GET', null, token).then(r => r.success && setBooks(r.books)).catch(() => {}); }, []);

    const days = book ? Math.min(Math.ceil(book.chapters / pace), period === 'week' ? 7 : period === 'month' ? 30 : 9999) : 0;
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const shown = filter.trim() ? books.filter(b => norm(b.name_es).includes(norm(filter.trim()))) : books.filter(b => QUICK.includes(+b.id));

    const create = async () => {
        setBusy(true); setError(null);
        const r = await api.call('/groups.php?action=create', 'POST', { name: name.trim(), type, book_id: +book.id, pace, period, start }, token);
        setBusy(false);
        if (r.success) onCreated(r.group); else setError('No se pudo crear el grupo. Intenta de nuevo.');
    };

    return (
        <div className="anim-up">
            <TopBar T={T} title="Nuevo grupo" onBack={onBack} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del grupo" maxLength={80} style={{ ...inputStyle(T), height: 60, fontFamily: T.serif, fontSize: 22 * T.serifSize }} />

            <Kicker T={T} style={{ margin: '20px 4px 8px' }}>Tipo</Kicker>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {TYPES.map(([v, l]) => (
                    <button key={v} onClick={() => setType(v)} style={{ height: 46, borderRadius: 14, border: `1.5px solid ${type === v ? T.accent : T.line2}`, background: type === v ? T.accentSoft : T.surface, color: T.ink, fontSize: 14, fontWeight: 600 }}>{l}</button>
                ))}
            </div>

            <Kicker T={T} style={{ margin: '20px 4px 8px' }}>¿Qué libro van a leer?</Kicker>
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Buscar entre los 66 libros" style={{ ...inputStyle(T), height: 46, marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
                {shown.map(b => {
                    const on = book && book.id === b.id;
                    return (
                        <button key={b.id} onClick={() => setBook(b)} style={{ textAlign: 'left', padding: 14, borderRadius: 18, border: `1.5px solid ${on ? T.accent : T.line2}`, background: on ? T.accentSoft : T.surface, color: T.ink }}>
                            <div style={{ fontFamily: T.serif, fontSize: 20 * T.serifSize }}>{b.name_es}</div>
                            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{b.chapters} capítulos</div>
                        </button>
                    );
                })}
            </div>

            <Kicker T={T} style={{ margin: '20px 4px 8px' }}>Ritmo</Kicker>
            <Segmented T={T} value={pace} onChange={setPace} options={[{ value: 1, label: '1 cap./día' }, { value: 2, label: '2 cap./día' }, { value: 3, label: '3 cap./día' }]} />
            <Kicker T={T} style={{ margin: '16px 4px 8px' }}>Duración</Kicker>
            <Segmented T={T} value={period} onChange={setPeriod} options={[{ value: 'week', label: 'Semana' }, { value: 'month', label: 'Mes' }, { value: 'book', label: 'Todo el libro' }]} />
            <Kicker T={T} style={{ margin: '16px 4px 8px' }}>Empiezan</Kicker>
            <Segmented T={T} value={start} onChange={setStart} options={[{ value: 'today', label: 'Hoy' }, { value: 'monday', label: 'El lunes' }]} />

            {book && (
                <Card T={T} style={{ padding: 16, marginTop: 18, color: T.ink2, fontSize: 14, lineHeight: 1.5 }}>
                    {book.name_es} · {pace} {pace === 1 ? 'capítulo' : 'capítulos'} por día · {days} {days === 1 ? 'día' : 'días'}. Al crear el grupo tendrás un código para invitar a quien quieras.
                </Card>
            )}
            {error && <p style={{ color: T.danger, fontSize: 14 }}>{error}</p>}
            <PrimaryBtn T={T} disabled={!name.trim() || !book || busy} onClick={create} style={{ width: '100%', marginTop: 18 }}>
                {name.trim() ? `Empezar con ${name.trim()}` : 'Empezar'}
            </PrimaryBtn>
        </div>
    );
};
