import { useState, useEffect, useRef } from 'react';
import { HAS_NOTIFICATIONS, NOTIFICATION_VERSE_KEY, api } from '../config';

// Servicio de Notificaciones
export const NotificationService = ({ token, settings, currentVerse }) => {
    const [permission, setPermission] = useState(HAS_NOTIFICATIONS ? Notification.permission : 'unsupported');
    const [lastNotification, setLastNotification] = useState(null);
    const lastNotifiedTimeRef = useRef(null); // Para evitar notificaciones duplicadas

    // Función auxiliar para enviar notificación y guardar versículo
    const sendVerseNotification = async (verse, source = 'manual') => {
        const text = settings.language === 'es' ? verse.text_es : verse.text_en;

        // Guardar versículo en localStorage ANTES de enviar la notificación
        localStorage.setItem(NOTIFICATION_VERSE_KEY, JSON.stringify(verse));
        console.log('💾 Versículo guardado para notificación:', verse.reference);

        // Intentar usar Service Worker si está disponible
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                data: {
                    title: 'Recordatorio de Oración',
                    body: `${verse.reference}\n\n${text.substring(0, 100)}...`,
                    verse: verse,
                    tag: 'prayer-reminder'
                }
            });
            console.log('✅ Notificación enviada via SW (' + source + ')');
        } else if (HAS_NOTIFICATIONS) {
            // Fallback: usar Web Notification API directamente
            const notification = new Notification('Recordatorio de Oración', {
                body: `${verse.reference}\n\n${text.substring(0, 100)}...`,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'prayer-reminder',
                requireInteraction: false,
                data: { verse: verse }
            });

            // Manejar clic en la notificación
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            console.log('✅ Notificación enviada directamente (' + source + ')');
        }

        setLastNotification(new Date().toISOString());
    };

    // Solicitar permisos
    useEffect(() => {
        if (HAS_NOTIFICATIONS && settings.notifications_enabled && permission === 'default') {
            Notification.requestPermission().then(perm => {
                setPermission(perm);
                console.log('🔔 Permiso de notificaciones:', perm);
            });
        }
    }, [settings.notifications_enabled]);

    // Sistema de notificaciones por intervalo
    useEffect(() => {
        if (!settings.notifications_enabled || settings.notifications_paused || permission !== 'granted') {
            return;
        }

        if (settings.interval_mode) {
            const hours = settings.interval_hours || 2;
            const intervalMs = hours * 60 * 60 * 1000;

            console.log(`⏰ Notificaciones cada ${hours} hora(s)`);

            const sendNotification = async () => {
                try {
                    const res = await api.call('/verses.php?action=personalized', 'GET', null, token);

                    if (res.success && res.verse) {
                        await sendVerseNotification(res.verse, 'intervalo');
                    }
                } catch (error) {
                    console.error('Error sending notification:', error);
                }
            };

            // Primera notificación después de 1 minuto (para testing)
            const firstTimeout = setTimeout(sendNotification, 60000);

            // Luego cada X horas
            const interval = setInterval(sendNotification, intervalMs);

            return () => {
                clearTimeout(firstTimeout);
                clearInterval(interval);
            };
        }
    }, [settings, permission, token]);

    // Sistema de notificaciones por horarios
    useEffect(() => {
        if (!settings.notifications_enabled || settings.notifications_paused || permission !== 'granted') {
            return;
        }

        if (!settings.interval_mode) {
            const checkSchedules = async () => {
                const now = new Date();
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                // Evitar notificaciones duplicadas en el mismo minuto
                if (lastNotifiedTimeRef.current === currentTime) {
                    return;
                }

                // Obtener horarios del servidor
                const res = await api.call('/settings.php?action=get', 'GET', null, token);

                if (res.success && res.schedules) {
                    for (const schedule of res.schedules) {
                        const scheduleTime = schedule.time.substring(0, 5);

                        if (scheduleTime === currentTime) {
                            try {
                                const verseRes = await api.call('/verses.php?action=personalized', 'GET', null, token);

                                if (verseRes.success && verseRes.verse) {
                                    await sendVerseNotification(verseRes.verse, 'horario ' + scheduleTime);
                                    lastNotifiedTimeRef.current = currentTime;
                                }
                            } catch (error) {
                                console.error('Error sending scheduled notification:', error);
                            }
                            break; // Solo enviar una notificación por verificación
                        }
                    }
                }
            };

            // Verificar cada minuto
            const interval = setInterval(checkSchedules, 60000);

            // Verificar inmediatamente
            checkSchedules();

            return () => clearInterval(interval);
        }
    }, [settings, permission, token]);

    // Notificación de check-in diario
    useEffect(() => {
        if (!settings.notifications_enabled || !settings.checkin_notification || permission !== 'granted') {
            return;
        }

        const checkDailyReminder = async () => {
            const now = new Date();
            const hour = now.getHours();
            const minute = now.getMinutes();

            // Hora del check-in (por defecto 9:00 AM)
            const checkinTime = settings.checkin_time || '09:00:00';
            const [checkinHour, checkinMinute] = checkinTime.split(':').map(Number);

            if (hour === checkinHour && minute === checkinMinute) {
                // Verificar si ya hizo check-in hoy
                const res = await api.call('/checkin.php?action=today', 'GET', null, token);

                if (res.success && !res.has_checkin) {
                    new Notification('Buenos días', {
                        body: '¿Cómo te sientes hoy? Haz tu check-in emocional',
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                        tag: 'daily-checkin',
                        requireInteraction: true
                    });

                    console.log('✅ Notificación de check-in enviada');
                }
            }
        };

        // Verificar cada minuto
        const interval = setInterval(checkDailyReminder, 60000);

        return () => clearInterval(interval);
    }, [settings, permission, token]);

    return null; // Este componente no renderiza nada
};
