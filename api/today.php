<?php
/**
 * Maná Digital - Día devocional (Fase 1)
 * Archivo: api/today.php
 * Lectura, rhema, devocional, comunión, examen, diario y preferencias del día
 */

require_once '../config.php';
require_once 'lib_day.php';

setCORSHeaders();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

function readingPayload(PDO $db, $row, $reason) {
    $book = getBook($db, $row['book_id']);
    $verses = chapterVerses($db, $row['book_id'], $row['chapter'], $row['chapter_end']);
    return [
        'source' => $row['source'],
        'book_id' => (int)$row['book_id'],
        'chapter' => (int)$row['chapter'],
        'chapter_end' => (int)$row['chapter_end'],
        'title' => referenceLabel($book['name_es'], $row['chapter'], $row['chapter_end']),
        'reason' => $reason,
        'version' => BIBLE_VERSION_LABEL,
        'has_text' => count($verses) > 0,
        'verses' => $verses,
    ];
}

function readingReason(PDO $db, $userId, $row, $date) {
    return pickReading($db, $userId, $date, $row['source'])['reason'];
}

function rhemaPayload(PDO $db, $row) {
    if (!$row['rhema_verse']) return null;
    $book = getBook($db, $row['book_id']);
    $chapter = $row['rhema_chapter'] ?: $row['chapter'];
    $stmt = $db->prepare('SELECT text FROM bible_verses WHERE version = ? AND book_id = ? AND chapter = ? AND verse = ?');
    $stmt->execute([BIBLE_VERSION, $row['book_id'], $chapter, $row['rhema_verse']]);
    return [
        'chapter' => (int)$chapter,
        'verse' => (int)$row['rhema_verse'],
        'reference' => $book['name_es'] . ' ' . $chapter . ':' . $row['rhema_verse'],
        'text' => $stmt->fetchColumn() ?: null,
    ];
}

function dayPayload(PDO $db, $userId, $row, $today) {
    $settings = getDaySettings($db, $userId);
    $moments = [];
    foreach (MOMENT_SLOTS as $slot => $m) {
        $moments[] = ['slot' => $slot, 'time' => $m['time'], 'label' => $m['label'], 'text' => $m['text'], 'done' => (bool)$row['moment' . $slot]];
    }
    $plan = getActivePlan($db, $userId);
    return [
        'success' => true,
        'date' => $today,
        'settings' => $settings,
        'reading' => readingPayload($db, $row, readingReason($db, $userId, $row, $today)),
        'read_done' => $row['read_at'] !== null,
        'rhema' => rhemaPayload($db, $row),
        'devotional' => ['learned' => $row['learned'] ?? '', 'apply' => $row['apply_text'] ?? '', 'prayer' => $row['prayer'] ?? ''],
        'moments' => $moments,
        'examen' => [
            'learned_check' => (bool)$row['learned_check'] || trim((string)$row['learned']) !== '',
            'communion_check' => (bool)$row['communion_check'] || ($row['moment1'] && $row['moment2'] && $row['moment3']),
            'emotion_id' => $row['examen_emotion_id'] ? (int)$row['examen_emotion_id'] : null,
            'closed' => $row['examen_closed_at'] !== null,
        ],
        'has_plan' => $plan !== null,
        'streak' => computeStreak($db, $userId, $today),
    ];
}

