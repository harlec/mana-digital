<?php
/**
 * Maná Digital - Web Push (RFC 8030 / 8291 aes128gcm / 8292 VAPID) en PHP puro
 * Archivo: api/lib_push.php
 * Sin Composer: solo openssl y curl.
 */

const PUSH_SUBJECT = 'mailto:hugoalonsoromerosantos@gmail.com';
const PUSH_HOSTS = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'notify.windows.com', 'push.apple.com'];

function b64u($bin) { return rtrim(strtr(base64_encode($bin), '+/', '-_'), '='); }
function b64uDecode($s) { return base64_decode(strtr($s, '-_', '+/') . str_repeat('=', (4 - strlen($s) % 4) % 4)); }

// ¿Existen las tablas de push? (la migración puede no haberse ejecutado todavía)
function pushReady(PDO $db) {
    try { $db->query('SELECT 1 FROM push_subscriptions LIMIT 1'); return true; } catch (PDOException $e) { return false; }
}

// Solo servicios de push conocidos (evita que una suscripción apunte a servidores internos)
function allowedEndpoint($endpoint) {
    $p = parse_url($endpoint);
    if (!$p || empty($p['host'])) return false;
    if (getenv('MANA_PUSH_ALLOW_LOCAL') && in_array($p['host'], ['127.0.0.1', 'localhost'], true)) return true;
    if (($p['scheme'] ?? '') !== 'https') return false;
    foreach (PUSH_HOSTS as $h) {
        if ($p['host'] === $h || substr($p['host'], -strlen('.' . $h)) === '.' . $h) return true;
    }
    return false;
}

// Claves VAPID: se crean solas la primera vez y viven en la base de datos
function vapidKeys(PDO $db) {
    $row = $db->query("SELECT v FROM push_config WHERE k = 'vapid'")->fetchColumn();
    if ($row) return json_decode($row, true);
    $key = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    if (!$key) throw new RuntimeException('No se pudo generar la clave VAPID');
    openssl_pkey_export($key, $pem);
    $ec = openssl_pkey_get_details($key)['ec'];
    $keys = ['private' => $pem, 'public' => b64u("\x04" . str_pad($ec['x'], 32, "\0", STR_PAD_LEFT) . str_pad($ec['y'], 32, "\0", STR_PAD_LEFT))];
    $db->prepare("INSERT IGNORE INTO push_config (k, v) VALUES ('vapid', ?)")->execute([json_encode($keys)]);
    $row = $db->query("SELECT v FROM push_config WHERE k = 'vapid'")->fetchColumn();
    return json_decode($row, true);
}

// ECDSA DER -> r||s de 64 bytes (formato JWS)
function derToJose($der) {
    $off = 3;
    $rLen = ord($der[$off]); $r = substr($der, $off + 1, $rLen);
    $off += 1 + $rLen + 1;
    $sLen = ord($der[$off]); $s = substr($der, $off + 1, $sLen);
    return str_pad(ltrim($r, "\0"), 32, "\0", STR_PAD_LEFT) . str_pad(ltrim($s, "\0"), 32, "\0", STR_PAD_LEFT);
}

function vapidHeader($endpoint, $keys) {
    $p = parse_url($endpoint);
    $aud = $p['scheme'] . '://' . $p['host'] . (isset($p['port']) ? ':' . $p['port'] : '');
    $jwt = b64u(json_encode(['typ' => 'JWT', 'alg' => 'ES256'])) . '.' . b64u(json_encode(['aud' => $aud, 'exp' => time() + 12 * 3600, 'sub' => PUSH_SUBJECT]));
    openssl_sign($jwt, $der, openssl_pkey_get_private($keys['private']), OPENSSL_ALGO_SHA256);
    return 'vapid t=' . $jwt . '.' . b64u(derToJose($der)) . ', k=' . $keys['public'];
}

