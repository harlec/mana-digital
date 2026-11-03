# Handoff: Maná Digital — Herramienta devocional y comunidad

> Specs para implementar con **Claude Code** sobre el repo `harlec/mana-digital` (PHP + MySQL + PWA).
> Lee también `API_Y_BASE_DE_DATOS.md` (endpoints y tablas) y `migracion.sql` (tablas nuevas).

## 1. Overview

Maná Digital pasa de ser una app de “versículo según tu emoción” a una **herramienta devocional diaria con comunidad**:

- **Mañana · La Palabra:** lectura por *plan* o *según cómo me sentí ayer*; el usuario marca su versículo **rhema** y escribe su devocional (qué aprendí / cómo lo aplico / mi oración). Audio del pasaje.
- **Durante el día · Comunión:** 3 momentos con notificaciones suaves ligadas a lo cotidiano (trabajo, comida, camino). “Orad sin cesar” (1 Tes 5:17).
- **Noche · Examen:** checklist (leí, aprendí algo nuevo, mi palabra rema, viví en comunión) + “¿cómo te sentiste hoy?” → define la lectura de mañana.
- **Grupos:** cualquiera crea un grupo (ej. “Alma”, grupo familiar de 6), invita por **número de teléfono**, eligen libro + ritmo (ej. San Juan, 1 capítulo diario). Cada día todos **aportan** lo aprendido, comentan y se animan. Recordatorios entre miembros (“¿Ya leíste hoy?”).
- **Peticiones y ayuda:** pedir oración / aliento / ayuda concreta (Yape, comida, cosas, visita). Ofrecimientos de ayuda privados.
- **Testimonios (“Dios respondió”), resumen semanal, modo reunión, panel del líder, seguridad.**
- **Comunidad pública:** explorar comunidades por ciudad/iglesia/interés y **red por ciudad** para pedir oración o una visita en otra ciudad (coordinado por líderes verificados).

Base bíblica del producto: Hechos 2:42–46.

## 2. Sobre los archivos de diseño

Los archivos de `diseno/` son **referencias de diseño hechas en HTML** (prototipos que muestran el aspecto y el comportamiento esperados), **no código de producción**. La tarea es **recrearlos en el entorno del proyecto**:

- El repo actual tiene un frontend en un único `index.html` (React 18 UMD + Babel en el navegador) y una API PHP en `api/*.php` con MySQL.
- **Recomendación:** migrar el frontend a **Vite + React + TypeScript** (PWA con `vite-plugin-pwa`), compilando a estáticos en el mismo hosting. Mantener la API PHP + MySQL y extenderla con los endpoints nuevos. Si Claude Code ve una razón fuerte para otro stack, que la justifique antes de cambiarlo.
- Los prototipos usan datos simulados en memoria; todo debe conectarse a la API real.

Para ver los prototipos, abre cada `.dc.html` en un navegador (necesita `support.js` en la misma carpeta). `Mana Devocional v2.dc.html` tiene a la izquierda un **mapa de la app** para saltar a cualquier pantalla.

## 3. Fidelidad

**Alta fidelidad (hi-fi).** Colores, tipografía, espaciados, radios, textos y flujos son finales. Recrear lo más fiel posible; los textos en español son el copy definitivo (tono cálido, cercano, “como un amigo”).

## 4. ⚠️ Antes de empezar (bloqueantes)

1. **Secretos expuestos:** `config.php` en el repo público contiene la contraseña de MySQL y `JWT_SECRET`. Rotarlos ya, sacarlos a variables de entorno / archivo fuera del webroot no versionado, y añadir `config.php` a `.gitignore` (dejar `config.example.php`).
2. **Token:** el “JWT” actual es `base64(payload).hmac`; aceptable, pero usar `hash_equals()` al comparar firmas, quitar los `error_log` que imprimen firmas y considerar `firebase/php-jwt`.
3. **Licencia del texto bíblico:** la BD usa RVR1960, que tiene derechos (Sociedades Bíblicas Unidas). Para mostrar **capítulos completos** hace falta licencia (p. ej. API.Bible) o usar una versión de dominio público (**RV1909**). Decidir antes de la Fase 1.
4. **SMS OTP** requiere proveedor pago (Twilio Verify, o WhatsApp OTP). Definir proveedor y presupuesto.

## 5. Plan por fases

