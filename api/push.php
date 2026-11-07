<?php
/**
 * Maná Digital - Suscripciones push
 * Archivo: api/push.php
 */

require_once '../config.php';
require_once 'lib_push.php';

setCORSHeaders();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

try {
    $db = getDBConnection();
    if (!pushReady($db)) jsonResponse(['success' => false, 'error' => 'push_migration_pending'], 503);

    if ($method === 'GET' && $action === 'vapid-key') {
        jsonResponse(['success' => true, 'key' => vapidKeys($db)['public']]);
    }

    else if ($method === 'POST' && $action === 'subscribe') {
        $data = readJsonBody();
        $endpoint = $data['endpoint'] ?? '';
        $p256dh = $data['keys']['p256dh'] ?? '';
        $auth = $data['keys']['auth'] ?? '';
        if (!allowedEndpoint($endpoint) || strlen($endpoint) > 1000 || strlen(b64uDecode($p256dh)) !== 65 || strlen(b64uDecode($auth)) < 16) {
            jsonResponse(['success' => false, 'error' => 'Invalid subscription'], 400);
        }
        // Un dispositivo pertenece a una sola cuenta: si cambia de usuario, se reasigna
        $db->prepare('INSERT INTO push_subscriptions (user_id, endpoint, endpoint_hash, p256dh, auth) VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth)')
            ->execute([$userId, $endpoint, hash('sha256', $endpoint), $p256dh, $auth]);
        jsonResponse(['success' => true], 201);
    }

    else if ($method === 'POST' && $action === 'unsubscribe') {
        $data = readJsonBody();
        $db->prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint_hash = ?')->execute([$userId, hash('sha256', $data['endpoint'] ?? '')]);
        jsonResponse(['success' => true]);
    }

    else if ($method === 'POST' && $action === 'test') {
        $sent = pushToUser($db, $userId, 'Maná Digital', 'Las notificaciones funcionan en este dispositivo.', '/');
        jsonResponse(['success' => true, 'sent' => $sent]);
    }

    else {
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    error_log('push.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Request failed'], 500);
}

function readJsonBody() { return json_decode(file_get_contents('php://input'), true) ?: []; }
