import React from 'react';
import { createRoot } from 'react-dom/client';
import './lucide.css';
import './styles.css';
import { App } from './App';
import { JOIN_KEY } from './views/groups/shared';

// Enlace de invitación: guardar el código para usarlo tras iniciar sesión
try {
    const code = new URLSearchParams(location.search).get('join');
    if (code) {
        sessionStorage.setItem(JOIN_KEY, code.toUpperCase().slice(0, 12));
        history.replaceState(null, '', location.pathname);
    }
} catch (e) {}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW error:', err));
}

createRoot(document.getElementById('root')).render(<App />);
