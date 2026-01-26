<?php
/**
 * Prayer App - Verses API
 * Archivo: api/verses.php
 * Maneja la obtención de versículos personalizados
 */

require_once '../config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

// ================================================
// OBTENER VERSÍCULO PERSONALIZADO
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
            // Hay check-in hoy, obtener temas relacionados con la emoción
            $stmt = $db->prepare("
                SELECT DISTINCT v.id, v.reference, v.book, v.chapter,
                       v.verse_start, v.verse_end, v.text_es, v.text_en,
                       t.key_name as theme_key, t.name_es as theme_name_es,
                       t.name_en as theme_name_en
                FROM verses v
                INNER JOIN verse_themes t ON v.theme_id = t.id
                INNER JOIN emotion_theme_mapping m ON t.id = m.theme_id
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
                SELECT v.id, v.reference, v.book, v.chapter,
                       v.verse_start, v.verse_end, v.text_es, v.text_en,
                       t.key_name as theme_key, t.name_es as theme_name_es,
                       t.name_en as theme_name_en
                FROM verses v
                INNER JOIN verse_themes t ON v.theme_id = t.id
                WHERE t.key_name = ?
                ORDER BY RAND()
                LIMIT 1
            ");
            $stmt->execute([$defaultTheme]);
        }
        
        $verse = $stmt->fetch();
        
        if (!$verse) {
            jsonResponse([
                'success' => false,
                'error' => 'No verse found'
            ], 404);
        }
        
        // Guardar en historial
        $emotionId = $checkin['emotion_id'] ?? null;
        $stmt = $db->prepare("
            INSERT INTO verse_history (user_id, verse_id, emotion_context_id, sent_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $verse['id'], $emotionId]);
        
        $verse['history_id'] = $db->lastInsertId();
        $verse['timestamp'] = date('c');
        
        jsonResponse([
            'success' => true,
            'verse' => $verse
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch personalized verse'
        ], 500);
    }
}

// ================================================
// OBTENER VERSÍCULOS POR TEMA
// ================================================
else if ($method === 'GET' && $action === 'by-theme') {
    $theme = $_GET['theme'] ?? 'faith';
    $limit = $_GET['limit'] ?? 5;
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            SELECT v.id, v.reference, v.book, v.chapter,
                   v.verse_start, v.verse_end, v.text_es, v.text_en,
                   t.key_name as theme_key, t.name_es as theme_name_es,
                   t.name_en as theme_name_en
            FROM verses v
            INNER JOIN verse_themes t ON v.theme_id = t.id
            WHERE t.key_name = ?
            ORDER BY RAND()
            LIMIT ?
        ");
        $stmt->execute([$theme, (int)$limit]);
        $verses = $stmt->fetchAll();
        
        jsonResponse([
            'success' => true,
            'verses' => $verses,
            'theme' => $theme
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch verses'
        ], 500);
    }
}

