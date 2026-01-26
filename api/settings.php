<?php
/**
 * Prayer App - Settings API
 * Archivo: api/settings.php
 * Maneja la configuración del usuario
 */

require_once '../config.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

// ================================================
// OBTENER CONFIGURACIÓN
// ================================================
if ($method === 'GET' && $action === 'get') {
    try {
        $db = getDBConnection();
        
        // Obtener configuración general
        $stmt = $db->prepare("
            SELECT language, dark_mode, bible_version, default_theme,
                   notifications_enabled, notifications_paused,
                   interval_mode, interval_hours, checkin_time,
                   checkin_notification, updated_at
            FROM user_settings
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        $settings = $stmt->fetch();
        
        if (!$settings) {
            // Crear configuración por defecto si no existe
            $stmt = $db->prepare("
                INSERT INTO user_settings (user_id) VALUES (?)
            ");
            $stmt->execute([$userId]);
            
            // Obtener configuración recién creada
            $stmt = $db->prepare("
                SELECT language, dark_mode, bible_version, default_theme,
                       notifications_enabled, notifications_paused,
                       interval_mode, interval_hours, checkin_time,
                       checkin_notification, updated_at
                FROM user_settings
                WHERE user_id = ?
            ");
            $stmt->execute([$userId]);
            $settings = $stmt->fetch();
        }
        
        // Convertir booleanos
        $settings['dark_mode'] = (bool)$settings['dark_mode'];
        $settings['notifications_enabled'] = (bool)$settings['notifications_enabled'];
        $settings['notifications_paused'] = (bool)$settings['notifications_paused'];
        $settings['interval_mode'] = (bool)$settings['interval_mode'];
        $settings['checkin_notification'] = (bool)$settings['checkin_notification'];
        
        // Obtener horarios de notificación
        $stmt = $db->prepare("
            SELECT id, time, is_active
            FROM notification_schedules
            WHERE user_id = ?
            ORDER BY time
        ");
        $stmt->execute([$userId]);
        $schedules = $stmt->fetchAll();
        
        // Convertir booleanos en schedules
        foreach ($schedules as &$schedule) {
            $schedule['is_active'] = (bool)$schedule['is_active'];
        }
        
        $settings['schedules'] = $schedules;
        
        jsonResponse([
            'success' => true,
            'settings' => $settings
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch settings'
        ], 500);
    }
}

// ================================================
// ACTUALIZAR CONFIGURACIÓN
// ================================================
else if ($method === 'PUT' && $action === 'update') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $db = getDBConnection();
        
        $updates = [];
        $params = [];
        
        // Campos permitidos para actualizar
        $allowedFields = [
            'language', 'dark_mode', 'bible_version', 'default_theme',
            'notifications_enabled', 'notifications_paused',
            'interval_mode', 'interval_hours', 'checkin_time',
            'checkin_notification'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "{$field} = ?";
                
                // Convertir booleanos a int para MySQL
                if (is_bool($data[$field])) {
                    $params[] = $data[$field] ? 1 : 0;
                } else {
                    $params[] = $data[$field];
                }
            }
        }
        
        if (empty($updates)) {
            jsonResponse([
                'success' => false,
                'error' => 'No fields to update'
            ], 400);
        }
        
        $params[] = $userId;
        
        $sql = "UPDATE user_settings SET " . implode(', ', $updates) . 
               ", updated_at = NOW() WHERE user_id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        jsonResponse([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to update settings'
        ], 500);
    }
}

// ================================================
// AGREGAR HORARIO DE NOTIFICACIÓN
// ================================================
else if ($method === 'POST' && $action === 'add-schedule') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['time'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Time is required'
        ], 400);
    }
    
    // Validar formato de tiempo (HH:MM o HH:MM:SS)
    if (!preg_match('/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/', $data['time'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Invalid time format. Use HH:MM'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        // Asegurar formato HH:MM:SS
        $time = strlen($data['time']) === 5 ? $data['time'] . ':00' : $data['time'];
        
        // Verificar si ya existe
        $stmt = $db->prepare("
            SELECT id FROM notification_schedules
            WHERE user_id = ? AND time = ?
        ");
        $stmt->execute([$userId, $time]);
        
        if ($stmt->fetch()) {
            jsonResponse([
                'success' => false,
                'error' => 'Schedule already exists'
            ], 409);
        }
        
        // Agregar horario
        $stmt = $db->prepare("
            INSERT INTO notification_schedules (user_id, time, is_active, created_at)
            VALUES (?, ?, 1, NOW())
        ");
        $stmt->execute([$userId, $time]);
        
        jsonResponse([
            'success' => true,
            'message' => 'Schedule added successfully',
            'schedule_id' => $db->lastInsertId()
        ], 201);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to add schedule'
        ], 500);
    }
}

// ================================================
// ELIMINAR HORARIO DE NOTIFICACIÓN
// ================================================
else if ($method === 'DELETE' && $action === 'remove-schedule') {
    $scheduleId = $_GET['id'] ?? null;
    
    if (!$scheduleId) {
        jsonResponse([
            'success' => false,
            'error' => 'Schedule ID is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            DELETE FROM notification_schedules
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$scheduleId, $userId]);
        
        if ($stmt->rowCount() === 0) {
            jsonResponse([
                'success' => false,
                'error' => 'Schedule not found'
            ], 404);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Schedule removed successfully'
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to remove schedule'
        ], 500);
    }
}

// ================================================
// ACTIVAR/DESACTIVAR HORARIO
// ================================================
else if ($method === 'PUT' && $action === 'toggle-schedule') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Schedule ID is required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        $isActive = isset($data['is_active']) ? ($data['is_active'] ? 1 : 0) : null;
        
        if ($isActive === null) {
            jsonResponse([
                'success' => false,
                'error' => 'is_active field is required'
            ], 400);
        }
        
        $stmt = $db->prepare("
            UPDATE notification_schedules
            SET is_active = ?
            WHERE id = ? AND user_id = ?
        ");
        $stmt->execute([$isActive, $data['id'], $userId]);
        
        if ($stmt->rowCount() === 0) {
            jsonResponse([
                'success' => false,
                'error' => 'Schedule not found'
            ], 404);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Schedule updated successfully'
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to update schedule'
        ], 500);
    }
}

// ================================================
// RESTABLECER CONFIGURACIÓN A VALORES POR DEFECTO
// ================================================
else if ($method === 'POST' && $action === 'reset') {
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            UPDATE user_settings
            SET language = 'es',
                dark_mode = 0,
                bible_version = 'RVR1960',
                default_theme = 'faith',
                notifications_enabled = 1,
                notifications_paused = 0,
                interval_mode = 1,
                interval_hours = 2,
                checkin_time = '09:00:00',
                checkin_notification = 1,
                updated_at = NOW()
            WHERE user_id = ?
        ");
        $stmt->execute([$userId]);
        
        // Eliminar horarios existentes
        $stmt = $db->prepare("DELETE FROM notification_schedules WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        // Crear horarios por defecto
        $defaultSchedules = ['09:00:00', '18:00:00'];
        $stmt = $db->prepare("
            INSERT INTO notification_schedules (user_id, time, is_active)
            VALUES (?, ?, 1)
        ");
        foreach ($defaultSchedules as $time) {
            $stmt->execute([$userId, $time]);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Settings reset to default values'
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to reset settings'
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