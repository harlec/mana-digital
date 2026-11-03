import React, { useState, useEffect } from 'react';
import { api } from '../config';
import { Empty, FullCenter, PageTitle, Ref, Spinner } from '../ui';

// ============ HISTORIAL ============
export const HistoryView = ({ T, token, lang, t }) => {
    const [history, setHistory] = useState(null);
    const night = T.name === 'night';
    useEffect(() => { api.call('/verses.php?action=history', 'GET', null, token).then(res => setHistory(res.success ? res.history : [])); }, []);
    const fmt = (d) => new Date(d).toLocaleString(lang, { weekday: 'short', hour: '2-digit', minute: '2-digit' });

    return (
        <div>
            <PageTitle T={T}>{t.history}</PageTitle>
            {!history ? <FullCenter T={T}><Spinner T={T} /></FullCenter> : history.length === 0 ? <Empty T={T} icon="history" text={t.noHistory} /> : (
                <div style={{ padding: '0 4px' }}>
                    {history.map((item, i) => night ? (
                        <div key={item.history_id} style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.emotion_color || T.accent, marginTop: 5, flexShrink: 0 }}></span>
                                {i < history.length - 1 && <span style={{ flex: 1, width: 1, background: T.line }}></span>}
                            </div>
                            <div style={{ paddingBottom: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 13, color: T.muted }}>{fmt(item.sent_at)}{item.emotion_emoji ? ` · ${item.emotion_emoji}` : ''}</div>
                                <p style={{ margin: 0, fontFamily: T.serif, fontSize: 21, lineHeight: 1.25 }}>{lang === 'es' ? item.text_es : item.text_en}</p>
                                <Ref T={T}>{item.reference}</Ref>
                            </div>
                        </div>
                    ) : (
                        <div key={item.history_id} style={{ padding: '18px 0', borderTop: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.muted }}>
                                <span>{item.emotion_emoji}</span><span>{fmt(item.sent_at)}</span>
                            </div>
                            <p style={{ margin: 0, fontFamily: T.serif, fontSize: 18, lineHeight: 1.4 }}>{lang === 'es' ? item.text_es : item.text_en}</p>
                            <Ref T={T}>{item.reference}</Ref>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

