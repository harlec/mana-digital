import { useState, useEffect, useCallback } from 'react';
import { api } from './config';

// Estado del día devocional (lectura, rhema, devocional, comunión, examen, racha)
export const useDay = (token) => {
    const [day, setDay] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ready | pending | error

    const apply = (res) => {
        if (res && res.success && res.date) { setDay(res); setStatus('ready'); return res; }
        if (res && res.error === 'migration_pending') setStatus('pending');
        else if (!day) setStatus('error');
        return res;
    };

    const call = useCallback(async (action, method = 'GET', body = null) => {
        try { return apply(await api.call(`/today.php?action=${action}`, method, body, token)); }
        catch (e) { if (!day) setStatus('error'); return { success: false }; }
    }, [token, day]);

    const load = useCallback(async () => {
        setStatus(s => (s === 'ready' ? s : 'loading'));
        await call('get');
    }, [call]);

    useEffect(() => { load(); }, [token]);

    return {
        day, status, reload: load,
        setSource: (source) => call(`reading&source=${source}`),
        markRead: (rhema) => call('mark-read', 'POST', rhema ? { rhema_chapter: rhema.chapter, rhema_verse: rhema.verse } : {}),
        saveDevotional: (d) => call('devotional', 'POST', d),
        setMoment: (slot, done) => call('moment', 'POST', { slot, done }),
        closeExamen: (d) => call('examen', 'POST', d),
        saveSettings: async (s) => {
            const res = await api.call('/today.php?action=day-settings', 'PUT', s, token);
            if (res.success) await call('get');
            return res;
        }
    };
};

export const dateLabel = () => {
    const s = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
};

export const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
};

export const streakLabel = (n) => n > 0 ? ` · ${n} ${n === 1 ? 'día seguido' : 'días seguidos'}` : '';
