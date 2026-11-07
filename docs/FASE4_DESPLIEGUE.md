# Fase 4 · Panel del líder y vista pastoral — despliegue

Requiere Fases 1, 2 y 3 ya desplegadas.

1. **Base de datos:** en phpMyAdmin, sobre `admin_mana`, ejecutar `migracion_fase4.sql` (solo `CREATE TABLE IF NOT EXISTS`, repetible). Crea `reports` y `group_rules`.
2. **Código:** push/merge de `fase4-lider` a `main` y Pull/Deploy en Plesk.
3. **Verificación:** con una cuenta que haya creado grupos: Grupos → **Vista pastoral** → abrir un grupo → Panel (necesitan ánimo, pregunta de mañana, seguridad) → Resumen semanal → Modo reunión.

Si el código se despliega antes que el SQL, las pantallas del líder responden `leader_migration_pending` y el resto sigue funcionando.

## Para un pastor de iglesia
- **Vista pastoral** (aparece en Grupos para quien lidera al menos un grupo): totales de todas sus células o grupos — personas, % de lectura de la semana, quién necesita ánimo, peticiones abiertas y reportes — y un acceso por grupo.
- Un grupo puede tener **varios líderes**: hoy se asigna líder automáticamente al creador y, si el último líder sale, pasa al miembro más antiguo. Pendiente: botón para nombrar co-líderes (por ejemplo, pastor y líder de célula en el mismo grupo).
- **Verificación “Avalado por {iglesia}”** y redes por ciudad son de la Fase 5.

## Qué hace cada pieza
- **Necesitan ánimo:** miembros con ≥3 días sin leer o ≥7 sin aportar (contados desde que se unieron). “Escribirle” envía un mensaje privado editable que le aparece en su pantalla Hoy. Solo lo ve el líder.
- **Pregunta de mañana:** se guarda con la fecha de mañana y sale sola ese día (sin cron).
- **Cuidado y seguridad:** reglas (permitir peticiones anónimas, cerrar peticiones a los 30 días) y reportes. Los miembros reportan aportes y peticiones con la bandera; las peticiones con cuenta bancaria/teléfono/enlace se reportan solas. El líder elige “Está bien” (se restituye) o “Eliminar”.
- **Resumen semanal:** visible para todos los miembros; lecturas, aportes, peticiones acompañadas, testimonios, constancia por persona y versículo más marcado. “Al grupo” abre el menú compartir / WhatsApp con el texto. Se puede ver la semana anterior.
- **Modo reunión:** solo líderes; 4 diapositivas en tema Noche (resumen, aportes destacados con la pregunta, oremos juntos, Dios respondió). Teclas ← → y Esc; abrirlo en el navegador de una TV sirve de pantalla.

## Decisiones respecto al diseño original
- No hay “solicitudes para unirse” porque los grupos son privados por código; llegan con la red pública (Fase 5).
- Las reglas “ocultar teléfonos”, “ofrecimientos privados” y “ayuda material solo entre miembros” siempre están activas (no hay nada que apagar), así que no se muestran como interruptores.
- “Eliminar” borra el contenido; no bloquea al autor.
- El resumen del domingo 9:00 por push queda pendiente con las notificaciones.