| Fase | Alcance | Pantallas |
|---|---|---|
| **1 · Devocional personal** | Auth por teléfono, onboarding, día completo, diario, plan, tema Día/Noche/Auto, navegación | welcome, signup, home, read, devo, commune, lock (notificaciones), examen, plan, diary, me |
| **2 · Grupos** | Crear grupo, invitar por teléfono/WhatsApp, plan de grupo, capítulo del día, aportes, comentarios, “Amén”, recordar a un miembro | community (solo “Mis grupos”), newgroup, groupplan, group, chapter, compose |
| **3 · Peticiones** | Peticiones (4 tipos), oraré, aliento, “puedo ayudar” privado, privacidad, testimonios | prayers, newprayer, testimonies |
| **4 · Líder** | Panel, pregunta del día programada, solicitudes, reportes y reglas, resumen semanal, modo reunión | leader, safety, weekly, meeting |
| **5 · Red pública** | Explorar comunidades, unirse/solicitar, red por ciudad, pedidos por ciudad, verificación de líderes | explore, city, cityrequest |

Cada fase debe quedar **desplegable y usable** por sí sola. Las pantallas actuales (check-in por emoción, versículo personalizado, favoritos, historial, estadísticas) se **absorben**: el check-in emocional pasa a ser parte del Examen de la noche; los favoritos siguen existiendo (corazón en Lectura); estadísticas se reemplaza por la racha y el resumen semanal.

## 6. Navegación

- **Tab bar fija** (altura 78px + safe-area, fondo `#FFFDF9`, borde superior `1px #EAE3D8`), 4 pestañas, icono 22px + label 11px/700:
  1. **Hoy** (`sun`) → home
  2. **Leer** (`book-open`) → plan
  3. **Comunidad** (`users`) → community
  4. **Yo** (`circle-user`) → me (menú principal)
  - Activo `#6B3FBF`, inactivo `#9C9285`. Una pantalla “pertenece” a una pestaña (ver mapa abajo) y la marca activa.
- Pantallas de flujo (lectura, devocional, examen, crear grupo, componer, etc.) **ocultan la tab bar** y muestran botón atrás/cerrar (44×44, icono 22px) arriba a la izquierda.
- Tocar el avatar en Hoy abre **Yo**.

Mapa:
```
Hoy ─ home → read → devo ; commune ; examen ; (notificación) lock
Leer ─ plan
Comunidad ─ community → explore ; city → cityrequest
           └ group (Alma) → chapter → compose ; prayers → newprayer
                           → leader → safety ; testimonies ; weekly → meeting
                           → newgroup → groupplan
Yo ─ me → diary ; plan ; commune ; examen ; group ; prayers ; leader ; explore ; city ; newgroup ; ajustes ; cerrar sesión
Antes de entrar ─ welcome (4 pasos) → signup (teléfono → código → invitación)
```

## 7. Design tokens

### Colores — tema Día (por defecto)
| Token | Hex | Uso |
|---|---|---|
| bg | `#F5F0E8` | fondo de pantalla |
| surface | `#FFFDF9` | tarjetas, inputs, tab bar |
| line | `#EAE3D8` | borde de tarjetas |
| line-strong | `#E2D9CC` | borde de inputs/botones secundarios, separadores de lista de historial |
| line-soft | `#F1EBE1` | divisores internos de listas |
| track | `#EAE3D8` | fondo de segmented control |
| ink | `#26211C` | texto principal; también fondo de tarjetas oscuras |
| ink-2 | `#3D362F` | texto de párrafo secundario |
| muted | `#6E655B` | metadatos, labels |
| faint | `#9C9285` | iconos inactivos, placeholders |
| accent | `#6B3FBF` | botón primario, activo, referencias bíblicas |
| accent-soft | `#EEE7F8` | fondo de chips/selección |
| accent-text | `#5A33A8` | texto sobre accent-soft |
| lilac | `#C9B8F0` | kicker sobre tarjeta oscura `#26211C` |
| on-dark-2 | `#CFC6BA` | texto secundario sobre `#26211C` |
| danger | `#B42318` | cerrar sesión, reportes (bg `#FDECEA` / `#FDF1EF`, borde `#F5C2BD`) |

### Colores — tema Noche (examen nocturno, modo reunión, tema “Noche”)
| Token | Hex |
|---|---|
| bg | `#13111C` |
| surface | `#1D1A29` |
| line | `#2C2840` (dashed: `#4A4563`) |
| ink | `#F3EFE6` |
| ink-2 | `#CFCADB` |
| muted | `#A39DB5` |
| gold (accent) | `#E8C478` (texto sobre él `#13111C`) |