// ================================================
// OBTENER TEMAS DISPONIBLES
// ================================================
else if ($method === 'GET' && $action === 'themes') {
    try {
        $db = getDBConnection();
        
        $stmt = $db->query("
            SELECT id, key_name, name_es, name_en, description_es, description_en,
                   (SELECT COUNT(*) FROM verses WHERE theme_id = verse_themes.id) as verse_count
            FROM verse_themes
            ORDER BY name_es
        ");
        $themes = $stmt->fetchAll();
        
        jsonResponse([
            'success' => true,
            'themes' => $themes
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch themes'
        ], 500);
    }
}

// ================================================
// OBTENER HISTORIAL DE VERSÍCULOS
// ================================================
else if ($method === 'GET' && $action === 'history') {
    $limit = $_GET['limit'] ?? 50;
    $offset = $_GET['offset'] ?? 0;
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            SELECT h.id as history_id, h.sent_at,
                   v.id as verse_id, v.reference, v.book, v.chapter,
                   v.verse_start, v.verse_end, v.text_es, v.text_en,
                   t.key_name as theme_key, t.name_es as theme_name_es,
                   t.name_en as theme_name_en,
                   e.id as emotion_id, e.key_name as emotion_key,
                   e.name_es as emotion_name_es, e.name_en as emotion_name_en,
                   e.emoji as emotion_emoji,
                   (SELECT COUNT(*) > 0 FROM favorites WHERE user_id = ? AND verse_id = v.id) as is_favorited
            FROM verse_history h
            INNER JOIN verses v ON h.verse_id = v.id
            INNER JOIN verse_themes t ON v.theme_id = t.id
            LEFT JOIN emotions e ON h.emotion_context_id = e.id
            WHERE h.user_id = ?
            ORDER BY h.sent_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$userId, $userId, (int)$limit, (int)$offset]);
        $history = $stmt->fetchAll();
        
        // Convertir is_favorited a booleano
        foreach ($history as &$item) {
            $item['is_favorited'] = (bool)$item['is_favorited'];
        }
        
        // Contar total
        $stmt = $db->prepare("SELECT COUNT(*) FROM verse_history WHERE user_id = ?");
        $stmt->execute([$userId]);
        $total = $stmt->fetchColumn();
        
        jsonResponse([
            'success' => true,
            'history' => $history,
            'total' => (int)$total,
            'limit' => (int)$limit,
            'offset' => (int)$offset
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch history'
        ], 500);
    }
}

// ================================================
// BUSCAR VERSÍCULOS
// ================================================
else if ($method === 'GET' && $action === 'search') {
    $query = $_GET['q'] ?? '';
    $limit = $_GET['limit'] ?? 20;
    
    if (empty($query)) {
        jsonResponse([
            'success' => false,
            'error' => 'Search query is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        $searchTerm = "%{$query}%";
        
        $stmt = $db->prepare("
            SELECT v.id, v.reference, v.book, v.chapter,
                   v.verse_start, v.verse_end, v.text_es, v.text_en,
                   t.key_name as theme_key, t.name_es as theme_name_es,
                   t.name_en as theme_name_en,
                   (SELECT COUNT(*) > 0 FROM favorites WHERE user_id = ? AND verse_id = v.id) as is_favorited
            FROM verses v
            INNER JOIN verse_themes t ON v.theme_id = t.id
            WHERE v.reference LIKE ? 
               OR v.text_es LIKE ? 
               OR v.text_en LIKE ?
               OR v.book LIKE ?
            ORDER BY v.book, v.chapter, v.verse_start
            LIMIT ?
        ");
        $stmt->execute([$userId, $searchTerm, $searchTerm, $searchTerm, $searchTerm, (int)$limit]);
        $verses = $stmt->fetchAll();
        
        // Convertir is_favorited a booleano
        foreach ($verses as &$verse) {
            $verse['is_favorited'] = (bool)$verse['is_favorited'];
        }
        
        jsonResponse([
            'success' => true,
            'verses' => $verses,
            'query' => $query,
            'count' => count($verses)
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Search failed'
        ], 500);
    }
}

// ================================================
// OBTENER VERSÍCULO ESPECÍFICO
// ================================================
else if ($method === 'GET' && $action === 'get') {
    $verseId = $_GET['id'] ?? null;
    
    if (!$verseId) {
        jsonResponse([
            'success' => false,
            'error' => 'Verse ID is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            SELECT v.id, v.reference, v.book, v.chapter,
                   v.verse_start, v.verse_end, v.text_es, v.text_en,
                   t.key_name as theme_key, t.name_es as theme_name_es,
                   t.name_en as theme_name_en,
                   (SELECT COUNT(*) > 0 FROM favorites WHERE user_id = ? AND verse_id = v.id) as is_favorited
            FROM verses v
            INNER JOIN verse_themes t ON v.theme_id = t.id
            WHERE v.id = ?
        ");
        $stmt->execute([$userId, $verseId]);
        $verse = $stmt->fetch();
        
        if (!$verse) {
            jsonResponse([
                'success' => false,
                'error' => 'Verse not found'
            ], 404);
        }
        
        $verse['is_favorited'] = (bool)$verse['is_favorited'];
        
        jsonResponse([
            'success' => true,
            'verse' => $verse
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch verse'
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