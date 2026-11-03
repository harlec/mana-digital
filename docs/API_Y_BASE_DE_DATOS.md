# API y base de datos — Maná Digital

Convenciones actuales del repo (mantener): PHP con PDO, `require_once '../config.php'`, `setCORSHeaders()`, `getCurrentUser()` devuelve `user_id` desde el Bearer token, respuestas `jsonResponse(['success'=>bool, ...])`, ruteo por `?action=`.

Recomendación: crear un archivo por dominio nuevo en `api/` y una pequeña capa de helpers (`lib/db.php`, `lib/auth.php`, `lib/push.php`, `lib/sms.php`). Validar entrada siempre; nunca devolver `phone` de otros usuarios.

## Endpoints existentes (se mantienen)
`auth.php` (verify, login, register, profile), `settings.php` (get, update, add-schedule, remove-schedule), `checkin.php` (emotions, today, create, stats), `verses.php` (personalized, history), `stories.php` (personalized), `favorites.php` (list, add, remove).
- `checkin.php?action=create` pasa a llamarse desde el **Examen** (emoción de hoy). Mantener compatibilidad.

## Endpoints nuevos

### Auth por teléfono — `auth.php`
| Método | action | Body / query | Respuesta |
|---|---|---|---|
| POST | `otp-request` | `{phone:"+51987654321"}` (E.164) | `{success}` — rate limit 3/10min por número e IP |
| POST | `otp-verify` | `{phone, code}` | `{success, token, user, is_new, pending_invites:[{group_id,name,leader_name,members:[{initial,color}]}]}` |
| PUT | `profile` | `{name, avatar_color?}` | — |
| POST | `link-phone` | `{phone, code}` (usuarios con email) | — |

### Día devocional — `today.php`
| Método | action | Notas |
|---|---|---|
| GET | `get` | Devuelve el día completo: `{date, reading:{source:'plan'|'feeling'|'group', title, reference, reason, verses:[{n,text}]}, rhema_verse, devotional, moments:[{slot,time,label,text,done}], examen:{checks, emotion_id, closed_at}, streak, nudges:[{from_name,from_initial,from_color,message}]}` |
| GET | `reading&source=plan|feeling` | Cambiar fuente (segmented) |
| POST | `mark-read` | `{reference, rhema_verse}` |
| POST | `devotional` | `{learned, apply, prayer, share_to_group:bool, group_id?}` → si share, crea aporte |
| POST | `moment` | `{slot:1..3, done:bool}` |
| POST | `examen` | `{learned_check, communion_check, emotion_id}` → cierra el día, inserta en `daily_checkins`, calcula lectura de mañana |
| GET | `diary&cursor=` | Paginado, 20 por página |

### Planes — `plans.php`
GET `list` (catálogo), GET `mine`, POST `start {plan_id | book, pace, period}`, GET `days&plan=`.

### Grupos — `groups.php`
| Método | action | Notas |
|---|---|---|
| GET | `mine` | Mis grupos con `today:{reference, contributions_count}`, `open_prayers` |
| POST | `create` | `{name, type:'family'|'cell'|'friends'|'ministry', phones:[...], book, pace, period, start_date}` → crea grupo + plan + invitaciones (SMS/WhatsApp link a los que no tienen cuenta) |
| GET | `get&id=` | Grupo + plan + `members:[{id,name,initial,color,streak,today:{read,communion,examen}}]` (sin teléfonos) |
| POST | `invite` | `{group_id, phones:[]}` (solo líder) |
| POST | `join` | `{invite_code}` o `{group_id}` (públicos) |
| POST | `request-join` / `resolve-request` | `{group_id}` / `{request_id, accept}` |
| POST | `nudge` | `{group_id, to_user_id}` — 1/día por par; push al destinatario |
| PUT | `settings` | reglas de seguridad (solo líder) |

### Capítulo y aportes — `contributions.php`
GET `day&group_id=&date=` → `{question, reference, verses, contributions:[{id, author, time, verse_ref, verse_text, text, amens, i_amened, comments:[...]}]}`
POST `create {group_id, verse_number, text}` · POST `amen {id}` (toggle) · POST `comment {id, text}` · POST `question {group_id, date, text}` (líder).

### Peticiones — `prayers.php`
| Método | action | Notas |
|---|---|---|
| GET | `list&group_id=&kind=` | Respeta visibilidad; incluye `offers` solo si soy autor o líder |
| POST | `create` | `{group_id, kind:'spiritual'|'health'|'family'|'material', text, needs:['prayer','encouragement','help'], visibility:'group'|'leader'|'anonymous'}` |
| POST | `pray {id}` | toggle; push al autor (agrupado) |
| POST | `encourage {id, text}` | comentario |
| POST | `offer {id, type:'transfer'|'food'|'goods'|'transport'|'visit'|'other', detail}` | privado; push al autor |
| POST | `answered {id, testimony}` | autor → testimonio |
| GET | `testimonies&group_id=` · POST `glory {id}` | toggle |

### Líder — `leader.php`
GET `dashboard&group_id=` → `{kpis, needs_care:[{user,reason}], join_requests, reports_open}` · POST `care-message {group_id, user_id, text}` · GET `weekly&group_id=&week=` · GET `meeting&group_id=` (slides armadas) · GET `reports` · POST `resolve-report {id, action:'keep'|'remove'}`.
POST `report {target_type, target_id, reason}` disponible para todos.

### Comunidad pública — `communities.php`
GET `explore&city=&q=&type=` · GET `cities` (con stats) · GET `city-requests&city=` (solo miembros de comunidades verificadas) · POST `city-request {city, kind:'prayer'|'visit'|'help', text}` · POST `city-request-pray {id}` · POST `city-request-offer {id}` → notifica al líder coordinador.
Admin: `verify-community`, `verify-leader` (panel interno simple o manual por SQL en F5).

### Push — `push.php`
POST `subscribe {endpoint, keys}` · POST `unsubscribe`. Cron `cron/notify.php` cada 5 min.

## Reglas de negocio en servidor
- Rol en grupo: `leader` | `member`. Un grupo puede tener varios líderes.
- Visibilidad de peticiones y ofrecimientos según README §9.
- Racha = días consecutivos con `daily_readings.read_at` no nulo.
- `needs_care`: ≥3 días sin leer o ≥7 días sin aportar.
- Auto-moderación: regex de cuentas bancarias/CCI/“deposita”/enlaces → `hidden=1` + reporte automático.
- Peticiones abiertas >30 días → `status='stale'` y push al autor “¿Dios respondió?”.
- Todas las horas en la zona del usuario (`users.timezone`, default `America/Lima`).
