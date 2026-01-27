// Service Worker para Maná Digital
// Maneja notificaciones en segundo plano y clic en notificaciones

const CACHE_NAME = 'mana-digital-v3';
const NOTIFICATION_VERSE_KEY = 'pending_notification_verse';

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker instalado');
    self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activado');
    // Limpiar caches antiguas
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eliminando cache antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

// Manejar mensajes desde la app principal
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    if (type === 'SCHEDULE_NOTIFICATION') {
        // Programar notificación con el versículo
        scheduleNotification(data);
    }

    if (type === 'SHOW_NOTIFICATION') {
        // Mostrar notificación inmediatamente
        showNotification(data);
    }
});

// Mostrar notificación
async function showNotification(data) {
    const { title, body, verse, tag } = data;

    // Guardar el versículo para cuando el usuario haga clic
    await saveVerseForNotification(verse);

    self.registration.showNotification(title, {
        body: body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: tag || 'prayer-reminder',
        data: {
            verse: verse,
            url: '/'
        },
        requireInteraction: false,
        vibrate: [200, 100, 200]
    });

    console.log('🔔 Notificación mostrada desde SW:', title);
}

// Guardar versículo en IndexedDB para persistencia
async function saveVerseForNotification(verse) {
    try {
        // Usar la API de clients para enviar mensaje a la app
        const allClients = await clients.matchAll({ includeUncontrolled: true });

        for (const client of allClients) {
            client.postMessage({
                type: 'SAVE_NOTIFICATION_VERSE',
                verse: verse
            });
        }

        // También guardar en cache del SW por si no hay clients activos
        self.notificationVerse = verse;

    } catch (error) {
        console.error('Error guardando versículo:', error);
    }
}

// Manejar clic en notificación
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Clic en notificación');

    event.notification.close();

    const verse = event.notification.data?.verse;
    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(async (clientList) => {
                // Buscar si ya hay una ventana abierta
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin)) {
                        // Enviar mensaje para mostrar el versículo
                        client.postMessage({
                            type: 'SHOW_NOTIFICATION_VERSE',
                            verse: verse
                        });
                        return client.focus();
                    }
                }

                // Si no hay ventana abierta, abrir una nueva
                if (clients.openWindow) {
                    const newClient = await clients.openWindow(url);

                    // Esperar un momento y enviar el versículo
                    setTimeout(() => {
                        newClient?.postMessage({
                            type: 'SHOW_NOTIFICATION_VERSE',
                            verse: verse
                        });
                    }, 1000);

                    return newClient;
                }
            })
    );
});

// Manejar cierre de notificación
self.addEventListener('notificationclose', (event) => {
    console.log('❌ Notificación cerrada sin clic');
});

// Periodic sync para notificaciones en segundo plano (si el navegador lo soporta)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-notifications') {
        event.waitUntil(checkAndSendNotifications());
    }
});

// Verificar y enviar notificaciones programadas
async function checkAndSendNotifications() {
    try {
        // Obtener configuración del usuario desde localStorage via message
        const allClients = await clients.matchAll({ includeUncontrolled: true });

        for (const client of allClients) {
            client.postMessage({
                type: 'CHECK_SCHEDULED_NOTIFICATIONS'
            });
        }
    } catch (error) {
        console.error('Error verificando notificaciones:', error);
    }
}

console.log('🚀 Service Worker cargado');
