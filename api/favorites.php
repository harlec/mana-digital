<?php
/**
 * Prayer App - Favorites API
 * Archivo: api/favorites.php
 * Maneja los versículos favoritos del usuario
 */

require_once '../config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

// ================================================
// OBTENER FAVORITOS
// ================================================
if ($method === 'GET' && $action === 'list') {
    $limit = $_GET['limit'] ?? 100;
    $offset = $_GET['offset'] ?? 0;
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            SELECT f.id as favorite_id, f.created_at as favorited_at,
                   v.id as verse_id, v.reference, v.book, v.chapter,
                   v.verse_start, v.verse_end, v.text_es, v.text_en,
                   t.key_name as theme_key, t.name_es as theme_name_es,
                   t.name_en as theme_name_en
            FROM favorites f
            INNER JOIN verses v ON f.verse_id = v.id
            INNER JOIN verse_themes t ON v.theme_id = t.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$userId, (int)$limit, (int)$offset]);
        $favorites = $stmt->fetchAll();
        
        // Contar total
        $stmt = $db->prepare("SELECT COUNT(*) FROM favorites WHERE user_id = ?");
        $stmt->execute([$userId]);
        $total = $stmt->fetchColumn();
        
        jsonResponse([
            'success' => true,
            'favorites' => $favorites,
            'total' => (int)$total,
            'limit' => (int)$limit,
            'offset' => (int)$offset
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch favorites'
        ], 500);
    }
}

// ================================================
// AGREGAR A FAVORITOS
// ================================================
else if ($method === 'POST' && $action === 'add') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['verse_id'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Verse ID is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        // Verificar que el versículo existe
        $stmt = $db->prepare("SELECT id FROM verses WHERE id = ?");
        $stmt->execute([$data['verse_id']]);
        if (!$stmt->fetch()) {
            jsonResponse([
                'success' => false,
                'error' => 'Verse not found'
            ], 404);
        }
        
        // Verificar si ya está en favoritos
        $stmt = $db->prepare("
            SELECT id FROM favorites 
            WHERE user_id = ? AND verse_id = ?
        ");
        $stmt->execute([$userId, $data['verse_id']]);
        
        if ($stmt->fetch()) {
            jsonResponse([
                'success' => false,
                'error' => 'Verse already in favorites'
            ], 409);
        }
        
        // Agregar a favoritos
        $stmt = $db->prepare("
            INSERT INTO favorites (user_id, verse_id, created_at)
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$userId, $data['verse_id']]);
        
        jsonResponse([
            'success' => true,
            'message' => 'Added to favorites',
            'favorite_id' => $db->lastInsertId()
        ], 201);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to add favorite'
        ], 500);
    }
}

// ================================================
// ELIMINAR DE FAVORITOS
// ================================================
else if ($method === 'DELETE' && $action === 'remove') {
    $verseId = $_GET['verse_id'] ?? null;
    
    if (!$verseId) {
        jsonResponse([
            'success' => false,
            'error' => 'Verse ID is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            DELETE FROM favorites 
            WHERE user_id = ? AND verse_id = ?
        ");
        $stmt->execute([$userId, $verseId]);
        
        if ($stmt->rowCount() === 0) {
            jsonResponse([
                'success' => false,
                'error' => 'Favorite not found'
            ], 404);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Removed from favorites'
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to remove favorite'
        ], 500);
    }
}

// ================================================
// VERIFICAR SI ES FAVORITO
// ================================================
else if ($method === 'GET' && $action === 'check') {
    $verseId = $_GET['verse_id'] ?? null;
    
    if (!$verseId) {
        jsonResponse([
            'success' => false,
            'error' => 'Verse ID is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            SELECT id FROM favorites 
            WHERE user_id = ? AND verse_id = ?
        ");
        $stmt->execute([$userId, $verseId]);
        $isFavorite = $stmt->fetch() !== false;
        
        jsonResponse([
            'success' => true,
            'is_favorite' => $isFavorite
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to check favorite status'
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