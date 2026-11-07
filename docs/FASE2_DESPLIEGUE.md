# Fase 2 · Grupos — despliegue

Requiere la Fase 1 ya desplegada (tablas y texto bíblico cargados).

1. **Base de datos:** en phpMyAdmin, sobre `admin_mana`, ejecutar `migracion_fase2.sql`. Es solo `CREATE TABLE IF NOT EXISTS` (se puede repetir sin riesgo). Crea `groups`, `group_members`, `group_questions`, `contributions`, `reactions`, `comments` y `nudges`.
2. **Código:** push/merge de `fase2-grupos` a `main` y Pull/Deploy en Plesk. No hay nada más que ejecutar en el servidor.
3. **Verificación:** entrar → pestaña **Grupos** → Crear → compartir el código o enlace → con otra cuenta, abrir el enlace (`/?join=CÓDIGO`) o pegar el código → aportar, dar Amén, comentar, Recordar.

Si se despliega el código **antes** de la migración, la pestaña Grupos muestra un aviso y el resto de la app sigue funcionando.

## Decisiones respecto al diseño original (`docs/README.md`)
- **Invitación por código/enlace**, no por teléfono: el login es por email. El enlace abre la app con el código ya puesto; se comparte por WhatsApp o el menú compartir del sistema.
- El plan del grupo vive en la misma tabla `groups` (`book_id`, `pace`, `start_date`, `total_days`) en vez de `active_plan_id`. El botón “Usar este plan como mi lectura” crea un plan personal con las mismas fechas.
- Un aporte por persona y día (se puede editar).
- “Recordar” se guarda y aparece como aviso en Hoy; **push real** llega con las notificaciones (pendiente).
- Los colores de avatar se derivan del id de usuario (no hay `users.avatar_color`).
