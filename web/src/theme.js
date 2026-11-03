import React from 'react';

// ============ TEMAS: Día (Pergamino) / Noche (Nocturno) ============
export const THEMES = {
    day: {
        name: 'day', bg: '#F5F0E8', surface: '#FFFDF9', line: '#E6DED2', line2: '#F1EBE1',
        ink: '#26211C', ink2: '#3D362F', muted: '#6E655B', faint: '#9C9285',
        accent: '#6B3FBF', accentInk: '#FFFFFF', accentSoft: '#EEE7F8', accentText: '#5A33A8',
        track: '#EAE3D8', danger: '#B42318', overlay: 'rgba(38,33,28,.55)',
        serif: "'Newsreader', Georgia, serif", sans: "'Manrope', system-ui, sans-serif",
        serifSize: 1, radius: 16, pill: false
    },
    night: {
        name: 'night', bg: '#13111C', surface: '#1D1A29', line: '#2C2840', line2: '#2C2840',
        ink: '#F3EFE6', ink2: '#CFCADB', muted: '#A39DB5', faint: '#7C7691',
        accent: '#E8C478', accentInk: '#13111C', accentSoft: 'rgba(232,196,120,.10)', accentText: '#E8C478',
        track: '#2C2840', danger: '#F0A7A0', overlay: 'rgba(0,0,0,.6)',
        serif: "'Instrument Serif', Georgia, serif", sans: "'DM Sans', system-ui, sans-serif",
        serifSize: 1.18, radius: 28, pill: true
    }
};
export const isNightHour = () => { const h = new Date().getHours(); return h >= 19 || h < 6; };
export const resolveTheme = (mode) => THEMES[mode === 'night' || (mode === 'auto' && isNightHour()) ? 'night' : 'day'];

export const applyChrome = (T) => {
    document.body.style.background = T.bg;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', T.bg);
};