### Colores semánticos
| Uso | Fuerte | Suave |
|---|---|---|
| Ayuda / verificado / hecho | `#0F7A55` (texto `#0F5F43`) | `#E3F4EC` |
| Red por ciudad (fondo tarjeta) | `#0F5F43` (kicker `#9FE0C2`, texto `#C7EBDA`, `#F0FAF5`) | — |
| Salud / peticiones | `#BE185D` / `#DB2777` | `#FBE4EF` |
| Familia / testimonios / día | `#B7791F`, `#8A5A12` | `#FBF1DC` |
| WhatsApp | `#1F9D55` | — |
| Noche (icono) | `#3D3A5C` | `#E6E4F0` |

Colores de **emoción**: usar la columna `emotions.color` de la BD (ya existe). Se muestran como punto de 8–10px, nunca emoji.

Avatares: círculo con inicial blanca 13px/700 sobre un color asignado por usuario (paleta: `#E8B04B #3B82F6 #14B8A6 #6B3FBF #EF4444 #DB2777 #6B7280 #7C4FD6 #0F7A55 #B7791F`).

### Tipografía (Google Fonts)
- **Newsreader** (serif; 400, 500, italic 400) — títulos, versículos, frases.
- **Manrope** (sans; 400–700) — UI.
- Tema Noche: **Instrument Serif** (400, italic) + **DM Sans** (400–600).

| Rol | Estilo |
|---|---|
| Título de pantalla | Newsreader 34–36px/400, lh 1.05 |
| Título de flujo (header) | Newsreader 22–24px |
| Hero de bienvenida | Newsreader 40px, lh 1.05 |
| Versículo en lectura | Newsreader 20px, lh 1.5; número `sup` Manrope 11px/700 accent |
| Versículo destacado / rhema | Newsreader 19–22px, lh 1.35 |
| Título en tarjeta | Newsreader 19–22px |
| Kicker | Manrope 12px/700, letter-spacing .08–.12em, MAYÚSCULAS, color muted o accent |
| Referencia bíblica | Manrope 12px/700, .06em, MAYÚSCULAS, accent |
| Cuerpo | Manrope 14–16px, lh 1.5 |
| Meta | Manrope 12–13px, muted |
| Botón | Manrope 15–16px/700 |

### Espaciado, radios, tamaños
- Padding horizontal de pantalla: 16–18px (listas), 24–28px (textos/títulos).
- Gap entre tarjetas: 10px; entre secciones: 14–16px.
- Radios: chips 15–19px (pill), inputs 14–16px, botones 14–18px, tarjetas 20–24px, tarjeta hero 24–28px, sheet 28px arriba.
- Botón primario: alto 56px, radio 18px, ancho completo, `#6B3FBF`/blanco. Deshabilitado: `#B8A6DA` (morado) o `#9C9285`.
- Botón secundario: 48–56px, borde `1px #D9D0C2`, transparente.
- Botón oscuro: `#26211C` / `#F5F0E8`.
- Toggle: 48–52×30–32px, perilla blanca 24–26px; on accent (o `#0F7A55` en reglas), off `#D9D0C2`.
- Segmented: fondo `#EAE3D8`, padding 3–4px, radio 12–14px; opción activa `#FFFDF9` + sombra `0 1px 2px rgba(0,0,0,.08)`.
- Hit targets mínimo 44px.
- Barra de progreso de flujo: segmentos de 4px, gap 4px.
- Iconos: **Lucide** (en el prototipo vía `lucide-static` font; en React usar `lucide-react`).

### Animación
- Entrada de contenido: `fadeUp` 0.3–0.6s ease (opacity 0→1, translateY 12px→0).
- Toast: abajo (bottom 100px), `#26211C`, radio 16, 14px; dura 2.4s.
- Sheet: overlay `rgba(38,33,28,.5)`, sube con fadeUp .25s.
- Cambio de tema: transición de background .4s.

## 8. Pantallas

Dimensiones de referencia: 390×844 (iPhone). Status bar 50px. Todo debe ser responsive hasta 560px de ancho máximo centrado (la PWA se usa también en desktop).

### 8.1 Bienvenida (`welcome`) — 4 pasos
- Header: “Saltar” arriba a la derecha (14px/600 muted) → signup.
- Contenido (padding 40px 28px): kicker, título Newsreader 40, subtítulo 16px muted, lista de 3 filas-tarjeta (radio 20, borde 1.5px, icono circular 40px con fondo suave + título 15/700 + descripción 13).
- Puntos de progreso: activo 22×6 accent, resto 6×6 `#D9D0C2`.
- Pasos:
  1. “Bienvenido a Maná” / “Un día entero con Dios, no solo un versículo.” Filas: Mañana · La Palabra / Durante el día · Comunión / Noche · Examen.
  2. “No caminas solo” / “Lean juntos, aunque no puedan juntarse.” / “Perseveraban unánimes cada día.” Hechos 2:46. Filas: Tu grupo / Peticiones y ayuda / Red por ciudad.
  3. “Para empezar” / “¿Cómo quieres leer?” — **seleccionable**: Con un plan / Según cómo me siento / Con mi grupo. Guardar en `user_settings.reading_mode`.
  4. **Tema noche** (bg `#13111C`, acento gold): “¿Cuándo te acompañamos?” — Temprano (6:00 / 21:00), Normal (7:00 / 21:30), Tarde (8:30 / 22:30). Guardar `morning_time`, `examen_time`. CTA “Empezar mi día con Dios”.

