import React from 'react';
import { createRoot } from 'react-dom/client';
import './lucide.css';
import './styles.css';
import { App } from './App';

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW error:', err));
}

createRoot(document.getElementById('root')).render(<App />);
