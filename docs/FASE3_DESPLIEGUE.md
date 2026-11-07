# Fase 3 · Peticiones, ayuda y testimonios — despliegue

Requiere Fase 1 y Fase 2 ya desplegadas.

1. **Base de datos:** en phpMyAdmin, sobre `admin_mana`, ejecutar `migracion_fase3.sql` (solo `CREATE TABLE IF NOT EXISTS`, repetible). Crea `prayer_requests` y `help_offers`.
2. **Código:** push/merge de `fase3-peticiones` a `main` y Pull/Deploy en Plesk.
3. **Verificación:** Grupos → abrir un grupo → **Peticiones y ayuda** → compartir una petición → con otra cuenta del grupo: Oraré, Aliento, Puedo ayudar → con la primera, marcar “Dios respondió” → aparece en **Dios respondió** con “Gloria a Dios”.

Si el código se despliega antes que el SQL, las pantallas de peticiones responden “prayers_migration_pending” y el resto sigue funcionando.

## Reglas de privacidad aplicadas en el servidor (probadas)
- **Todo el grupo:** lo ven todos los miembros. **Solo el líder:** lo ven el autor y los líderes. **Anónimo:** nadie ve el nombre en la UI, ni el líder (el autor se guarda en BD).
- **Ofrecimientos de ayuda:** solo los ven el autor de la petición y los líderes; quien ofrece ve solo el suyo. No se puede ofrecer ayuda a la propia petición.
- **Auto-moderación:** si el texto parece incluir cuenta bancaria/CCI, teléfono, “depósito” o enlaces, la petición queda `hidden`: solo la ven el autor y el líder, con un aviso. Los líderes podrán revisarlas en la Fase 4 (reportes).
- Solo el autor puede marcar “Dios respondió”; el autor o un líder pueden cerrar una petición. Los testimonios de peticiones “solo líder” no se muestran al grupo.
- Una petición abierta de más de 30 días le pregunta a su autor “¿Dios respondió?” (se calcula al consultar, sin cron).

## Pendiente
- **Push** (“oraron por ti”, “ofrecieron ayuda”): llega con las notificaciones. Hoy el autor ve el conteo al abrir la petición.
- La regla de grupo `material_members_only` y la revisión de peticiones ocultas son de la Fase 4.