### 8.2 Registro con teléfono (`signup`) — 3 pasos
1. Logo 56px radio 14. “Empieza con tu número” / “Sin contraseñas. Te enviaremos un código por SMS.” Selector de país (+51 por defecto) 88px + input tel 56px (18px, letter-spacing .04em). CTA “Enviar código”.
2. “Escribe el código”: 6 casillas 58px alto, radio 14, borde 1.5px (activa accent). “Reenviar” (habilitar a los 30s). CTA “Verificar”. Autocompletar con WebOTP API cuando esté disponible.
3. Si el teléfono tenía **invitaciones pendientes**: tarjeta oscura “Te están esperando · Alma · Grupo familiar · Harle (líder) te invitó…” con avatares superpuestos (34px, margin −8px). CTA “Unirme a Alma”. Si no hay invitación: pedir nombre y continuar a home.
- **Migración:** usuarios actuales con email/contraseña siguen pudiendo entrar; pedirles que vinculen su teléfono.

### 8.3 Hoy (`home`)
- Encabezado: meta “Lunes 2 de noviembre · 12 días seguidos” (13px muted) + “Buenos días, {nombre}” (Newsreader 28). Saludo según la hora: Buenos días / Buenas tardes / Buenas noches. Avatar 44px (accent-soft / accent-text) → Yo.
- **Aviso de recordatorio** (si un miembro te recordó y no has leído): tarjeta `#FBF1DC` radio 18 con avatar del remitente + “**Ana** te recordó: “¿Ya leíste hoy? Te espero en Juan 14”” → lectura.
- **Tarjeta “Tu día con Dios”** (surface, radio 26): 3 filas conectadas por una línea vertical 1px `#E2D9CC`:
  - Mañana · La Palabra — título del pasaje; estado: hora (“7:00”, accent) o “Hecho” (`#0F7A55`, icono check en círculo accent).
  - Durante el día · Comunión — “N de 3 momentos” + 3 puntos 8px (hechos accent).
  - Noche · Examen del día — “Checklist y oración” / “Día cerrado”.
- CTA oscuro “Abrir la Palabra de hoy” (solo si no leyó).
- **Tarjeta de grupo**: nombre (Newsreader 20) + “3 de 6 leyeron hoy” + avatares 42px con anillo 2px (verde `#0F9D63` si leyó, `#E2D9CC` si no).

### 8.4 Lectura (`read`)
- Header: atrás + segmented “Mi plan / Según ayer” + botón audio circular 44px accent (icono `headphones` / `pause`).
- Texto: motivo (13px muted, ej. “Plan “El Evangelio de Juan” · Día 12 de 21 · con Alma” o “Anoche dijiste que te sentiste ansioso. Esta lectura es para ti.”), título del pasaje (Newsreader 34), versículos como botones (padding 8×10, radio 12). **Tocar un versículo lo marca como rhema** (fondo accent-soft; solo uno). Hint al final con icono `sparkles`.
- Mostrar **el capítulo completo** del plan (no solo 5 versículos como en el prototipo).
- Audio: Web Speech API `es-ES`, rate 0.9 (Fase 1); opcional luego audio grabado.
- Footer fijo: “Terminé de leer” → devo.

### 8.5 Mi devocional (`devo`)
- Tarjeta oscura “Mi palabra rema” con el versículo y la referencia.
- 3 textareas (radio 16, Newsreader 17): **¿Qué aprendí?** / **¿Cómo lo aplico hoy?** / **Mi oración** (opcionales).
- Fila toggle “Compartir con {grupo} — Solo tu rhema y lo que aprendiste”. Si está activo, crea un **aporte** en el capítulo del día del grupo.
- CTA “Guardar y llevarla conmigo” → home + toast. Marca la Palabra como hecha.

