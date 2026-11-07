import { api } from './config';

// Web Push funciona en navegadores y en la PWA instalada; no en la app Android empaquetada (ahí haría falta FCM)
export const PUSH_SUPPORTED = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    && !(window.Capacitor && window.Capacitor.isNativePlatform());

const urlBase64ToUint8Array = (b64) => {
    const raw = atob((b64 + '='.repeat((4 - b64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
};

const registration = () => navigator.serviceWorker.ready;

// 'unsupported' | 'denied' | 'off' | 'on'
export const pushState = async () => {
    if (!PUSH_SUPPORTED) return 'unsupported';
    if (Notification.permission === 'denied') return 'denied';
    try {
        const sub = await (await registration()).pushManager.getSubscription();
        return sub && Notification.permission === 'granted' ? 'on' : 'off';
    } catch (e) { return 'off'; }
};

export const enablePush = async (token) => {
    if (!PUSH_SUPPORTED) return 'unsupported';
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off';
    const key = await api.call('/push.php?action=vapid-key', 'GET', null, token);
    if (!key.success) throw new Error(key.error || 'push_unavailable');
    const reg = await registration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key.key) });
    const res = await api.call('/push.php?action=subscribe', 'POST', sub.toJSON(), token);
    if (!res.success) throw new Error(res.error || 'subscribe_failed');
    return 'on';
};

export const disablePush = async (token) => {
    const sub = await (await registration()).pushManager.getSubscription();
    if (sub) {
        await api.call('/push.php?action=unsubscribe', 'POST', { endpoint: sub.endpoint }, token);
        await sub.unsubscribe();
    }
    return 'off';
};

export const sendTestPush = (token) => api.call('/push.php?action=test', 'POST', {}, token);
