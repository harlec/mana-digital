<?php
/**
 * Maná Digital - Utilidades del día devocional (Fase 1)
 * Archivo: api/lib_day.php
 */

const BIBLE_VERSION = 'RV1909';
const BIBLE_VERSION_LABEL = 'Reina Valera 1909';
const MOMENT_SLOTS = [
    1 => ['time' => '10:30', 'label' => 'En el trabajo', 'text' => 'Haz una pausa de un minuto. Respira y repite tu palabra de hoy.'],
    2 => ['time' => '13:00', 'label' => 'Al comer', 'text' => 'Mientras comes, da gracias. Él te sostiene cada día.'],
    3 => ['time' => '17:30', 'label' => 'En el camino', 'text' => 'De regreso a casa, ora sin cesar. Cuéntale cómo va tu día.'],
];

// Si las tablas de la Fase 1 aún no existen, responder algo que el frontend entienda.
function dayDb() {
    $db = getDBConnection();
    try {
        $db->query('SELECT 1 FROM daily_readings LIMIT 1');
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'migration_pending'], 503);
    }
    return $db;
}

function todayDate() { return date('Y-m-d'); }

function getBook(PDO $db, $bookId) {
    $stmt = $db->prepare('SELECT id, name_es, chapters FROM bible_books WHERE id = ?');
    $stmt->execute([$bookId]);
    return $stmt->fetch() ?: null;
}

function referenceLabel($bookName, $ch, $chEnd) {
    return $bookName . ' ' . $ch . ($chEnd > $ch ? '–' . $chEnd : '');
}

function getDaySettings(PDO $db, $userId) {
    $stmt = $db->prepare('SELECT reading_mode, morning_time, examen_time, onboarded FROM user_day_settings WHERE user_id = ?');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
        return ['reading_mode' => 'plan', 'morning_time' => '07:00', 'examen_time' => '21:30', 'onboarded' => false];
    }
    return [
        'reading_mode' => $row['reading_mode'],
        'morning_time' => substr($row['morning_time'], 0, 5),
        'examen_time' => substr($row['examen_time'], 0, 5),
        'onboarded' => (bool)$row['onboarded'],
    ];
}

function getActivePlan(PDO $db, $userId) {
    $stmt = $db->prepare('SELECT * FROM reading_plans WHERE user_id = ? AND is_active = 1 ORDER BY id DESC LIMIT 1');
    $stmt->execute([$userId]);
    return $stmt->fetch() ?: null;
}

// Día del plan (1-based) para una fecha; null si aún no empieza o ya terminó.
function planDayNumber($plan, $date) {
    $n = (int)((strtotime($date) - strtotime($plan['start_date'])) / 86400) + 1;
    return ($n >= 1 && $n <= (int)$plan['total_days']) ? $n : null;
}

// Capítulos [desde, hasta] del día n del plan
function planChapterRange(PDO $db, $plan, $n) {
    $book = getBook($db, $plan['book_id']);
    $from = ($n - 1) * (int)$plan['pace'] + 1;
    $to = min($n * (int)$plan['pace'], (int)$book['chapters']);
    return $from > $book['chapters'] ? null : [$from, $to];
}

