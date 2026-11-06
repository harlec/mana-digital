import React, { useState, useEffect } from 'react';
import { THEME_MODE_KEY, api } from './config';
import { applyChrome, resolveTheme } from './theme';
import { FullCenter, Spinner } from './ui';
import { AuthScreen } from './views/AuthScreen';
import { MainApp } from './views/MainApp';

// ============ APP ============
export const App = () => {
    const [token, setToken] = useState(localStorage.getItem('prayer_token'));
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState({ language: 'es', dark_mode: false });
    const [view, setView] = useState('today');
    const [themeMode, setThemeModeState] = useState(localStorage.getItem(THEME_MODE_KEY) || 'auto');
    const [, tick] = useState(0);

    // Re-evaluar el tema cada minuto (modo Auto)
    useEffect(() => { const i = setInterval(() => tick(x => x + 1), 60000); return () => clearInterval(i); }, []);

    const setThemeMode = (m) => { localStorage.setItem(THEME_MODE_KEY, m); setThemeModeState(m); };
    const T = resolveTheme(themeMode);
    useEffect(() => applyChrome(T), [T.name]);

    useEffect(() => {
        if (token) {
            api.call('/auth.php?action=verify', 'GET', null, token)
                .then(res => {
                    if (res.success && res.user) { setUser(res.user); loadSettings(); }
                    else { localStorage.removeItem('prayer_token'); setToken(null); setUser(null); }
                    setLoading(false);
                })
                .catch(() => { localStorage.removeItem('prayer_token'); setToken(null); setUser(null); setLoading(false); });
        } else setLoading(false);
    }, [token]);

    const loadSettings = async () => {
        const res = await api.call('/settings.php?action=get', 'GET', null, token);
        if (res.success) {
            setSettings(res.settings);
            // Si el usuario nunca eligió tema en este dispositivo, respetar dark_mode del servidor
            if (!localStorage.getItem(THEME_MODE_KEY) && res.settings.dark_mode) setThemeMode('night');
        }
    };

    const handleAuth = async (isLogin, data) => {
        const res = await api.call(`/auth.php?action=${isLogin ? 'login' : 'register'}`, 'POST', data);
        if (res.success) { setToken(res.token); setUser(res.user); localStorage.setItem('prayer_token', res.token); }
        return res;
    };
    const handleLogout = () => { localStorage.removeItem('prayer_token'); setToken(null); setUser(null); setView('today'); };

    if (loading) return <FullCenter T={T}><Spinner T={T} /></FullCenter>;
    if (!token) return <AuthScreen T={T} onAuth={handleAuth} lang={settings.language || 'es'} />;

    return (
        <MainApp user={user} token={token} settings={settings} onLogout={handleLogout} view={view} setView={setView}
            onSettingsUpdate={setSettings} T={T} themeMode={themeMode} setThemeMode={setThemeMode} />
    );
};

