import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Fuente en web/. Por defecto compila a la raíz del repo (lo que sirve Apache).
// `vite build --mode app` compila a www/ para Capacitor (base relativa).
export default defineConfig(({ mode }) => ({
    root: 'web',
    plugins: [react()],
    base: mode === 'app' ? './' : '/',
    build: {
        outDir: mode === 'app' ? '../www' : '..',
        emptyOutDir: mode === 'app',
        assetsDir: 'assets'
    },
    server: { proxy: { '/api': 'https://manadigital.harlec.com.pe' } }
}));