// Pasaje sugerido por una emoción; si no hay, un salmo por defecto.
function emotionPassage(PDO $db, $emotionId) {
    $stmt = $db->prepare('SELECT p.book_id, p.chapter, p.reason_es FROM emotion_passages p
        INNER JOIN emotions e ON e.key_name = p.emotion_key WHERE e.id = ?');
    $stmt->execute([$emotionId]);
    $row = $stmt->fetch();
    if ($row) return $row;
    return ['book_id' => 19, 'chapter' => 23, 'reason_es' => 'Un salmo para empezar el día.'];
}

// Última emoción registrada: el examen de ayer o, si no, el último check-in.
function lastEmotionId(PDO $db, $userId, $today) {
    $stmt = $db->prepare('SELECT examen_emotion_id FROM daily_readings
        WHERE user_id = ? AND date < ? AND examen_emotion_id IS NOT NULL ORDER BY date DESC LIMIT 1');
    $stmt->execute([$userId, $today]);
    $id = $stmt->fetchColumn();
    if ($id) return (int)$id;
    $stmt = $db->prepare('SELECT emotion_id FROM daily_checkins WHERE user_id = ? ORDER BY date DESC LIMIT 1');
    $stmt->execute([$userId]);
    $id = $stmt->fetchColumn();
    return $id ? (int)$id : null;
}

// Decide la lectura de una fecha según la fuente pedida.
// Devuelve ['source','plan_id','book_id','chapter','chapter_end','reason'].
function pickReading(PDO $db, $userId, $date, $source) {
    if ($source === 'plan') {
        $plan = getActivePlan($db, $userId);
        if ($plan && ($n = planDayNumber($plan, $date)) && ($range = planChapterRange($db, $plan, $n))) {
            $book = getBook($db, $plan['book_id']);
            return [
                'source' => 'plan', 'plan_id' => (int)$plan['id'], 'book_id' => (int)$plan['book_id'],
                'chapter' => $range[0], 'chapter_end' => $range[1],
                'reason' => 'Plan “' . $plan['title'] . '” · Día ' . $n . ' de ' . $plan['total_days'],
            ];
        }
    }
    $emotionId = lastEmotionId($db, $userId, $date);
    if ($emotionId) {
        $p = emotionPassage($db, $emotionId);
    } else {
        $p = ['book_id' => 19, 'chapter' => 23, 'reason_es' => 'Un salmo para empezar el día.'];
    }
    return [
        'source' => 'feeling', 'plan_id' => null, 'book_id' => (int)$p['book_id'],
        'chapter' => (int)$p['chapter'], 'chapter_end' => (int)$p['chapter'], 'reason' => $p['reason_es'],
    ];
}

function chapterVerses(PDO $db, $bookId, $from, $to) {
    $stmt = $db->prepare('SELECT chapter, verse AS n, text FROM bible_verses
        WHERE version = ? AND book_id = ? AND chapter BETWEEN ? AND ? ORDER BY chapter, verse');
    $stmt->execute([BIBLE_VERSION, $bookId, $from, $to]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) { $r['chapter'] = (int)$r['chapter']; $r['n'] = (int)$r['n']; }
    return $rows;
}

// Obtiene (o crea) el registro del día. $source solo fuerza la fuente al crearlo o cambiarla.
function ensureDay(PDO $db, $userId, $date, $source = null) {
    $stmt = $db->prepare('SELECT * FROM daily_readings WHERE user_id = ? AND date = ?');
    $stmt->execute([$userId, $date]);
    $row = $stmt->fetch();

    if ($row && ($source === null || $source === $row['source'])) return $row;

    $wanted = $source ?? getDaySettings($db, $userId)['reading_mode'];
    $r = pickReading($db, $userId, $date, $wanted);

    if ($row) {
        // Cambiar de fuente solo si aún no se marcó la lectura como hecha
        if ($row['read_at'] === null) {
            $db->prepare('UPDATE daily_readings SET source = ?, plan_id = ?, book_id = ?, chapter = ?, chapter_end = ?, rhema_chapter = NULL, rhema_verse = NULL
                WHERE id = ?')->execute([$r['source'], $r['plan_id'], $r['book_id'], $r['chapter'], $r['chapter_end'], $row['id']]);
        }
    } else {
        $db->prepare('INSERT INTO daily_readings (user_id, date, source, plan_id, book_id, chapter, chapter_end)
            VALUES (?, ?, ?, ?, ?, ?, ?)')->execute([$userId, $date, $r['source'], $r['plan_id'], $r['book_id'], $r['chapter'], $r['chapter_end']]);
    }
    $stmt->execute([$userId, $date]);
    return $stmt->fetch();
}

// Racha: días consecutivos con lectura hecha, terminando hoy (o ayer si hoy aún no se lee).
function computeStreak(PDO $db, $userId, $today) {
    $stmt = $db->prepare('SELECT date FROM daily_readings WHERE user_id = ? AND read_at IS NOT NULL AND date <= ? ORDER BY date DESC LIMIT 400');
    $stmt->execute([$userId, $today]);
    $dates = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $streak = 0;
    $expected = $today;
    if (!$dates || $dates[0] !== $today) $expected = date('Y-m-d', strtotime($today . ' -1 day'));
    foreach ($dates as $d) {
        if ($d === $expected) { $streak++; $expected = date('Y-m-d', strtotime($expected . ' -1 day')); }
        elseif ($d < $expected) break;
    }
    return $streak;
}

function readJson() {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}
