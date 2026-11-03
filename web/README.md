# Frontend (Vite + React)

Código fuente en `web/src`. El `index.html` y `assets/` de la raíz del repo son el **resultado compilado**: no se editan a mano.

- `npm install` (una vez)
- `npm run dev` — desarrollo local (usa la API de producción vía proxy)
- `npm run build` — compila a la raíz del repo (lo que sirve Apache). Hacer commit del resultado.
- `npm run cap:sync` — compila a `www/` y sincroniza Android; luego `cd android && ./gradlew assembleDebug`
