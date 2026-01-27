<?php
/**
 * Maná Digital - Stories API
 * Archivo: api/stories.php
 * Maneja la obtención de relatos bíblicos personalizados
 */

require_once '../config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

// ================================================
// OBTENER RELATO PERSONALIZADO
// ================================================
if ($method === 'GET' && $action === 'personalized') {
    try {
        $db = getDBConnection();

        // Obtener check-in de hoy
        $today = date('Y-m-d');
        $stmt = $db->prepare("
            SELECT emotion_id FROM daily_checkins
            WHERE user_id = ? AND date = ?
        ");
        $stmt->execute([$userId, $today]);
        $checkin = $stmt->fetch();

        if ($checkin) {
            // Hay check-in hoy, obtener relatos relacionados con la emoción
            $stmt = $db->prepare("
                SELECT DISTINCT s.id, s.title_es, s.title_en, s.reference,
                       s.summary_es, s.summary_en, s.moral_es, s.moral_en,
                       t.key_name as theme_key, t.name_es as theme_name_es,
                       t.name_en as theme_name_en
                FROM bible_stories s
                INNER JOIN verse_themes t ON s.theme_id = t.id
                INNER JOIN story_theme_mapping m ON t.id = m.theme_id
                WHERE m.emotion_id = ?
                ORDER BY m.priority ASC, RAND()
                LIMIT 1
            ");
            $stmt->execute([$checkin['emotion_id']]);
        } else {
            // No hay check-in, usar configuración por defecto del usuario
            $stmt = $db->prepare("
                SELECT default_theme FROM user_settings WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $settings = $stmt->fetch();
            $defaultTheme = $settings['default_theme'] ?? 'faith';

            $stmt = $db->prepare("
                SELECT s.id, s.title_es, s.title_en, s.reference,
                       s.summary_es, s.summary_en, s.moral_es, s.moral_en,
                       t.key_name as theme_key, t.name_es as theme_name_es,
                       t.name_en as theme_name_en
                FROM bible_stories s
                INNER JOIN verse_themes t ON s.theme_id = t.id
                WHERE t.key_name = ?
                ORDER BY RAND()
                LIMIT 1
            ");
            $stmt->execute([$defaultTheme]);
        }

        $story = $stmt->fetch();

        if (!$story) {
            jsonResponse([
                'success' => false,
                'error' => 'No story found'
            ], 404);
        }

        // Guardar en historial
        $emotionId = $checkin['emotion_id'] ?? null;
        $stmt = $db->prepare("
            INSERT INTO story_history (user_id, story_id, emotion_context_id, sent_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $story['id'], $emotionId]);

        $story['history_id'] = $db->lastInsertId();
        $story['timestamp'] = date('c');

        jsonResponse([
            'success' => true,
            'story' => $story
        ]);

    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch personalized story',
            'debug' => $e->getMessage()
        ], 500);
    }
}

// ================================================
// OBTENER RELATO POR ID
// ================================================
if ($method === 'GET' && $action === 'get') {
    $storyId = $_GET['id'] ?? null;

    if (!$storyId) {
        jsonResponse(['success' => false, 'error' => 'Story ID required'], 400);
    }

    try {
        $db = getDBConnection();

        $stmt = $db->prepare("
            SELECT s.id, s.title_es, s.title_en, s.reference,
                   s.summary_es, s.summary_en, s.moral_es, s.moral_en,
                   t.key_name as theme_key, t.name_es as theme_name_es,
                   t.name_en as theme_name_en
            FROM bible_stories s
            INNER JOIN verse_themes t ON s.theme_id = t.id
            WHERE s.id = ?
        ");
        $stmt->execute([$storyId]);
        $story = $stmt->fetch();

        if (!$story) {
            jsonResponse(['success' => false, 'error' => 'Story not found'], 404);
        }

        jsonResponse(['success' => true, 'story' => $story]);

    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error'], 500);
    }
}

// ================================================
// OBTENER HISTORIAL DE RELATOS
// ================================================
if ($method === 'GET' && $action === 'history') {
    $limit = min((int)($_GET['limit'] ?? 20), 50);

    try {
        $db = getDBConnection();

        $stmt = $db->prepare("
            SELECT sh.id as history_id, sh.sent_at,
                   s.id, s.title_es, s.title_en, s.reference,
                   s.summary_es, s.summary_en, s.moral_es, s.moral_en,
                   t.name_es as theme_name_es, t.name_en as theme_name_en,
                   e.name_es as emotion_name_es, e.name_en as emotion_name_en, e.emoji
            FROM story_history sh
            INNER JOIN bible_stories s ON sh.story_id = s.id
            INNER JOIN verse_themes t ON s.theme_id = t.id
            LEFT JOIN emotions e ON sh.emotion_context_id = e.id
            WHERE sh.user_id = ?
            ORDER BY sh.sent_at DESC
            LIMIT ?
        ");
        $stmt->execute([$userId, $limit]);
        $history = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'history' => $history
        ]);

    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error'], 500);
    }
}

// ================================================
// OBTENER RELATOS POR TEMA
// ================================================
if ($method === 'GET' && $action === 'by-theme') {
    $theme = $_GET['theme'] ?? null;

    if (!$theme) {
        jsonResponse(['success' => false, 'error' => 'Theme required'], 400);
    }

    try {
        $db = getDBConnection();

        $stmt = $db->prepare("
            SELECT s.id, s.title_es, s.title_en, s.reference,
                   s.moral_es, s.moral_en,
                   t.key_name as theme_key, t.name_es as theme_name_es
            FROM bible_stories s
            INNER JOIN verse_themes t ON s.theme_id = t.id
            WHERE t.key_name = ?
            ORDER BY s.title_es
        ");
        $stmt->execute([$theme]);
        $stories = $stmt->fetchAll();

        jsonResponse([
            'success' => true,
            'stories' => $stories
        ]);

    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'Database error'], 500);
    }
}

// Método no soportado
jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