try {
    $db = dayDb();
    $today = todayDate();

    // ----- Día completo -----
    if ($method === 'GET' && $action === 'get') {
        $row = ensureDay($db, $userId, $today);
        jsonResponse(dayPayload($db, $userId, $row, $today));
    }

    // ----- Cambiar la fuente de la lectura (Mi plan / Según ayer) -----
    else if ($method === 'GET' && $action === 'reading') {
        $source = ($_GET['source'] ?? '') === 'feeling' ? 'feeling' : 'plan';
        $row = ensureDay($db, $userId, $today, $source);
        jsonResponse(dayPayload($db, $userId, $row, $today));
    }

    // ----- Marcar lectura hecha y rhema -----
    else if ($method === 'POST' && $action === 'mark-read') {
        $data = readJson();
        $row = ensureDay($db, $userId, $today);
        $verse = isset($data['rhema_verse']) ? (int)$data['rhema_verse'] : null;
        $chapter = (int)($data['rhema_chapter'] ?? $row['chapter']);
        if ($chapter < $row['chapter'] || $chapter > $row['chapter_end']) $chapter = (int)$row['chapter'];
        $db->prepare('UPDATE daily_readings SET read_at = COALESCE(read_at, NOW()), rhema_chapter = ?, rhema_verse = ? WHERE id = ?')
            ->execute([$verse ? $chapter : null, $verse ?: null, $row['id']]);
        jsonResponse(dayPayload($db, $userId, ensureDay($db, $userId, $today), $today));
    }

    // ----- Devocional -----
    else if ($method === 'POST' && $action === 'devotional') {
        $data = readJson();
        $row = ensureDay($db, $userId, $today);
        $clip = function ($v) { return mb_substr(trim((string)($v ?? '')), 0, 4000); };
        $learned = $clip($data['learned'] ?? '');
        $db->prepare('UPDATE daily_readings SET learned = ?, apply_text = ?, prayer = ?, learned_check = ?, read_at = COALESCE(read_at, NOW()) WHERE id = ?')
            ->execute([$learned, $clip($data['apply'] ?? ''), $clip($data['prayer'] ?? ''), $learned !== '' ? 1 : (int)$row['learned_check'], $row['id']]);
        jsonResponse(dayPayload($db, $userId, ensureDay($db, $userId, $today), $today));
    }

    // ----- Momentos de comunión -----
    else if ($method === 'POST' && $action === 'moment') {
        $data = readJson();
        $slot = (int)($data['slot'] ?? 0);
        if ($slot < 1 || $slot > 3) jsonResponse(['success' => false, 'error' => 'Invalid slot'], 400);
        $row = ensureDay($db, $userId, $today);
        $col = 'moment' . $slot; // $slot ya validado como 1..3
        $db->prepare("UPDATE daily_readings SET $col = ? WHERE id = ?")->execute([!empty($data['done']) ? 1 : 0, $row['id']]);
        jsonResponse(dayPayload($db, $userId, ensureDay($db, $userId, $today), $today));
    }

    // ----- Examen de la noche: cierra el día y define la lectura de mañana -----
    else if ($method === 'POST' && $action === 'examen') {
        $data = readJson();
        $row = ensureDay($db, $userId, $today);
        $emotionId = !empty($data['emotion_id']) ? (int)$data['emotion_id'] : null;

        $db->prepare('UPDATE daily_readings SET learned_check = ?, communion_check = ?, examen_emotion_id = ?, examen_closed_at = NOW() WHERE id = ?')
            ->execute([!empty($data['learned_check']) ? 1 : 0, !empty($data['communion_check']) ? 1 : 0, $emotionId, $row['id']]);

        // Reemplaza el check-in diario anterior
        if ($emotionId) {
            $db->prepare('INSERT INTO daily_checkins (user_id, date, emotion_id) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE emotion_id = VALUES(emotion_id), created_at = NOW()')
                ->execute([$userId, $today, $emotionId]);
        }

        // Lectura de mañana
        $tomorrow = date('Y-m-d', strtotime($today . ' +1 day'));
        $mode = getDaySettings($db, $userId)['reading_mode'];
        $next = pickReading($db, $userId, $tomorrow, $mode);
        if ($mode === 'feeling' && $emotionId) {
            $p = emotionPassage($db, $emotionId);
            $next = ['source' => 'feeling', 'plan_id' => null, 'book_id' => (int)$p['book_id'], 'chapter' => (int)$p['chapter'], 'chapter_end' => (int)$p['chapter'], 'reason' => $p['reason_es']];
        }
        $book = getBook($db, $next['book_id']);

        $payload = dayPayload($db, $userId, ensureDay($db, $userId, $today), $today);
        $payload['tomorrow'] = [
            'time' => getDaySettings($db, $userId)['morning_time'],
            'title' => referenceLabel($book['name_es'], $next['chapter'], $next['chapter_end']),
            'reason' => $next['reason'],
        ];
        jsonResponse($payload);
    }

    // ----- Diario -----
    else if ($method === 'GET' && $action === 'diary') {
        $before = preg_match('/^\d{4}-\d{2}-\d{2}$/', $_GET['cursor'] ?? '') ? $_GET['cursor'] : '9999-12-31';
        $stmt = $db->prepare('SELECT date, book_id, chapter, rhema_chapter, rhema_verse, learned, apply_text, prayer FROM daily_readings
            WHERE user_id = ? AND date < ? AND (rhema_verse IS NOT NULL OR learned <> "" OR apply_text <> "" OR prayer <> "")
            ORDER BY date DESC LIMIT 20');
        $stmt->execute([$userId, $before]);
        $entries = [];
        foreach ($stmt->fetchAll() as $r) {
            $book = getBook($db, $r['book_id']);
            $rh = rhemaPayload($db, $r);
            $entries[] = [
                'date' => $r['date'],
                'reference' => $rh ? $rh['reference'] : referenceLabel($book['name_es'], $r['chapter'], $r['chapter']),
                'rhema_text' => $rh ? $rh['text'] : null,
                'learned' => $r['learned'], 'apply' => $r['apply_text'], 'prayer' => $r['prayer'],
            ];
        }
        $cursor = count($entries) === 20 ? end($entries)['date'] : null;
        jsonResponse(['success' => true, 'entries' => $entries, 'next_cursor' => $cursor]);
    }

    // ----- Preferencias del día -----
    else if ($method === 'GET' && $action === 'day-settings') {
        jsonResponse(['success' => true, 'settings' => getDaySettings($db, $userId)]);
    }

    else if ($method === 'PUT' && $action === 'day-settings') {
        $data = readJson();
        $cur = getDaySettings($db, $userId);
        $mode = in_array($data['reading_mode'] ?? '', ['plan', 'feeling'], true) ? $data['reading_mode'] : $cur['reading_mode'];
        $time = function ($v, $fallback) { return preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', (string)$v) ? $v : $fallback; };
        $db->prepare('INSERT INTO user_day_settings (user_id, reading_mode, morning_time, examen_time, onboarded) VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE reading_mode = VALUES(reading_mode), morning_time = VALUES(morning_time),
                examen_time = VALUES(examen_time), onboarded = VALUES(onboarded)')
            ->execute([$userId, $mode, $time($data['morning_time'] ?? null, $cur['morning_time']) . ':00',
                $time($data['examen_time'] ?? null, $cur['examen_time']) . ':00', !empty($data['onboarded']) || $cur['onboarded'] ? 1 : 0]);
        jsonResponse(['success' => true, 'settings' => getDaySettings($db, $userId)]);
    }

    else {
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    error_log('today.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Request failed'], 500);
}
