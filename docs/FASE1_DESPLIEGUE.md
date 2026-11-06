# Fase 1 · Devocional personal — pasos de despliegue

Orden importante: **primero la base de datos, después el código.**

## 1. Base de datos (phpMyAdmin en Plesk)
1. Plesk → Bases de datos → `admin_mana` → **phpMyAdmin** → pestaña **SQL**.
2. Pega el contenido de `migracion_fase1.sql` y ejecuta.
   - Solo crea tablas nuevas (`bible_books`, `bible_verses`, `emotion_passages`, `reading_plans`, `daily_readings`, `user_day_settings`). **No modifica ninguna tabla existente.**
   - Se puede ejecutar más de una vez sin problema.
3. Comprueba que `bible_books` tiene 66 filas y `emotion_passages` 12.

## 2. Código
Merge a `main` → en Plesk: Git → **Pull Updates / Deploy**.
Archivos nuevos: `api/today.php`, `api/plans.php`, `api/bible.php`, `api/lib_day.php`, `index.html` y `assets/` (compilados).

## 3. Cargar el texto bíblico (una sola vez)
Necesita SSH o "Tareas programadas → Ejecutar un comando PHP" en Plesk. Desde la carpeta del sitio:

    php tools/import_bible.php --helloao spa_r09

Descarga la **Reina Valera 1909** (dominio público) de bible.helloao.org (≈5 MB) y la guarda como versión `RV1909` (≈31 000 versículos, tarda ~1 minuto).
Sin este paso la app funciona, pero Leer muestra "El texto de este pasaje aún no está cargado".

> RVR1960 no existe en esa API (tiene derechos). Para usarla hay que cargar tu propio texto con licencia:
> `php tools/import_bible.php archivo.csv RVR1960` y cambiar `BIBLE_VERSION` en `api/lib_day.php`.

## 4. Verificación
- Entrar con tu usuario → aparece la bienvenida (una vez) → pantalla **Hoy**.
- Leer → capítulo con texto, tocar un versículo, "Terminé de leer", guardar devocional.
- Hoy → Examen → Cerrar el día.
- Yo → Mi diario muestra la entrada.

## Si algo falla
- La app muestra "Estamos preparando tu día" si falta el paso 1 (no rompe nada; sigue disponible "Un versículo según cómo me siento").
- Para revertir el código: revertir el merge. Las tablas nuevas pueden quedar; no afectan a la versión anterior.