### 8.6 Comunión (`commune`)
- Cita: “Una lechera puede ordeñar vacas para la gloria de Dios.” (Newsreader italic 22) + “Atribuido a Martín Lutero · “Orad sin cesar” 1 Tes 5:17”.
- Tarjeta oscura “Tu palabra para llevar hoy” = rhema de la mañana.
- “Oración de respiración”: 2 celdas Inhala “Señor Jesús” / Exhala “dame tu paz”.
- **Momentos de hoy** (3 tarjetas con check circular 32px): 10:30 En el trabajo / 13:00 Al comer / 17:30 En el camino, cada uno con un texto corto. Tocar marca hecho. Horas configurables.

### 8.7 Notificaciones (`lock`, referencia)
Ejemplos de notificación push: “Momento de comunión — Mientras comes, da gracias. Y repite: “{rhema corto}””; “Ana · Alma — ¿Ya leíste hoy? Te espero en Juan 14.” Máximo 5 notificaciones al día por usuario.

### 8.8 Examen de la noche (`examen`) — tema Noche
- “Examen del día” (gold kicker) / “Antes de dormir, mira tu día con Él.” (Instrument Serif 38).
- 4 checks (tarjeta `#1D1A29`, check circular 28px gold cuando está hecho):
  - **Leí la Palabra** (automático si leyó; si no, tocar → lectura)
  - **Aprendí algo nuevo** (automático si escribió “qué aprendí”, o manual)
  - **Mi palabra rema** (muestra el rhema)
  - **Viví en comunión** (“N de 3 momentos”; manual o automático con 3/3)
- “¿Cómo te sentiste hoy?” chips con punto de color (usar tabla `emotions`). Debajo: “Mañana leerás {lectura} (o seguirás tu plan: …)”. Esto **reemplaza el check-in diario** actual (`daily_checkins`).
- CTA gold “Cerrar el día” → estado “Descansa en Él.” + Salmos 4:8 + tarjeta “Mañana a las 7:00 · {lectura}” + “Ver a mi grupo”.

### 8.9 Plan (`plan`)
- Tarjeta oscura del plan activo: “Con Alma · Día 12 de 21”, título, barra de progreso 6px (`#C9B8F0` sobre `#3D362F`).
- Lista de días (check circular 26px; día actual con borde accent y tag “Hoy”/“Hecho”).
- Nota: “Si no sigues un plan, cada mañana tu lectura sale de lo que marcaste en el examen de la noche anterior.”

### 8.10 Diario (`diary`)
Tarjetas por día: referencia (accent, mayúsculas) + fecha, rhema (Newsreader 19), “Aprendí: …”, “Aplico: …”. Más reciente primero. Privado.

### 8.11 Yo · Menú (`me`)
Cabecera con avatar 56px, nombre (Newsreader 26), “+51 … · N días seguidos”. Secciones (kicker + tarjeta con filas de 60px: icono 36px radio 12 con fondo suave, título 15/600, subtítulo 12, chevron):
- **Mi vida devocional:** Mi diario · Mi plan de lectura · Momentos de comunión · Examen de la noche
- **Mis grupos:** {grupo} · Peticiones de {grupo} · Panel del líder (si es líder) · Explorar comunidades · Red por ciudad · Crear un grupo
- **Cuenta:** Recordatorios y tema (Día / Auto / Noche + horarios; reutilizar la pantalla de Ajustes de `codigo/index.html` ya entregada) · Cerrar sesión (rojo)

### 8.12 Comunidad (`community`)
- Título “Comunidad” / “Unánimes, aunque estemos lejos” + botón “+ Crear” (pill oscuro 40px).
- “Mis grupos”: tarjetas (logo cuadrado 48px radio 16 con inicial Newsreader 22, nombre, meta “Grupo familiar · 6 · eres líder”, “Hoy: Juan 14 · 3 aportes” en accent, badge rosa `#BE185D` con peticiones abiertas).
- 2 accesos grandes (min-height 140): **Explorar comunidades** (`#26211C`) y **Red por ciudad** (`#0F5F43`).
- Pie: Hechos 2:46 en Newsreader italic.

### 8.13 Grupo (`group`)
- “‹ Comunidad” arriba; título del grupo + “Grupo familiar · 6 · Juan, un capítulo diario”; botón “+” → nuevo grupo.
- Tarjeta oscura **“Hoy leemos juntos · Día 14 de 21 · Juan 14 · N aportes · pregunta del líder”** con botón “Ver y aportar” → chapter.
- Tarjeta **Peticiones y ayuda** (icono `hand-heart` rosa) “N abiertas”.
- Grid 2×2 de herramientas: Panel del líder (solo líder) · Dios respondió · Resumen semanal · Modo reunión.
- **Tabla de miembros hoy**: columnas P (Palabra) · C (Comunión) · E (Examen) con puntos 14px (verde `#0F9D63` / `#EAE3D8`), racha, y botón **“Recordar”** (pill accent-soft) para quien no leyó → envía push “¿Ya leíste hoy? Te espero en {capítulo}”. Después muestra “Enviado” (1 por día por persona).
- Feed “Lo que Dios les habló” (aportes recientes) con “Amén · N” y “Orando por ti”.

