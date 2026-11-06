import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, Empty, GhostBtn, IconBtn, Spinner } from '../../ui';

const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });

export const DiaryView = ({ T, token, go }) => {
    const [entries, setEntries] = useState(null);
    const [cursor, setCursor] = useState(null);
    const [more, setMore] = useState(false);

    const load = async (c) => {
        try {
            const res = await api.call(`/today.php?action=diary${c ? `&cursor=${c}` : ''}`, 'GET', null, token);
            if (res.success) { setEntries(prev => (c ? [...(prev || []), ...res.entries] : res.entries)); setCursor(res.next_cursor); }
            else setEntries(prev => prev || []);
        } catch (e) { setEntries(prev => prev || []); }
        setMore(false);
    };
    useEffect(() => { load(null); }, []);

    return (
        <div className="anim-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <IconBtn T={T} n="chevron-left" onClick={() => go('me')} label="Atrás" />
                <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 24 * T.serifSize, color: T.ink }}>Mi diario</h2>
            </div>
            {entries === null && <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner T={T} /></div>}
            {entries && entries.length === 0 && <Empty T={T} icon="notebook-pen" text="Aún no hay entradas. Cuando marques tu palabra rhema y escribas tu devocional, aparecerán aquí. Es privado." />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(entries || []).map(e => (
                    <Card T={T} key={e.date} style={{ padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: T.accentText }}>{e.reference}</span>
                            <span style={{ fontSize: 12, color: T.muted }}>{fmt(e.date)}</span>
                        </div>
                        {e.rhema_text && <p style={{ margin: '10px 0 0', fontFamily: T.serif, fontSize: 19 * T.serifSize, lineHeight: 1.4, color: T.ink }}>“{e.rhema_text}”</p>}
                        {e.learned && <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.5, color: T.ink2 }}><b>Aprendí:</b> {e.learned}</p>}
                        {e.apply && <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: T.ink2 }}><b>Aplico:</b> {e.apply}</p>}
                        {e.prayer && <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: T.ink2, fontStyle: 'italic' }}>{e.prayer}</p>}
                    </Card>
                ))}
            </div>
            {cursor && <GhostBtn T={T} disabled={more} onClick={() => { setMore(true); load(cursor); }} style={{ width: '100%', marginTop: 14 }}>Ver más</GhostBtn>}
        </div>
    );
};
