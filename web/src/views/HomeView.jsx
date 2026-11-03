import React from 'react';
import { Card, Empty, GhostBtn, Icon, IconBtn, Ref, Segmented, Spinner } from '../ui';

// ============ INICIO ============
export const HomeView = ({ T, lang, t, user, verse, story, contentType, contentLoading, checkin, onRefresh, onSetContent, onShowCheckin, onOpenSettings, favoritedVerses, onToggleFavorite }) => {
    const night = T.name === 'night';
    const isStory = contentType === 'story';
    const isFav = verse && favoritedVerses.includes(parseInt(verse.id));
    const firstName = user && user.name ? user.name.split(' ')[0] : '';
    const dateLabel = new Date().toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'short' });

    const share = async () => {
        if (!verse) return;
        const text = `“${lang === 'es' ? verse.text_es : verse.text_en}” — ${verse.reference}`;
        try { if (navigator.share) await navigator.share({ text }); else await navigator.clipboard.writeText(text); } catch (e) {}
    };

    const content = contentLoading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}><Spinner T={T} /></div>
    ) : isStory ? (story ? (
        <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
            <Ref T={T}>{night ? `${t.story} · ` : ''}{story.reference}</Ref>
            <h2 style={{ margin: 0, fontFamily: T.serif, fontWeight: 400, fontSize: 40 * T.serifSize, lineHeight: 1.02 }}>{lang === 'es' ? story.title_es : story.title_en}</h2>
            <p style={{ margin: 0, fontFamily: night ? T.sans : T.serif, fontSize: night ? 17 : 19, lineHeight: night ? 1.65 : 1.55, color: T.ink2, whiteSpace: 'pre-line', textWrap: 'pretty' }}>{lang === 'es' ? story.summary_es : story.summary_en}</p>
            {story.moral_es && (
                <div style={night ? { marginTop: 8, borderRadius: 24, background: T.surface, border: `1px solid ${T.line}`, padding: 20 } : { marginTop: 8, borderTop: `1px solid ${T.line}`, paddingTop: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: night ? T.accent : T.muted, marginBottom: 6 }}>{night && <Icon n="lightbulb" size={15} />}{t.lesson}</div>
                    <p style={{ margin: 0, fontFamily: T.serif, fontStyle: night ? 'normal' : 'italic', fontSize: 21 * T.serifSize, lineHeight: 1.35 }}>{lang === 'es' ? story.moral_es : story.moral_en}</p>
                </div>
            )}
        </div>
    ) : <Empty T={T} icon="scroll-text" text={t.noStory} />) : (verse ? (
        <div className="anim-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: night ? 'center' : 'stretch', textAlign: night ? 'center' : 'left', gap: 28, justifyContent: 'center' }}>
            {night && <div style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: T.muted }}>{t.todayWord}</div>}
            <p style={{ margin: 0, fontFamily: T.serif, fontSize: night ? 'clamp(28px, 8vw, 38px)' : 'clamp(24px, 6.8vw, 30px)', lineHeight: night ? 1.18 : 1.32, textWrap: night ? 'balance' : 'pretty' }}>
                “{lang === 'es' ? verse.text_es : verse.text_en}”
            </p>
            {night ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.accent, fontSize: 14, letterSpacing: '.12em', textTransform: 'uppercase' }}>
                    <span style={{ width: 24, height: 1, background: T.accent }}></span>{verse.reference}<span style={{ width: 24, height: 1, background: T.accent }}></span>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Ref T={T} style={{ fontSize: 14 }}>{verse.reference}</Ref>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <IconBtn T={T} n="heart" label="Favorito" active={isFav} onClick={() => onToggleFavorite(parseInt(verse.id))} />
                        <IconBtn T={T} n="share-2" label="Compartir" onClick={share} />
                    </div>
                </div>
            )}
        </div>
    ) : <button onClick={onRefresh} style={{ border: 'none', background: 'none', color: 'inherit', width: '100%' }}><Empty T={T} icon="book-open" text={t.noVerse} /></button>);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 'calc(100dvh - 160px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 4px' }}>
                {night ? (
                    checkin ? (
                        <button onClick={onShowCheckin} style={{ height: 40, borderRadius: 20, border: `1px solid ${T.line}`, background: 'transparent', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', fontSize: 14, color: T.muted }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: checkin.color || T.accent }}></span>
                            {lang === 'es' ? checkin.name_es : checkin.name_en}<Icon n="pencil" size={13} />
                        </button>
                    ) : <div style={{ fontFamily: T.serif, fontSize: 26 }}>{t.hello}, {firstName}</div>
                ) : (
                    <div>
                        <div style={{ fontSize: 13, color: T.muted, textTransform: 'capitalize' }}>{dateLabel}</div>
                        <div style={{ fontFamily: T.serif, fontSize: 26 }}>{t.hello}, {firstName}</div>
                    </div>
                )}
                <IconBtn T={T} n="settings" label={t.settings} onClick={onOpenSettings} />
            </div>

            {!night && checkin && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 4px' }}>
                    <button onClick={onShowCheckin} style={{ height: 36, borderRadius: 18, background: T.surface, border: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', fontSize: 13, fontWeight: 600, color: T.ink }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: checkin.color || T.accent }}></span>
                        {lang === 'es' ? checkin.name_es : checkin.name_en}<Icon n="pencil" size={13} style={{ color: T.faint }} />
                    </button>
                </div>
            )}

            <div style={{ padding: night ? '0 4px' : 0 }}>
                <Segmented T={T} value={contentType} onChange={onSetContent} options={[{ value: 'verse', label: t.verse }, { value: 'story', label: t.story }]} />
            </div>

            {night ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 16px 0' }}>{content}</div>
            ) : (
                <Card T={T} style={{ flex: 1, padding: '32px 26px', display: 'flex', flexDirection: 'column', minHeight: 360 }}>{content}</Card>
            )}

            {night ? (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 8 }}>
                    {!isStory && verse && <button onClick={() => onToggleFavorite(parseInt(verse.id))} aria-label="Favorito" style={{ width: 52, height: 52, borderRadius: '50%', border: `1px solid ${isFav ? T.accent : T.line}`, background: isFav ? T.accentSoft : 'transparent', color: T.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="heart" size={20} /></button>}
                    <button onClick={onRefresh} style={{ height: 52, borderRadius: 26, border: 'none', background: T.ink, color: T.bg, fontSize: 15, fontWeight: 600, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8 }}><Icon n="refresh-cw" size={17} />{isStory ? t.newStory : t.newVerse}</button>
                    {!isStory && verse && <button onClick={share} aria-label="Compartir" style={{ width: 52, height: 52, borderRadius: '50%', border: `1px solid ${T.line}`, background: 'transparent', color: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="share-2" size={20} /></button>}
                </div>
            ) : (
                <GhostBtn T={T} onClick={onRefresh}><Icon n="refresh-cw" size={17} />{isStory ? t.newStory : t.newVerse}</GhostBtn>
            )}
        </div>
    );
};