### 8.14 Capítulo del día (`chapter`)
- Header: “{grupo} · Día 14 de 21” / “Juan 14” / “N aportes”.
- **Pregunta del líder** fijada (tarjeta oscura, icono `pin`).
- Aportes: avatar + nombre + hora; rhema con borde izquierdo 2px accent y referencia; texto; botones “Amén · N” (toggle, activo accent) y “Animar”. Comentarios en burbujas `#F5F0E8` radio 12. “Animar” abre respuestas rápidas (“Amén, me hacía falta leer esto.” / “Qué bueno lo que compartes.” / “Oro por eso que te turba.”) + input + enviar.
- Pie: Hechos 2:42.
- Footer: “Aportar lo que aprendí” (se oculta si ya aportó hoy).

### 8.15 Aportar (`compose`)
Selector de versículo del capítulo (tarjetas, seleccionado con borde accent 1.5px + accent-soft), textarea “Lo que aprendí y cómo lo aplico”, CTA “Compartir con el grupo” (deshabilitado si está vacío).

### 8.16 Peticiones y ayuda (`prayers`)
- Hechos 2:44–45 en italic. Filtros pill: Todas / Espiritual / Salud / Familia / Material.
- Tarjeta: avatar, nombre, hora, tag por tipo (Espiritual `#EEE7F8`/`#5A33A8`, Salud `#FBE4EF`/`#BE185D`, Familia `#FBF1DC`/`#8A5A12`, Material `#E3F4EC`/`#0F5F43`), texto 15px, ofrecimientos de ayuda en verde (“**Ana** ofreció comida para hoy” — visible solo para quien pidió y el líder), 3 botones (40px, radio 14):
  - **Oraré · N** (toggle; activo `#26211C`). Notifica al autor.
  - **Aliento** → sheet con 3 versículos sugeridos + texto libre → comentario.
  - **Puedo ayudar** → sheet con 6 opciones (Yape/Plin, Comida, Ropa o cosas, Movilidad, Una visita, Otra ayuda) + detalle. Nota: “Solo {autor} verá tu ofrecimiento. Coordinan en privado.”
- Footer: “+ Compartir una petición”.

### 8.17 Nueva petición (`newprayer`)
Tipo (4 tarjetas con icono: `flame`, `heart-pulse`, `house`, `package`), textarea “Cuéntalo con confianza. Estás entre hermanos.”, “¿Qué necesitas?” (multi: Oración / Palabra de aliento / Ayuda concreta), “¿Quién lo ve?” (Todo el grupo / Solo el líder / Anónimo). CTA “Pedir oración y apoyo”.

### 8.18 Dios respondió (`testimonies`)
Composer oscuro (“¿Dios respondió una petición tuya?”, botón gold). Tarjetas: tag “Respondida” (`#FBF1DC`), “Pidió: …” (borde izq.), respuesta en Newsreader 19, “N oraron por esto”, botón “Gloria a Dios · N” (toggle gold). Una petición se puede **marcar como respondida** desde su tarjeta (autor) → pasa aquí. Peticiones sin actividad se cierran a los 30 días preguntando si Dios respondió.

### 8.19 Panel del líder (`leader`) — solo rol `leader`
- 3 KPIs: lecturas de la semana (“31/42”), aportes de hoy, peticiones abiertas.
- **Necesitan ánimo**: miembros con ≥3 días sin leer o 7 días sin aportar → botón “Escribirle” (mensaje privado predefinido editable). No se muestra a otros miembros.
- **Pregunta de mañana**: textarea + sugerencias + “Programar para las 6:00”.
- **Solicitudes para unirse**: Aceptar / Ahora no.
- Acceso a **Cuidado y seguridad** (tarjeta roja suave, “N reportes por revisar”).

### 8.20 Cuidado y seguridad (`safety`)
- Estado “Líder verificado — Avalado por {iglesia}”.
- Reglas (toggles): Ayuda material solo entre miembros · Ocultar números de teléfono · Ofrecimientos de ayuda en privado · Cerrar peticiones a los 30 días.
- Reportes: tag, hora, texto, “Está bien” / “Eliminar” (elimina y bloquea).
- Cualquier miembro reporta desde el menú ⋯ de un mensaje. **Auto-ocultar** mensajes con patrones de pedido de dinero de no-miembros (cuentas bancarias, “deposítame”, enlaces externos) hasta revisión.

