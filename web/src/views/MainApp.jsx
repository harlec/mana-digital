import React, { useState, useEffect } from 'react';
import { NOTIFICATION_VERSE_KEY, api } from '../config';
import { translations } from '../translations';
import { FullCenter, Spinner } from '../ui';
import { BottomNav } from './BottomNav';
import { CheckinSheet } from './CheckinSheet';
import { FavoritesView } from './FavoritesView';
import { HistoryView } from './HistoryView';
import { HomeView } from './HomeView';
import { NotificationService } from './NotificationService';
import { SettingsView } from './SettingsView';
import { StatsView } from './StatsView';

// ============ CONTENEDOR PRINCIPAL ============
export const MainApp = ({ user, token, settings, onLogout, view, setView, onSettingsUpdate, T, themeMode, setThemeMode }) => {
    const [showCheckin, setShowCheckin] = useState(false);
    const [todayCheckin, setTodayCheckin] = useState(null);
    const [currentVerse, setCurrentVerse] = useState(null);
    const [currentStory, setCurrentStory] = useState(null);
    const [contentType, setContentType] = useState('verse');
    const [contentLoading, setContentLoading] = useState(false);
    const [emotions, setEmotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favoritedVerses, setFavoritedVerses] = useState([]);
    const lang = settings.language || 'es';
    const t = translations[lang];

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const handleSWMessage = (event) => {
            const { type, verse } = event.data || {};
            if (type === 'SHOW_NOTIFICATION_VERSE' && verse) { setCurrentVerse(verse); setContentType('verse'); setView('home'); localStorage.removeItem(NOTIFICATION_VERSE_KEY); }
            if (type === 'SAVE_NOTIFICATION_VERSE' && verse) localStorage.setItem(NOTIFICATION_VERSE_KEY, JSON.stringify(verse));
        };
        if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', handleSWMessage);
        const pending = localStorage.getItem(NOTIFICATION_VERSE_KEY);
        if (pending) { try { setCurrentVerse(JSON.parse(pending)); } catch (e) {} localStorage.removeItem(NOTIFICATION_VERSE_KEY); }
        return () => { if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('message', handleSWMessage); };
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [emotionsRes, checkinRes] = await Promise.all([
                emotions.length ? Promise.resolve({ success: true, emotions }) : api.call('/checkin.php?action=emotions', 'GET', null, token),
                api.call('/checkin.php?action=today', 'GET', null, token)
            ]);
            if (emotionsRes.success && emotionsRes.emotions) setEmotions(emotionsRes.emotions);
            if (checkinRes.success) {
                setTodayCheckin(checkinRes.checkin);
                if (!checkinRes.has_checkin) setShowCheckin(true); else await loadVerse();
            }
            if (favoritedVerses.length === 0) await loadFavorites();
        } catch (error) { console.error('Error loading data:', error); }
        finally { setLoading(false); }
    };

    const loadFavorites = async () => {
        try {
            const res = await api.call('/favorites.php?action=list', 'GET', null, token);
            if (res.success && res.favorites) setFavoritedVerses(res.favorites.map(f => parseInt(f.verse_id)));
        } catch (e) { console.error(e); }
    };

    const toggleFavorite = async (verseId) => {
        try {
            if (favoritedVerses.includes(verseId)) {
                const res = await api.call(`/favorites.php?action=remove&verse_id=${verseId}`, 'DELETE', null, token);
                if (res.success) setFavoritedVerses(prev => prev.filter(id => id !== verseId));
            } else {
                const res = await api.call('/favorites.php?action=add', 'POST', { verse_id: verseId }, token);
                if (res.success) setFavoritedVerses(prev => [...prev, verseId]);
            }
        } catch (e) { console.error(e); }
    };

    const fallbackVerse = { id: 1, reference: 'Juan 3:16', text_es: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.', text_en: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' };
    const fallbackStory = { id: 1, title_es: 'David y Goliat', title_en: 'David and Goliath', reference: '1 Samuel 17', summary_es: 'Un joven pastor llamado David enfrentó al gigante filisteo Goliat cuando todo el ejército de Israel tenía miedo. Con solo una honda y cinco piedras, y con fe inquebrantable en Dios, David derrotó al gigante.', summary_en: "A young shepherd named David faced the Philistine giant Goliath when all of Israel's army was afraid. With just a sling and five stones, and unwavering faith in God, David defeated the giant.", moral_es: 'Con fe en Dios, podemos superar cualquier obstáculo que parezca imposible.', moral_en: 'With faith in God, we can overcome any obstacle that seems impossible.' };

    const loadVerse = async (forceNew = false) => {
        setContentLoading(true);
        try {
            if (!forceNew) {
                const pending = localStorage.getItem(NOTIFICATION_VERSE_KEY);
                if (pending) { try { setCurrentVerse(JSON.parse(pending)); localStorage.removeItem(NOTIFICATION_VERSE_KEY); setContentLoading(false); return; } catch (e) { localStorage.removeItem(NOTIFICATION_VERSE_KEY); } }
            }
            const res = await api.call('/verses.php?action=personalized', 'GET', null, token);
            setCurrentVerse(res && res.success && res.verse ? res.verse : fallbackVerse);
        } catch (e) { setCurrentVerse(fallbackVerse); }
        finally { setContentLoading(false); }
    };

    const loadStory = async () => {
        setContentLoading(true);
        try {
            const res = await api.call('/stories.php?action=personalized', 'GET', null, token);
            setCurrentStory(res && res.success && res.story ? res.story : fallbackStory);
        } catch (e) { setCurrentStory(fallbackStory); }
        finally { setContentLoading(false); }
    };

    const setContent = (type) => {
        if (type === contentType) return;
        setContentType(type);
        if (type === 'story') loadStory(); else loadVerse(true);
    };

    const handleCheckin = async (emotionId, notes, contentPref = 'verse') => {
        try {
            const res = await api.call('/checkin.php?action=create', 'POST', { emotion_id: emotionId, notes }, token);
            if (res.success) {
                setShowCheckin(false);
                setContentType(contentPref);
                setTimeout(async () => { await loadData(); contentPref === 'story' ? loadStory() : loadVerse(true); }, 200);
            }
        } catch (e) { setShowCheckin(false); }
    };

    const shell = { minHeight: '100dvh', background: T.bg, color: T.ink, fontFamily: T.sans, transition: 'background .4s, color .4s' };
    if (loading) return <FullCenter T={T}><Spinner T={T} /></FullCenter>;

    return (
        <div style={shell}>
            <NotificationService token={token} settings={settings} currentVerse={currentVerse} />
            {showCheckin && emotions.length > 0 && (
                <CheckinSheet T={T} emotions={emotions} lang={lang} t={t} user={user} onSubmit={handleCheckin}
                    onSkip={() => { setShowCheckin(false); if (!currentVerse) loadVerse(); }} />
            )}
            <div style={{ maxWidth: 560, margin: '0 auto', padding: `max(16px, env(safe-area-inset-top)) 16px ${view === 'settings' ? 32 : 120}px`, boxSizing: 'border-box' }}>
                {view === 'home' && <HomeView T={T} lang={lang} t={t} user={user} verse={currentVerse} story={currentStory} contentType={contentType}
                    contentLoading={contentLoading} checkin={todayCheckin} onRefresh={contentType === 'verse' ? () => loadVerse(true) : loadStory}
                    onSetContent={setContent} onShowCheckin={() => setShowCheckin(true)} onOpenSettings={() => setView('settings')}
                    favoritedVerses={favoritedVerses} onToggleFavorite={toggleFavorite} />}
                {view === 'history' && <HistoryView T={T} token={token} lang={lang} t={t} />}
                {view === 'stats' && <StatsView T={T} token={token} lang={lang} t={t} />}
                {view === 'favorites' && <FavoritesView T={T} token={token} lang={lang} t={t} onChange={loadFavorites} />}
                {view === 'settings' && <SettingsView T={T} settings={settings} token={token} onUpdate={onSettingsUpdate} onClose={() => setView('home')}
                    onLogout={onLogout} t={t} themeMode={themeMode} setThemeMode={setThemeMode} />}
            </div>
            {view !== 'settings' && <BottomNav T={T} view={view} setView={setView} t={t} />}
        </div>
    );
};

