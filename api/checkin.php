<?php
/**
 * Prayer App - Check-in API
 * Archivo: api/checkin.php
 * Maneja los check-ins emocionales diarios
 */

require_once '../config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

// ================================================
// OBTENER EMOCIONES DISPONIBLES
// ================================================
if ($method === 'GET' && $action === 'emotions') {
    try {
        $db = getDBConnection();
        
        $stmt = $db->query("
            SELECT id, key_name, name_es, name_en, emoji, theme_suggestion, color
            FROM emotions
            ORDER BY id
        ");
        $emotions = $stmt->fetchAll();
        
        jsonResponse([
            'success' => true,
            'emotions' => $emotions
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch emotions'
        ], 500);
    }
}

// ================================================
// CREAR CHECK-IN DIARIO
// ================================================
else if ($method === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos
    if (empty($data['emotion_id'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Emotion ID is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        $today = date('Y-m-d');
        $notes = $data['notes'] ?? null;
        
        // Verificar si ya existe un check-in hoy
        $stmt = $db->prepare("
            SELECT id FROM daily_checkins
            WHERE user_id = ? AND date = ?
        ");
        $stmt->execute([$userId, $today]);
        
        if ($stmt->fetch()) {
            // Actualizar check-in existente
            $stmt = $db->prepare("
                UPDATE daily_checkins
                SET emotion_id = ?, notes = ?, created_at = NOW()
                WHERE user_id = ? AND date = ?
            ");
            $stmt->execute([$data['emotion_id'], $notes, $userId, $today]);
            
            jsonResponse([
                'success' => true,
                'message' => 'Check-in updated successfully'
            ]);
        } else {
            // Crear nuevo check-in
            $stmt = $db->prepare("
                INSERT INTO daily_checkins (user_id, date, emotion_id, notes, created_at)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmt->execute([$userId, $today, $data['emotion_id'], $notes]);
            
            jsonResponse([
                'success' => true,
                'message' => 'Check-in created successfully',
                'id' => $db->lastInsertId()
            ], 201);
        }
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to create check-in'
        ], 500);
    }
}

// ================================================
// OBTENER CHECK-IN DE HOY
// ================================================
else if ($method === 'GET' && $action === 'today') {
    try {
        $db = getDBConnection();
        
        $today = date('Y-m-d');
        
        $stmt = $db->prepare("
            SELECT c.id, c.date, c.notes, c.created_at,
                   e.id as emotion_id, e.key_name, e.name_es, e.name_en,
                   e.emoji, e.theme_suggestion, e.color
            FROM daily_checkins c
            INNER JOIN emotions e ON c.emotion_id = e.id
            WHERE c.user_id = ? AND c.date = ?
        ");
        $stmt->execute([$userId, $today]);
        $checkin = $stmt->fetch();
        
        jsonResponse([
            'success' => true,
            'checkin' => $checkin ?: null,
            'has_checkin' => $checkin !== false
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch today\'s check-in'
        ], 500);
    }
}

// ================================================
// OBTENER HISTORIAL DE CHECK-INS
// ================================================
else if ($method === 'GET' && $action === 'history') {
    $limit = $_GET['limit'] ?? 30;
    $offset = $_GET['offset'] ?? 0;
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            SELECT c.id, c.date, c.notes, c.created_at,
                   e.id as emotion_id, e.key_name, e.name_es, e.name_en,
                   e.emoji, e.theme_suggestion, e.color
            FROM daily_checkins c
            INNER JOIN emotions e ON c.emotion_id = e.id
            WHERE c.user_id = ?
            ORDER BY c.date DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$userId, (int)$limit, (int)$offset]);
        $checkins = $stmt->fetchAll();
        
        // Contar total
        $stmt = $db->prepare("SELECT COUNT(*) FROM daily_checkins WHERE user_id = ?");
        $stmt->execute([$userId]);
        $total = $stmt->fetchColumn();
        
        jsonResponse([
            'success' => true,
            'checkins' => $checkins,
            'total' => (int)$total,
            'limit' => (int)$limit,
            'offset' => (int)$offset
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch check-in history'
        ], 500);
    }
}

// ================================================
// OBTENER ESTADÍSTICAS EMOCIONALES
// ================================================
else if ($method === 'GET' && $action === 'stats') {
    $days = $_GET['days'] ?? 30;
    
    try {
        $db = getDBConnection();
        
        $startDate = date('Y-m-d', strtotime("-{$days} days"));
        
        // Estadísticas por emoción
        $stmt = $db->prepare("
            SELECT e.id, e.key_name, e.name_es, e.name_en, e.emoji, e.color,
                   COUNT(c.id) as count
            FROM emotions e
            LEFT JOIN daily_checkins c ON e.id = c.emotion_id
                AND c.user_id = ? AND c.date >= ?
            GROUP BY e.id
            ORDER BY count DESC
        ");
        $stmt->execute([$userId, $startDate]);
        $emotionStats = $stmt->fetchAll();
        
        // Check-ins por día (últimos X días)
        $stmt = $db->prepare("
            SELECT c.date, e.key_name, e.name_es, e.name_en, e.emoji, e.color
            FROM daily_checkins c
            INNER JOIN emotions e ON c.emotion_id = e.id
            WHERE c.user_id = ? AND c.date >= ?
            ORDER BY c.date DESC
        ");
        $stmt->execute([$userId, $startDate]);
        $dailyCheckins = $stmt->fetchAll();
        
        // Tendencias (semana actual vs semana pasada)
        $thisWeekStart = date('Y-m-d', strtotime('monday this week'));
        $lastWeekStart = date('Y-m-d', strtotime('monday last week'));
        $lastWeekEnd = date('Y-m-d', strtotime('sunday last week'));
        
        $stmt = $db->prepare("
            SELECT e.key_name, COUNT(*) as count
            FROM daily_checkins c
            INNER JOIN emotions e ON c.emotion_id = e.id
            WHERE c.user_id = ? AND c.date >= ?
            GROUP BY e.key_name
        ");
        $stmt->execute([$userId, $thisWeekStart]);
        $thisWeek = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        $stmt = $db->prepare("
            SELECT e.key_name, COUNT(*) as count
            FROM daily_checkins c
            INNER JOIN emotions e ON c.emotion_id = e.id
            WHERE c.user_id = ? AND c.date BETWEEN ? AND ?
            GROUP BY e.key_name
        ");
        $stmt->execute([$userId, $lastWeekStart, $lastWeekEnd]);
        $lastWeek = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Total de check-ins
        $stmt = $db->prepare("
            SELECT COUNT(*) FROM daily_checkins
            WHERE user_id = ? AND date >= ?
        ");
        $stmt->execute([$userId, $startDate]);
        $totalCheckins = $stmt->fetchColumn();
        
        // Racha actual (días consecutivos)
        $stmt = $db->prepare("
            SELECT date FROM daily_checkins
            WHERE user_id = ?
            ORDER BY date DESC
        ");
        $stmt->execute([$userId]);
        $allDates = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        $streak = 0;
        $currentDate = new DateTime();
        foreach ($allDates as $date) {
            $checkinDate = new DateTime($date);
            $diff = $currentDate->diff($checkinDate)->days;
            
            if ($diff === $streak) {
                $streak++;
            } else {
                break;
            }
        }
        
        jsonResponse([
            'success' => true,
            'stats' => [
                'emotions' => $emotionStats,
                'daily' => $dailyCheckins,
                'trends' => [
                    'this_week' => $thisWeek,
                    'last_week' => $lastWeek
                ],
                'total_checkins' => (int)$totalCheckins,
                'current_streak' => $streak,
                'period_days' => (int)$days
            ]
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch statistics'
        ], 500);
    }
}

// ================================================
// ACTUALIZAR CHECK-IN
// ================================================
else if ($method === 'PUT' && $action === 'update') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Check-in ID is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        $updates = [];
        $params = [];
        
        if (isset($data['emotion_id'])) {
            $updates[] = "emotion_id = ?";
            $params[] = $data['emotion_id'];
        }
        
        if (isset($data['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $data['notes'];
        }
        
        if (empty($updates)) {
            jsonResponse([
                'success' => false,
                'error' => 'No fields to update'
            ], 400);
        }
        
        $params[] = $data['id'];
        $params[] = $userId;
        
        $sql = "UPDATE daily_checkins SET " . implode(', ', $updates) . 
               " WHERE id = ? AND user_id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            jsonResponse([
                'success' => false,
                'error' => 'Check-in not found'
            ], 404);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Check-in updated successfully'
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to update check-in'
        ], 500);
    }
}

// ================================================
// MÉTODO NO PERMITIDO
// ================================================
else {
    jsonResponse([
        'success' => false,
        'error' => 'Method not allowed'
    ], 405);
}
?>