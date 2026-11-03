import React from 'react';

export const API_BASE = (window.Capacitor && window.Capacitor.isNativePlatform()) ? 'https://manadigital.harlec.com.pe/api' : '/api';
export const api = {
    call: async (endpoint, method = 'GET', body = null, token = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const options = { method, headers };
        if (body && method !== 'GET') options.body = JSON.stringify(body);
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return response.json();
    }
};

// Safari/iOS fuera de la PWA instalada no define Notification
export const HAS_NOTIFICATIONS = typeof Notification !== 'undefined';
export const NOTIFICATION_VERSE_KEY = 'pending_notification_verse';
export const THEME_MODE_KEY = 'mana_theme_mode'; // 'auto' | 'day' | 'night'
