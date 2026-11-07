# Notificaciones push — despliegue

Funciona con **Web Push** (navegadores y PWA instalada). No usa Composer ni servicios de pago: el cifrado y la firma VAPID están en [api/lib_push.php](../api/lib_push.php) con `openssl` y `curl`, que Plesk ya trae.

## Pasos
1. **Base de datos:** ejecutar `migracion_push.sql` en phpMyAdmin (sobre `admin_mana`). Crea `push_subscriptions`, `push_config` y `push_log`. Las claves VAPID se generan solas la primera vez que alguien activa los avisos y quedan en la base de datos (no en el repo).
2. **Código:** push/merge de `push-notificaciones` a `main` y Pull/Deploy en Plesk.
3. **Tarea programada (necesaria para los avisos de la mañana, momentos, examen, pregunta del líder, resumen del domingo):**
   Plesk → el dominio → **Tareas programadas** → *Agregar tarea* → tipo **Ejecutar un comando PHP**, y en el comando:
   `/var/www/vhosts/harlec.com.pe/manadigital.harlec.com.pe/cron/notify.php`
   Ejecutar **cada 5 minutos**. Usa la versión de PHP del sitio (la que tiene `pdo_mysql`). Si prefieres comando de shell: `/opt/plesk/php/8.x/bin/php /var/www/vhosts/harlec.com.pe/manadigital.harlec.com.pe/cron/notify.php` con la `8.x` de tu sitio.
4. **Activar en cada dispositivo:** Yo → Recordatorios y tema → **Avisos en este dispositivo** → activar → “Enviarme una prueba”.

Probar el cron a mano en el servidor imprime una línea con cuántos avisos se enviaron, por ejemplo `{"morning":2,"moments":0,...}`.

## Qué avisa
| Cuándo | Aviso |
|---|---|
| A tu hora de mañana (por defecto 7:00), si aún no leíste | “Tu palabra de hoy · Juan 3 te espera” |
| 10:30 · 13:00 · 17:30, si no marcaste ese momento | Momento de comunión |
| A tu hora del examen (por defecto 21:30), si no cerraste el día | Examen de la noche |
| 6:00, si el líder fijó pregunta | Pregunta del día del grupo |
| Domingo 9:00 | Resumen de la semana del grupo |
| 9:00, petición abierta hace más de 30 días | “¿Dios respondió?” |
| Al momento | Te recuerdan (Recordar), mensaje de cuidado del líder, nuevo aporte en tu grupo (uno por grupo y día), Amén a tu aporte, oraron por tu petición, aliento, te ofrecieron ayuda |

Privacidad: el aviso de ayuda no dice quién ofreció, y “oraron por ti” dice “Alguien” si la petición es anónima. Un aviso de cada tipo se manda una sola vez por persona y día (`push_log`); si un envío falla, se reintenta en la siguiente ejecución.

## Límites conocidos
- **App Android (APK):** el WebView empaquetado no recibe Web Push; ahí el interruptor no aparece. Para el APK hace falta **Firebase Cloud Messaging**: crear un proyecto Firebase, bajar `google-services.json`, añadir `@capacitor/push-notifications` y registrar el token en el servidor. Es un paso aparte que necesita tu cuenta de Firebase.
- **iPhone:** Safari solo admite push si la web está instalada en la pantalla de inicio (iOS 16.4 o más).
- Los horarios usan la hora de Lima (el servidor); no hay zona horaria por usuario.
- Los dispositivos que ya no existen se borran solos cuando el servicio de push responde 404/410.
