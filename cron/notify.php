<?php
/**
 * Maná Digital - Avisos programados (se ejecuta por consola cada 5 minutos)
 * Archivo: cron/notify.php
 *
 * Plesk → Tareas programadas → "Ejecutar un comando PHP":
 *   /var/www/vhosts/harlec.com.pe/manadigital.harlec.com.pe/cron/notify.php   (cada 5 minutos)
 * Debe usar el PHP que tenga pdo_mysql (el mismo del sitio). Es seguro ejecutarlo más seguido o a mano:
 * cada aviso se envía una sola vez por persona gracias a push_log.
 */

if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../api/lib_groups.php';

const LATE_MINUTES = 40; // se envía si la hora ya pasó hace menos de esto (por si una ejecución se retrasa)

$db = getDBConnection();
if (!pushReady($db)) { fwrite(STDERR, "Falta ejecutar migracion_push.sql\n"); exit(1); }

$now = new DateTime(getenv('MANA_NOW') ?: 'now'); // MANA_NOW solo para pruebas
$today = $now->format('Y-m-d');
$minutes = (int)$now->format('H') * 60 + (int)$now->format('i');
$dayOfWeek = (int)$now->format('N'); // 7 = domingo

function due($hhmm, $minutes) {
    [$h, $m] = array_map('intval', explode(':', $hhmm));
    $delta = $minutes - ($h * 60 + $m);
    return $delta >= 0 && $delta < LATE_MINUTES;
}

$stats = ['morning' => 0, 'moments' => 0, 'examen' => 0, 'question' => 0, 'weekly' => 0, 'stale' => 0];

// Personas con al menos un dispositivo suscrito
$users = $db->query('SELECT DISTINCT s.user_id AS id FROM push_subscriptions s')->fetchAll(PDO::FETCH_COLUMN);

foreach ($users as $uid) {
    $settings = getDaySettings($db, $uid);
    $stmt = $db->prepare('SELECT * FROM daily_readings WHERE user_id = ? AND date = ?');
    $stmt->execute([$uid, $today]);
    $row = $stmt->fetch() ?: null;

    // Mañana: la lectura del día
    if (due($settings['morning_time'], $minutes) && !($row && $row['read_at'])) {
        $row = $row ?: ensureDay($db, $uid, $today);
        $book = getBook($db, $row['book_id']);
        $ref = referenceLabel($book['name_es'], $row['chapter'], $row['chapter_end']);
        $stats['morning'] += pushToUser($db, $uid, 'Tu palabra de hoy', "$ref te espera. Un momento a solas con Dios.", '/?go=read', "morning:$today");
    }

    // Momentos de comunión durante el día
    foreach (MOMENT_SLOTS as $slot => $m) {
        if (due($m['time'], $minutes) && !($row && $row['moment' . $slot])) {
            $stats['moments'] += pushToUser($db, $uid, $m['label'], $m['text'], '/?go=commune', "moment$slot:$today");
        }
    }

    // Noche: examen del día
    if (due($settings['examen_time'], $minutes) && !($row && $row['examen_closed_at'])) {
        $stats['examen'] += pushToUser($db, $uid, 'Examen de la noche', 'Repasa tu día con Dios y ciérralo en paz.', '/?go=examen', "examen:$today");
    }
}

// Grupos (solo si la Fase 2 está migrada)
try {
    $db->query('SELECT 1 FROM group_members LIMIT 1');
    $groupsReady = true;
} catch (PDOException $e) {
    $groupsReady = false;
}

if ($groupsReady) {
    // 6:00 — pregunta del líder para el día
    if (due('06:00', $minutes)) {
        $q = $db->prepare('SELECT q.group_id, q.text, g.name FROM group_questions q INNER JOIN `groups` g ON g.id = q.group_id WHERE q.date = ?');
        $q->execute([$today]);
        foreach ($q->fetchAll() as $r) {
            $m = $db->prepare('SELECT user_id FROM group_members WHERE group_id = ?');
            $m->execute([$r['group_id']]);
            foreach ($m->fetchAll(PDO::FETCH_COLUMN) as $uid) {
                $stats['question'] += pushToUser($db, $uid, $r['name'] . ' · pregunta del día', $r['text'], '/?go=groups', "question:{$r['group_id']}:$today");
            }
        }
    }

    // Domingo 9:00 — resumen semanal de cada grupo
    if ($dayOfWeek === 7 && due('09:00', $minutes)) {
        foreach ($db->query('SELECT * FROM `groups`')->fetchAll() as $g) {
            [$mon, $sun] = weekRange(0, $today);
            $members = $db->prepare('SELECT user_id FROM group_members WHERE group_id = ?');
            $members->execute([$g['id']]);
            $ids = $members->fetchAll(PDO::FETCH_COLUMN);
            $reads = $db->prepare('SELECT COUNT(*) FROM daily_readings d INNER JOIN group_members m ON m.user_id = d.user_id AND m.group_id = ?
                WHERE d.read_at IS NOT NULL AND d.date BETWEEN ? AND ?');
            $reads->execute([$g['id'], $mon, $sun]);
            $contrib = $db->prepare('SELECT COUNT(*) FROM contributions WHERE group_id = ? AND date BETWEEN ? AND ?');
            $contrib->execute([$g['id'], $mon, $sun]);
            $body = (int)$reads->fetchColumn() . ' de ' . count($ids) * 7 . ' lecturas y ' . (int)$contrib->fetchColumn() . ' aportes. Mira el resumen de la semana.';
            foreach ($ids as $uid) {
                $stats['weekly'] += pushToUser($db, $uid, $g['name'] . ' · resumen de la semana', $body, '/?go=groups', "weekly:{$g['id']}:$mon");
            }
        }
    }

    // 9:00 — peticiones abiertas hace más de 30 días: "¿Dios respondió?"
    try {
        if (due('09:00', $minutes)) {
            $st = $db->query("SELECT id, user_id FROM prayer_requests WHERE status = 'open' AND created_at < (NOW() - INTERVAL " . STALE_DAYS . ' DAY)');
            foreach ($st->fetchAll() as $p) {
                $stats['stale'] += pushToUser($db, $p['user_id'], '¿Dios respondió?', 'Hace más de 30 días compartiste una petición. Si Dios respondió, cuéntalo al grupo.', '/?go=groups', 'stale:' . $p['id']);
            }
        }
    } catch (PDOException $e) {
        // Fase 3 aún sin migrar
    }
}

// Limpieza: el registro de avisos solo sirve para no repetir en el día/semana
$db->exec('DELETE FROM push_log WHERE sent_at < (NOW() - INTERVAL 60 DAY)');

echo date('c') . ' ' . json_encode($stats) . "\n";
