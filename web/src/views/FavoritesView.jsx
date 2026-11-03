import React, { useState, useEffect } from 'react';
import { api } from '../config';
import { Card, Empty, FullCenter, Icon, PageTitle, Ref, Spinner } from '../ui';

// ============ FAVORITOS ============
export const FavoritesView = ({ T, token, lang, t, onChange }) => {
    const [favorites, setFavorites] = useState(null);
    const load = () => api.call('/favorites.php?action=list', 'GET', null, token).then(res => setFavorites(res.success ? res.favorites : []));
    useEffect(() => { load(); }, []);
    const remove = async (verseId) => {
        const res = await api.call(`/favorites.php?action=remove&verse_id=${verseId}`, 'DELETE', null, token);
        if (res.success) { setFavorites(f => f.filter(x => x.verse_id !== verseId)); onChange && onChange(); }
    };
    return (
        <div>
            <PageTitle T={T} right={favorites && favorites.length > 0 && <span style={{ fontSize: 14, color: T.muted }}>{favorites.length} {t.verses}</span>}>{t.favorites}</PageTitle>
            {!favorites ? <FullCenter T={T}><Spinner T={T} /></FullCenter> : favorites.length === 0 ? <Empty T={T} icon="heart" text={t.noFavorites} /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {favorites.map(item => (
                        <Card key={item.favorite_id} T={T} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <p style={{ margin: 0, fontFamily: T.serif, fontSize: 19 * T.serifSize, lineHeight: 1.32 }}>{lang === 'es' ? item.text_es : item.text_en}</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Ref T={T}>{item.reference}</Ref>
                                <button onClick={() => remove(item.verse_id)} aria-label="Quitar" style={{ width: 44, height: 44, marginRight: -10, border: 'none', background: 'none', color: T.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="heart-off" size={18} /></button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