// Cifrado de contenido aes128gcm (RFC 8291)
function encryptPayload($payload, $uaPublicB64, $authB64) {
    $uaPublic = b64uDecode($uaPublicB64);
    $authSecret = b64uDecode($authB64);
    if (strlen($uaPublic) !== 65 || strlen($authSecret) < 16) throw new InvalidArgumentException('Suscripción inválida');

    $local = openssl_pkey_new(['curve_name' => 'prime256v1', 'private_key_type' => OPENSSL_KEYTYPE_EC]);
    $ec = openssl_pkey_get_details($local)['ec'];
    $localPublic = "\x04" . str_pad($ec['x'], 32, "\0", STR_PAD_LEFT) . str_pad($ec['y'], 32, "\0", STR_PAD_LEFT);

    // Clave pública del navegador como PEM (SPKI de P-256)
    $spki = hex2bin('3059301306072a8648ce3d020106082a8648ce3d030107034200') . $uaPublic;
    $uaKey = openssl_pkey_get_public("-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($spki), 64, "\n") . "-----END PUBLIC KEY-----\n");
    $secret = openssl_pkey_derive($uaKey, $local);
    if ($secret === false) throw new RuntimeException('ECDH falló');

    $ikm = hash_hkdf('sha256', $secret, 32, "WebPush: info\0" . $uaPublic . $localPublic, $authSecret);
    $salt = random_bytes(16);
    $cek = hash_hkdf('sha256', $ikm, 16, "Content-Encoding: aes128gcm\0", $salt);
    $nonce = hash_hkdf('sha256', $ikm, 12, "Content-Encoding: nonce\0", $salt);
    $cipher = openssl_encrypt($payload . "\x02", 'aes-128-gcm', $cek, OPENSSL_RAW_DATA, $nonce, $tag);
    return $salt . pack('N', 4096) . chr(65) . $localPublic . $cipher . $tag;
}

// Envía a una suscripción. Devuelve el código HTTP (0 si no hubo respuesta).
function webPushSend(array $sub, $payload, array $keys) {
    $body = encryptPayload($payload, $sub['p256dh'], $sub['auth']);
    $ch = curl_init($sub['endpoint']);
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 6, CURLOPT_CONNECTTIMEOUT => 3,
        CURLOPT_HTTPHEADER => ['Content-Type: application/octet-stream', 'Content-Encoding: aes128gcm', 'TTL: 43200', 'Urgency: normal',
            'Authorization: ' . vapidHeader($sub['endpoint'], $keys)],
    ]);
    curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    return $code;
}

// Aviso a una persona (todos sus dispositivos). $logKey evita repetirlo. Nunca lanza excepciones.
function pushToUser(PDO $db, $userId, $title, $body, $url = '/', $logKey = null) {
    try {
        if (!pushReady($db)) return 0;
        if ($logKey) {
            $seen = $db->prepare('SELECT 1 FROM push_log WHERE user_id = ? AND log_key = ?');
            $seen->execute([$userId, $logKey]);
            if ($seen->fetchColumn()) return 0;
        }
        $stmt = $db->prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?');
        $stmt->execute([$userId]);
        $subs = $stmt->fetchAll();
        if (!$subs) return 0;
        $keys = vapidKeys($db);
        $payload = json_encode(['title' => $title, 'body' => $body, 'url' => $url, 'tag' => $logKey ? explode(':', $logKey)[0] : 'mana'], JSON_UNESCAPED_UNICODE);
        $sent = 0;
        foreach ($subs as $s) {
            $code = webPushSend($s, $payload, $keys);
            if ($code >= 200 && $code < 300) $sent++;
            elseif ($code === 404 || $code === 410) $db->prepare('DELETE FROM push_subscriptions WHERE id = ?')->execute([$s['id']]);
        }
        // Se registra solo si llegó a algún dispositivo, para reintentar si el envío falló
        if ($logKey && $sent > 0) $db->prepare('INSERT IGNORE INTO push_log (user_id, log_key) VALUES (?, ?)')->execute([$userId, $logKey]);
        return $sent;
    } catch (Throwable $e) {
        error_log('pushToUser: ' . $e->getMessage());
        return 0;
    }
}

// Programa el aviso para después de responder al navegador (no retrasa la acción del usuario)
function pushLater(PDO $db, $userId, $title, $body, $url = '/', $logKey = null) {
    static $queue = [], $registered = false;
    $queue[] = [$userId, $title, $body, $url, $logKey];
    if ($registered) return;
    $registered = true;
    register_shutdown_function(function () use (&$queue, $db) {
        if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
        foreach ($queue as $q) pushToUser($db, ...$q);
    });
}

function nameOf(PDO $db, $userId) {
    $stmt = $db->prepare('SELECT name FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetchColumn() ?: 'Alguien';
}
