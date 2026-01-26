<?php
/**
 * Prayer App - Database Configuration
 * Archivo: config.php
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'admin_mana');
define('DB_USER', 'admin_mana');  // Cambiar por tu usuario de MySQL
define('DB_PASS', 'Pasco.2025');     // Cambiar por tu contraseña
// Configuración de seguridad
define('JWT_SECRET', 'Pasco2025'); // ⚠️ CAMBIAR
define('SESSION_LIFETIME', 86400 * 30); // 30 días

// Configuración de CORS
define('ALLOWED_ORIGIN', 'https://manadigital.harlec.com.pe');

// Configuración de zona horaria
date_default_timezone_set('America/Lima');

// Habilitar logs de errores
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Función para conectar a la base de datos
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed'
        ]);
        exit;
    }
}

// Configurar headers CORS
function setCORSHeaders() {
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    header('Content-Type: application/json; charset=utf-8');
    
    // Manejar preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Función para obtener el token del header
function getBearerToken() {
    // Intentar todos los métodos posibles
    $authHeader = null;
    
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        }
    }
    
    if ($authHeader && preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
        return $matches[1];
    }
    
    return null;
}
// Función para crear un JWT simple
function createToken($userId) {
    $payload = [
        'user_id' => $userId,
        'exp' => time() + SESSION_LIFETIME,
        'iat' => time()
    ];
    $encoded = base64_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $encoded, JWT_SECRET);
    return $encoded . '.' . $signature;
}

// Función para verificar y decodificar token
// Función para verificar y decodificar token
function verifyToken($token) {
    if (!$token) {
        error_log("verifyToken: No token provided");
        return null;
    }
    
    // Limpiar el token de espacios
    $token = trim($token);
    
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        error_log("verifyToken: Invalid token format - expected 2 parts, got " . count($parts));
        error_log("verifyToken: Token = " . $token);
        return null;
    }
    
    list($encoded, $signature) = $parts;
    
    // Verificar firma
    $validSignature = hash_hmac('sha256', $encoded, JWT_SECRET);
    
    // Debug temporal
    error_log("verifyToken: Expected signature = " . $validSignature);
    error_log("verifyToken: Received signature = " . $signature);
    error_log("verifyToken: Match = " . ($signature === $validSignature ? 'YES' : 'NO'));
    
    if ($signature !== $validSignature) {
        error_log("verifyToken: Signature mismatch");
        return null;
    }
    
    // Decodificar payload
    $payload = json_decode(base64_decode($encoded), true);
    
    if (!$payload) {
        error_log("verifyToken: Failed to decode payload");
        return null;
    }
    
    // Verificar expiración
    if (!isset($payload['exp'])) {
        error_log("verifyToken: No expiration in token");
        return null;
    }
    
    if ($payload['exp'] < time()) {
        error_log("verifyToken: Token expired. Exp: " . $payload['exp'] . ", Now: " . time());
        return null;
    }
    
    error_log("verifyToken: Token valid for user " . $payload['user_id']);
    return $payload;
}

// Función para obtener el usuario actual del token
function getCurrentUser() {
    $token = getBearerToken();
    
    if (!$token) {
        error_log("getCurrentUser: No token found in request");
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'No authentication token provided'
        ]);
        exit;
    }
    
    $payload = verifyToken($token);
    
    if (!$payload) {
        error_log("getCurrentUser: Token verification failed");
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid or expired token'
        ]);
        exit;
    }
    
    return $payload['user_id'];
}

// Función para responder con JSON
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Función para validar email
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Función para hashear contraseña
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

// Función para verificar contraseña
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}
?>