import React, { useState, useEffect } from 'react';
import { api } from '../../config';
import { Card, Spinner } from '../../ui';
import { Avatar, KindTag, TopBar } from './shared';

export const Testimonies = ({ T, token, group, onBack }) => {
    const [list, setList] = useState(null);
    const load = async () => {
        try { const r = await api.call(`/prayers.php?action=testimonies&group_id=${group.id}`, 'GET', null, token); setList(r.success ? r.testimonies : []); } catch (e) { setList([]); }
    };
    useEffect(() => { load(); }, []);
    const glory = async (id) => { const r = await api.call('/prayers.php?action=glory', 'POST', { id }, token); if (r.success) load(); };

    return (
        <div className="anim-up">
            <TopBar T={T} title="Dios respondió" onBack={onBack} />
            <div style={{ borderRadius: 22, padding: 18, marginBottom: 16, background: T.pill ? T.surface : '#26211C', border: T.pill ? `1px solid ${T.line}` : 'none', color: T.pill ? T.ink : '#F5F0E8', lineHeight: 1.45 }}>
                <div style={{ fontFamily: T.serif, fontSize: 21 * T.serifSize }}>¿Dios respondió una petición tuya?</div>
                <div style={{ fontSize: 13, marginTop: 6, color: T.pill ? T.muted : '#CFC6BA' }}>Márcala como respondida desde Peticiones y aparecerá aquí para dar gloria juntos.</div>
            </div>
            {!list && <Spinner T={T} />}
            {list && list.length === 0 && <p style={{ margin: '24px 8px', textAlign: 'center', color: T.muted, lineHeight: 1.5 }}>Aún no hay testimonios. Cuando Dios responda, aquí lo celebramos.</p>}
            {list && list.map(t => (
                <Card T={T} key={t.id} style={{ padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Avatar name={t.initial} color={t.color} />
                        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: T.ink }}>{t.author}</span>
                        <span style={{ padding: '3px 10px', borderRadius: 10, background: '#FBF1DC', color: '#8A5A12', fontSize: 12, fontWeight: 700 }}>Respondida</span>
                    </div>
                    <div style={{ borderLeft: `2px solid ${T.line}`, paddingLeft: 12, marginBottom: 10 }}>
                        <KindTag kind={t.kind} />
                        <div style={{ fontSize: 14, color: T.muted, marginTop: 6, lineHeight: 1.45 }}>Pidió: {t.asked}</div>
                    </div>
                    <div style={{ fontFamily: T.serif, fontSize: 19 * T.serifSize, lineHeight: 1.45, color: T.ink }}>{t.testimony}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <span style={{ fontSize: 13, color: T.muted }}>{t.praying} {t.praying === 1 ? 'oró' : 'oraron'} por esto</span>
                        <button onClick={() => glory(t.id)} aria-pressed={t.i_glory} style={{ height: 38, padding: '0 16px', borderRadius: 19, border: t.i_glory ? 'none' : `1px solid ${T.line}`, background: t.i_glory ? '#B7791F' : 'transparent', color: t.i_glory ? '#fff' : T.ink, fontSize: 13, fontWeight: 700 }}>Gloria a Dios{t.glory ? ` · ${t.glory}` : ''}</button>
                    </div>
                </Card>
            ))}
        </div>
    );
};
