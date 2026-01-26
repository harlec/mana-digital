<?php
/**
 * Prayer App - Authentication API
 * Archivo: api/auth.php
 * Maneja registro, login y logout de usuarios
 */

require_once '../config.php';

error_log("Action: " . ($_GET['action'] ?? 'none'));
error_log("Method: " . $_SERVER['REQUEST_METHOD']);
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    error_log("Authorization Header: " . $_SERVER['HTTP_AUTHORIZATION']);
}

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ================================================
// REGISTRO DE USUARIO
// ================================================
if ($method === 'POST' && $action === 'register') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos
    if (empty($data['email']) || empty($data['password']) || empty($data['name'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Missing required fields'
        ], 400);
    }
    
    // Validar email
    if (!isValidEmail($data['email'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Invalid email format'
        ], 400);
    }
    
    // Validar contraseña (mínimo 6 caracteres)
    if (strlen($data['password']) < 6) {
        jsonResponse([
            'success' => false,
            'error' => 'Password must be at least 6 characters'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        // Verificar si el email ya existe
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$data['email']]);
        
        if ($stmt->fetch()) {
            jsonResponse([
                'success' => false,
                'error' => 'Email already registered'
            ], 409);
        }
        
        // Crear usuario
        $passwordHash = hashPassword($data['password']);
        $stmt = $db->prepare("
            INSERT INTO users (email, password_hash, name, created_at)
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$data['email'], $passwordHash, $data['name']]);
        
        $userId = $db->lastInsertId();
        
        // Crear configuración por defecto
        $stmt = $db->prepare("
            INSERT INTO user_settings (user_id)
            VALUES (?)
        ");
        $stmt->execute([$userId]);
        
        // Crear horarios por defecto
        $defaultSchedules = ['09:00:00', '18:00:00'];
        $stmt = $db->prepare("
            INSERT INTO notification_schedules (user_id, time)
            VALUES (?, ?)
        ");
        foreach ($defaultSchedules as $time) {
            $stmt->execute([$userId, $time]);
        }
        
        // Generar token
        $token = createToken($userId);
        
        jsonResponse([
            'success' => true,
            'message' => 'User registered successfully',
            'token' => $token,
            'user' => [
                'id' => $userId,
                'email' => $data['email'],
                'name' => $data['name']
            ]
        ], 201);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Registration failed'
        ], 500);
    }
}

// ================================================
// LOGIN DE USUARIO
// ================================================
else if ($method === 'POST' && $action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos
    if (empty($data['email']) || empty($data['password'])) {
        jsonResponse([
            'success' => false,
            'error' => 'Email and password are required'
        ], 400);
    }
    
    try {
        $db = getDBConnection();
        
        // Buscar usuario
        $stmt = $db->prepare("
            SELECT id, email, password_hash, name, is_active
            FROM users
            WHERE email = ?
        ");
        $stmt->execute([$data['email']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            jsonResponse([
                'success' => false,
                'error' => 'Invalid credentials'
            ], 401);
        }
        
        // Verificar si está activo
        if (!$user['is_active']) {
            jsonResponse([
                'success' => false,
                'error' => 'Account is disabled'
            ], 403);
        }
        
        // Verificar contraseña
        if (!verifyPassword($data['password'], $user['password_hash'])) {
            jsonResponse([
                'success' => false,
                'error' => 'Invalid credentials'
            ], 401);
        }
        
        // Actualizar last_login
        $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        // Generar token
        $token = createToken($user['id']);
        
        jsonResponse([
            'success' => true,
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name']
            ]
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Login failed'
        ], 500);
    }
}

// ================================================
// VERIFICAR TOKEN
// ================================================
else if ($method === 'GET' && $action === 'verify') {
    $token = getBearerToken();
    $payload = verifyToken($token);
    
    if (!$payload) {
        jsonResponse([
            'success' => false,
            'error' => 'Invalid or expired token'
        ], 401);
    }
    
    try {
        $db = getDBConnection();
        
        // Obtener datos del usuario
        $stmt = $db->prepare("
            SELECT id, email, name, created_at
            FROM users
            WHERE id = ? AND is_active = 1
        ");
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            jsonResponse([
                'success' => false,
                'error' => 'User not found'
            ], 404);
        }
        
        jsonResponse([
            'success' => true,
            'user' => $user
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Verification failed'
        ], 500);
    }
}

// ================================================
// OBTENER PERFIL DE USUARIO
// ================================================
else if ($method === 'GET' && $action === 'profile') {
    $userId = getCurrentUser();
    
    try {
        $db = getDBConnection();
        
        $stmt = $db->prepare("
            SELECT u.id, u.email, u.name, u.created_at, u.last_login,
                   s.language, s.dark_mode, s.bible_version, s.default_theme,
                   s.notifications_enabled, s.notifications_paused,
                   s.interval_mode, s.interval_hours, s.checkin_time,
                   s.checkin_notification
            FROM users u
            LEFT JOIN user_settings s ON u.id = s.user_id
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user) {
            jsonResponse([
                'success' => false,
                'error' => 'User not found'
            ], 404);
        }
        
        jsonResponse([
            'success' => true,
            'user' => $user
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to fetch profile'
        ], 500);
    }
}

// ================================================
// ACTUALIZAR PERFIL
// ================================================
else if ($method === 'PUT' && $action === 'profile') {
    $userId = getCurrentUser();
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        $db = getDBConnection();
        
        // Actualizar nombre si se proporciona
        if (!empty($data['name'])) {
            $stmt = $db->prepare("UPDATE users SET name = ? WHERE id = ?");
            $stmt->execute([$data['name'], $userId]);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
        
    } catch (PDOException $e) {
        jsonResponse([
            'success' => false,
            'error' => 'Failed to update profile'
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