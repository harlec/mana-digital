<?php
/**
 * Maná Digital - Planes de lectura personales
 * Archivo: api/plans.php
 */

require_once '../config.php';
require_once 'lib_day.php';

setCORSHeaders();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

// Libros sugeridos en el catálogo (id de bible_books)
const CATALOG_BOOKS = [43, 44, 19, 20, 45, 41];

function planSummary(PDO $db, $plan, $today) {
    $book = getBook($db, $plan['book_id']);
    $n = planDayNumber($plan, $today);
    $past = (int)((strtotime($today) - strtotime($plan['start_date'])) / 86400) + 1;
    return [
        'id' => (int)$plan['id'], 'title' => $plan['title'], 'book_id' => (int)$plan['book_id'],
        'book' => $book['name_es'], 'pace' => (int)$plan['pace'], 'total_days' => (int)$plan['total_days'],
        'start_date' => $plan['start_date'],
        'day' => $n ?? min(max($past, 0), (int)$plan['total_days']),
        'finished' => $past > (int)$plan['total_days'],
    ];
}

try {
    $db = dayDb();
    $today = todayDate();

    if ($method === 'GET' && $action === 'list') {
        $ids = implode(',', CATALOG_BOOKS);
        $books = $db->query("SELECT id, name_es, chapters FROM bible_books WHERE id IN ($ids)")->fetchAll();
        jsonResponse(['success' => true, 'catalog' => $books]);
    }

    else if ($method === 'GET' && $action === 'mine') {
        $plan = getActivePlan($db, $userId);
        jsonResponse(['success' => true, 'plan' => $plan ? planSummary($db, $plan, $today) : null]);
    }

    else if ($method === 'POST' && $action === 'start') {
        $data = readJson();
        $book = getBook($db, (int)($data['book_id'] ?? 0));
        $pace = max(1, min(3, (int)($data['pace'] ?? 1)));
        $period = $data['period'] ?? 'book';
        if (!$book) jsonResponse(['success' => false, 'error' => 'Invalid book'], 400);

        $days = (int)ceil($book['chapters'] / $pace);
        if ($period === 'week') $days = min($days, 7);
        elseif ($period === 'month') $days = min($days, 30);

        $db->beginTransaction();
        $db->prepare('UPDATE reading_plans SET is_active = 0 WHERE user_id = ?')->execute([$userId]);
        $db->prepare('INSERT INTO reading_plans (user_id, title, book_id, pace, start_date, total_days) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$userId, $book['name_es'], $book['id'], $pace, $today, $days]);
        $planId = $db->lastInsertId();
        $db->commit();

        // La lectura de hoy pasa a ser el día 1 del plan, si aún no se marcó como leída
        ensureDay($db, $userId, $today, 'plan');
        $plan = getActivePlan($db, $userId);
        jsonResponse(['success' => true, 'plan' => planSummary($db, $plan, $today)], 201);
    }

    else if ($method === 'GET' && $action === 'days') {
        $plan = getActivePlan($db, $userId);
        if (!$plan) jsonResponse(['success' => true, 'plan' => null, 'days' => []]);

        $stmt = $db->prepare('SELECT date FROM daily_readings WHERE user_id = ? AND plan_id = ? AND read_at IS NOT NULL');
        $stmt->execute([$userId, $plan['id']]);
        $done = array_flip($stmt->fetchAll(PDO::FETCH_COLUMN));

        $book = getBook($db, $plan['book_id']);
        $days = [];
        for ($n = 1; $n <= (int)$plan['total_days']; $n++) {
            $date = date('Y-m-d', strtotime($plan['start_date'] . ' +' . ($n - 1) . ' day'));
            $range = planChapterRange($db, $plan, $n);
            $days[] = [
                'day' => $n, 'date' => $date,
                'reference' => $range ? referenceLabel($book['name_es'], $range[0], $range[1]) : '',
                'done' => isset($done[$date]),
                'is_today' => $date === $today,
            ];
        }
        jsonResponse(['success' => true, 'plan' => planSummary($db, $plan, $today), 'days' => $days]);
    }

    else {
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('plans.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Request failed'], 500);
}