### 8.21 Resumen semanal (`weekly`)
Tarjeta oscura radio 28: “{grupo} · semana N”, rango (“Juan 8 al 14”), 4 stats (lecturas de 42, aportes, peticiones acompañadas, testimonios en gold), constancia por miembro (7 barras 10px, `#C9B8F0` / `#3D362F`), versículo más marcado. Botones “Al grupo” (WhatsApp verde, compartir imagen/texto) y “En la reunión” → meeting. Generar cada domingo 9:00 + push.

### 8.22 Modo reunión (`meeting`) — tema Noche, pensado para proyectar
5 diapositivas con barra de progreso gold: resumen de la semana → 2 aportes destacados (con pregunta para conversar) → “Oremos juntos” (peticiones abiertas) → “Dios respondió”. Anterior / Siguiente. Implementar también una vista landscape/pantalla completa para TV (Cast/AirPlay o abrir en un navegador de la TV con código).

### 8.23 Crear grupo (`newgroup`, `groupplan`)
1. Nombre (Newsreader 22), tipo (Grupo familiar / Célula / Amigos / Ministerio), miembros desde **Contactos** (Contact Picker API en Android; en otros, input manual de número) — fila con avatar, nombre, teléfono, estado “Usa Maná” / “Se le invitará por SMS”, check. Botón “Invitar por WhatsApp a quien no tiene la app” (deep link `wa.me` con enlace de invitación).
2. Libro (grid 2 col: San Juan 21, Hechos 28, Salmos 150, Proverbios 31, Romanos 16, Marcos 16 + buscador de los 66 libros), ritmo (1/2/3 capítulos diarios), duración (Semana / Mes / Todo el libro), pregunta del día. Resumen: “San Juan · 1 capítulo por día · hasta terminar (21 días). 6 personas, empiezan el lunes.” CTA “Empezar con {nombre}”.

### 8.24 Explorar comunidades (`explore`)
Buscador (“Iglesia, ciudad o tema…”), chips de ciudad (Toda la red, Lima, Arequipa, Cusco, Trujillo, Piura, Huancayo), conteo, tarjetas: logo, nombre, “📍 Ciudad · Tipo · N miembros”, “Leyendo: …”, botón **Unirme** (abierto) o **Solicitar unirme** (con aprobación) → “Ya estás dentro” / “Solicitado”.

### 8.25 Red por ciudad (`city`, `cityrequest`)
- Tabs de ciudad (activo `#0F5F43`). Tarjeta verde: “Hermanos en {ciudad}” — personas / comunidades / peticiones.
- Pedidos: autor + “desde {ciudad}”, tag (Visita `door-open` / Oración / Ayuda), texto, estado de coordinación (“La líder de … está coordinando · 2 se ofrecieron”), botones “Oraré” y “Puedo ir” / “Puedo ayudar” / “Le escribo”. Al ofrecerse: “Te ofreciste. Un líder de {ciudad} te contactará para coordinar.”
- Nuevo pedido: ciudad, tipo (Oración / Visita / Ayuda), texto, aviso verde “Llega a hermanos de comunidades verificadas en {ciudad}. Las visitas se coordinan con un líder; nunca publiques direcciones.” CTA “Enviar a la red de {ciudad}”.
- **Regla dura:** solo miembros de comunidades **verificadas** ven y responden pedidos de la red; las visitas siempre las asigna un líder verificado de esa ciudad.

## 9. Interacciones y comportamiento clave

- **Racha**: días consecutivos con “Leí la Palabra” hecho. Se pierde si un día no se lee (zona horaria del usuario, por defecto America/Lima).
- **Lectura del día**: si `reading_mode = plan` → siguiente capítulo del plan (personal o del grupo); si `feeling` → pasaje mapeado a la emoción del examen de anoche (reutilizar `emotion_theme_mapping`, pero a nivel de **pasaje**, no versículo suelto); el usuario puede alternar con el segmented.
- **Aporte automático**: guardar devocional con “Compartir” activo crea el aporte del día en el grupo activo.
- **Recordar a un miembro**: 1 por remitente/destinatario/día. Push + banner en su Home.
- **Notificaciones programadas** (cron cada 5 min en PHP): mañana (`morning_time`), 3 momentos, examen (`examen_time`), pregunta del líder 6:00, resumen dom 9:00, eventos (oración por ti, aliento, ofrecimiento de ayuda, aporte nuevo en tu grupo — agrupar). Web Push con VAPID (`minishlink/web-push`). Ya existe `sw.js`: extenderlo.
- **Privacidad**: teléfonos nunca visibles a otros miembros (solo al líder si la regla lo permite). Ofrecimientos de ayuda: solo autor de la petición + líder. Peticiones “Solo el líder”: invisibles al resto. “Anónimo”: autor oculto incluso al líder en la UI (guardar autor en BD por seguridad).
- **Estados vacíos** (con tono cálido): sin grupo (“Crea tu grupo o explora comunidades”), sin aportes (“Sé el primero en compartir lo que Dios te habló”), sin peticiones, diario vacío.
- **Carga**: skeletons con el color `#EAE3D8`; nunca spinners a pantalla completa salvo el arranque.
- **Offline**: la lectura del día y el devocional deben funcionar sin conexión (cachear el capítulo; encolar el guardado).
- **Tema**: Día / Auto (noche de 19:00 a 6:00) / Noche. El Examen y el Modo reunión siempre en Noche.

