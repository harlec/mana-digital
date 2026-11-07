import React, { useState, useEffect } from 'react';
import { NOTIFICATION_VERSE_KEY, api } from '../config';
import { translations } from '../translations';
import { FullCenter, GhostBtn, Icon, Spinner } from '../ui';
import { BottomNav } from './BottomNav';
import { CheckinSheet } from './CheckinSheet';
import { FavoritesView } from './FavoritesView';
import { HistoryView } from './HistoryView';
import { HomeView } from './HomeView';
import { NotificationService } from './NotificationService';
import { useDay } from '../useDay';
import { TodayView } from './day/TodayView';
import { ReadView } from './day/ReadView';
import { DevoView } from './day/DevoView';
import { CommuneView } from './day/CommuneView';
import { ExamenView } from './day/ExamenView';
import { PlanView } from './day/PlanView';
import { DiaryView } from './day/DiaryView';
import { MeView } from './day/MeView';
import { Welcome } from './day/Welcome';
import { SettingsView } from './SettingsView';
import { StatsView } from './StatsView';
import { GroupsTab } from './groups/GroupsTab';
import { JOIN_KEY } from './groups/shared';

// ============ CONTENEDOR PRINCIPAL ============
export const MainApp = ({ user, token, settings, onLogout, view, setView, onSettingsUpdate, T, themeMode, setThemeMode }) => {
    const [showCheckin, setShowCheckin] = useState(false);
    const [todayCheckin, setTodayCheckin] = useState(null);
    const [currentVerse, setCurrentVerse] = useState(null);
    const [currentStory, setCurrentStory] = useState(null);
    const [contentType, setContentType] = useState('verse');
    const [contentLoading, setContentLoading] = useState(false);
    const [emotions, setEmotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [legacyLoaded, setLegacyLoaded] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);
    const dayCtx = useDay(token);
    const [favoritedVerses, setFavoritedVerses] = useState([]);
    const lang = settings.language || 'es';
    const t = translations[lang];

    // El flujo clásico (versículo por emoción) solo se carga cuando se abre
    useEffect(() => { if (view === 'home' && !legacyLoaded) { setLegacyLoaded(true); loadData(); } }, [view]);

    // Llegó con un enlace de invitación: ir directo a Grupos
    useEffect(() => { try { if (sessionStorage.getItem(JOIN_KEY)) setView('groups'); } catch (e) {} }, []);

    // Abrir la pantalla indicada por una notificación push (al abrir la app o con la app ya abierta)
    useEffect(() => {
        const GO = ['read', 'commune', 'examen', 'groups', 'today'];
        const open = (go) => { if (GO.includes(go)) setView(go); };
        try { const go = sessionStorage.getItem('mana_go'); if (go) { sessionStorage.removeItem('mana_go'); open(go); } } catch (e) {}
        const onMsg = (e) => { if (e.data && e.data.type === 'PUSH_GO') open(e.data.go); };
        if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', onMsg);
        return () => { if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('message', onMsg); };
    }, []);

    const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2400); };

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
    if (loading && view === 'home') return <FullCenter T={T}><Spinner T={T} /></FullCenter>;

    const DAY_VIEWS = ['today', 'plan', 'read', 'devo', 'commune', 'examen', 'diary'];
    const FLOW_VIEWS = ['read', 'devo', 'examen', 'settings'];
    const day = dayCtx.day;
    const actions = { ...dayCtx, reload: dayCtx.reload };
    const go = setView;

    let dayContent = null;
    if (DAY_VIEWS.includes(view)) {
        if (dayCtx.status === 'loading') dayContent = <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner T={T} /></div>;
        else if (dayCtx.status === 'pending') dayContent = (
            <div style={{ padding: '48px 8px', textAlign: 'center', color: T.ink }}>
                <h2 style={{ fontFamily: T.serif, fontWeight: 400, fontSize: 28 * T.serifSize, margin: '0 0 10px' }}>Estamos preparando tu día</h2>
                <p style={{ color: T.muted, lineHeight: 1.5, margin: '0 0 20px' }}>El devocional diario se está activando en el servidor. Mientras tanto puedes recibir un versículo.</p>
                <GhostBtn T={T} onClick={() => setView('home')} style={{ width: '100%' }}>Un versículo según cómo me siento</GhostBtn>
            </div>);
        else if (dayCtx.status === 'error' || !day) dayContent = (
            <div style={{ padding: '48px 8px', textAlign: 'center', color: T.ink }}>
                <p style={{ color: T.muted, margin: '0 0 20px' }}>No pudimos cargar tu día. Revisa tu conexión.</p>
                <GhostBtn T={T} onClick={dayCtx.reload} style={{ width: '100%' }}>Reintentar</GhostBtn>
            </div>);
    }
    if (DAY_VIEWS.includes(view) && !dayContent && day && !day.settings.onboarded) return <Welcome day={day} actions={actions} />;

    const props = { T, day, actions, go, token, user, toast };
    if (!dayContent && DAY_VIEWS.includes(view)) {
        dayContent = {
            today: <TodayView {...props} />, plan: <PlanView {...props} />, read: <ReadView {...props} />, devo: <DevoView {...props} />,
            commune: <CommuneView {...props} />, examen: <ExamenView {...props} />, diary: <DiaryView {...props} />
        }[view];
    }

    return (
        <div style={shell}>
            <NotificationService token={token} settings={settings} currentVerse={currentVerse} />
            {showCheckin && emotions.length > 0 && (
                <CheckinSheet T={T} emotions={emotions} lang={lang} t={t} user={user} onSubmit={handleCheckin}
                    onSkip={() => { setShowCheckin(false); if (!currentVerse) loadVerse(); }} />
            )}
            <div style={{ maxWidth: 560, margin: '0 auto', padding: `max(16px, env(safe-area-inset-top)) 16px ${view === 'settings' || FLOW_VIEWS.includes(view) ? 32 : 120}px`, boxSizing: 'border-box' }}>
                {dayContent}
                {view === 'groups' && <GroupsTab T={T} token={token} user={user} toast={toast} />}
                {view === 'me' && <MeView T={T} user={user} day={day} go={go} onLogout={onLogout} />}
                {view === 'home' && <><BackToMe T={T} go={go} /><HomeView T={T} lang={lang} t={t} user={user} verse={currentVerse} story={currentStory} contentType={contentType}
                    contentLoading={contentLoading} checkin={todayCheckin} onRefresh={contentType === 'verse' ? () => loadVerse(true) : loadStory}
                    onSetContent={setContent} onShowCheckin={() => setShowCheckin(true)} onOpenSettings={() => setView('settings')}
                    favoritedVerses={favoritedVerses} onToggleFavorite={toggleFavorite} /></>}
                {view === 'history' && <><BackToMe T={T} go={go} /><HistoryView T={T} token={token} lang={lang} t={t} /></>}
                {view === 'stats' && <><BackToMe T={T} go={go} /><StatsView T={T} token={token} lang={lang} t={t} /></>}
                {view === 'favorites' && <><BackToMe T={T} go={go} /><FavoritesView T={T} token={token} lang={lang} t={t} onChange={loadFavorites} /></>}
                {view === 'settings' && <SettingsView T={T} settings={settings} token={token} onUpdate={onSettingsUpdate} onClose={() => setView('me')}
                    onLogout={onLogout} t={t} themeMode={themeMode} setThemeMode={setThemeMode} />}
            </div>
            {!FLOW_VIEWS.includes(view) && <BottomNav T={T} view={view} setView={setView} t={t} />}
            {toastMsg && <div role="status" style={{ position: 'fixed', left: 16, right: 16, bottom: 100, maxWidth: 400, margin: '0 auto', background: '#26211C', color: '#F5F0E8', borderRadius: 16, padding: '14px 18px', fontSize: 14, textAlign: 'center', zIndex: 60 }} className="anim-up">{toastMsg}</div>}
        </div>
    );
};

const BackToMe = ({ T, go }) => (
    <button onClick={() => go('me')} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: T.muted, fontSize: 14, fontWeight: 600, padding: '4px 0 12px', height: 44 }}>
        <Icon n="chevron-left" size={18} />Yo
    </button>
);