## 10. Estado (frontend)

- `auth`: token, usuario (id, nombre, teléfono, color de avatar).
- `today`: fecha, lectura (fuente, pasaje, versículos), rhema (verse id), devocional (learned, apply, prayer, shareToGroup), momentos [3 bool], examen (checks, emoción, cerrado), racha.
- `groups`: lista; grupo activo con plan, día actual, miembros + estado de hoy, capítulo del día (pregunta, aportes, comentarios, amenes), peticiones, testimonios, mis recordatorios enviados.
- `community`: filtros, resultados, membresías pendientes; ciudad activa, pedidos de ciudad.
- `settings`: tema, idioma, horarios, reading_mode.
- Recomendación: TanStack Query para datos del servidor + Zustand (o Context) para el estado local del día.

## 11. Assets

- Logo: `diseno/images/mana-digital-option3-192.png` (también en el repo: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).
- Iconos: Lucide (`lucide-react`). Nombres usados: sun, moon, moon-star, book-open, headphones, pause, sparkles, users, user-plus, circle-user, notebook-pen, map, map-pin, compass, hand-heart, hand-helping, heart, heart-pulse, flame, house, package, smartphone, utensils, shirt, car, door-open, message-circle, send, pin, crown, cast, chart-no-axes-column, shield-check, shield-alert, badge-check, lock, check, x, plus, chevron-left, chevron-right, settings, log-out, search, sunrise, wrench, pen-line.
- Fotos/ilustraciones: ninguna (por diseño).
- Capturas de referencia: `diseno/images/shots/*.png` (usadas por la presentación y la landing).

## 12. Archivos de este paquete

| Archivo | Qué es |
|---|---|
| `diseno/Mana Devocional v2.dc.html` | **Prototipo principal** — todas las pantallas de las secciones 8.1–8.25, con mapa navegable |
| `diseno/Mana Landing.dc.html` | Landing de una página con QR (para charlas/congresos) |
| `diseno/Mana Presentacion.dc.html` + `deck-stage.js` | Presentación de 13 diapositivas (no es parte de la app) |
| `diseno/codigo/index.html` | Frontend actual ya rediseñado (tema Día/Noche, ajustes como pantalla) — base de la Fase 1 |
| `diseno/support.js` | Runtime necesario para abrir los `.dc.html` en el navegador |
| `API_Y_BASE_DE_DATOS.md` | Endpoints nuevos y cambios de API |
| `migracion.sql` | Tablas nuevas (MySQL 8, utf8mb4) |

## 13. Criterios de aceptación (por fase)

- **F1:** un usuario nuevo se registra con teléfono, pasa la bienvenida, lee el capítulo, marca rhema, guarda devocional, recibe 3 momentos y el examen por push, cierra el día; la racha sube; funciona offline la lectura; Lighthouse PWA ≥ 90.
- **F2:** un líder crea “Alma”, invita 5 números (2 sin app reciben SMS/WhatsApp), eligen San Juan 1 cap/día; al día siguiente todos ven Juan 1, aportan, comentan, dan Amén; el líder recuerda a quien no leyó y le llega push.
- **F3:** un miembro pide ayuda material; otro ofrece Yape; solo el autor y el líder ven el ofrecimiento; el autor marca “Dios respondió” y aparece en testimonios.
- **F4:** el líder programa la pregunta, ve “Necesitan ánimo”, acepta una solicitud, resuelve un reporte, comparte el resumen del domingo y usa modo reunión en la TV.
- **F5:** un usuario de Lima pide una visita en Arequipa; solo miembros de comunidades verificadas de Arequipa lo ven; un líder verificado coordina; no se expone ninguna dirección ni teléfono.
