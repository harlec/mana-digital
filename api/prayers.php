<?php
/**
 * Maná Digital - Peticiones, ayuda y testimonios (Fase 3)
 * Archivo: api/prayers.php
 */

require_once '../config.php';
require_once 'lib_groups.php';

setCORSHeaders();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

function toggleReaction(PDO $db, $type, $id, $userId, $kind) {
    $del = $db->prepare('DELETE FROM reactions WHERE target_type = ? AND target_id = ? AND user_id = ? AND kind = ?');
    $del->execute([$type, $id, $userId, $kind]);
    $on = $del->rowCount() === 0;
    if ($on) {
        $db->prepare('INSERT IGNORE INTO reactions (target_type, target_id, user_id, kind) VALUES (?, ?, ?, ?)')->execute([$type, $id, $userId, $kind]);
    }
    $n = $db->prepare('SELECT COUNT(*) FROM reactions WHERE target_type = ? AND target_id = ? AND kind = ?');
    $n->execute([$type, $id, $kind]);
    return [$on, (int)$n->fetchColumn()];
}

function countReactions(PDO $db, $type, $id, $kind, $userId) {
    $stmt = $db->prepare('SELECT COUNT(*), SUM(user_id = ?) FROM reactions WHERE target_type = ? AND target_id = ? AND kind = ?');
    $stmt->execute([$userId, $type, $id, $kind]);
    $row = $stmt->fetch(PDO::FETCH_NUM);
    return [(int)$row[0], (int)$row[1] > 0];
}

try {
    $db = prayersDb();

    if ($method === 'GET' && $action === 'list') {
        $groupId = (int)($_GET['group_id'] ?? 0);
        $role = requireMember($db, $groupId, $userId);
        $kind = $_GET['kind'] ?? '';

        $sql = 'SELECT p.*, u.name FROM prayer_requests p INNER JOIN users u ON u.id = p.user_id
            WHERE p.group_id = ? AND p.status = ? AND (p.user_id = ? OR ? = 1 OR (p.hidden = 0 AND p.visibility <> ?))';
        $args = [$groupId, 'open', $userId, $role === 'leader' ? 1 : 0, 'leader'];
        if (in_array($kind, PRAYER_KINDS, true)) { $sql .= ' AND p.kind = ?'; $args[] = $kind; }
        $stmt = $db->prepare($sql . ' ORDER BY p.created_at DESC LIMIT 60');
        $stmt->execute($args);

        $cm = $db->prepare('SELECT m.id, m.text, m.created_at, u.name FROM comments m INNER JOIN users u ON u.id = m.user_id
            WHERE m.target_type = ? AND m.target_id = ? AND m.hidden = 0 ORDER BY m.created_at');
        $of = $db->prepare('SELECT o.id, o.type, o.detail, o.user_id, o.created_at, u.name FROM help_offers o INNER JOIN users u ON u.id = o.user_id
            WHERE o.prayer_id = ? ORDER BY o.created_at');
        $out = [];
        foreach ($stmt->fetchAll() as $p) {
            [$praying, $iPraying] = countReactions($db, 'prayer', $p['id'], 'praying', $userId);
            $cm->execute(['prayer', $p['id']]);
            $comments = array_map(fn($x) => ['id' => (int)$x['id'], 'text' => $x['text'], 'author' => $x['name'], 'created_at' => $x['created_at']], $cm->fetchAll());

            // Los ofrecimientos solo los ve el autor y los líderes; cada quien ve además el suyo
            $of->execute([$p['id']]);
            $isAuthor = (int)$p['user_id'] === (int)$userId;
            $offers = []; $mine = null;
            foreach ($of->fetchAll() as $o) {
                $row = ['id' => (int)$o['id'], 'type' => $o['type'], 'detail' => $o['detail'], 'author' => $o['name'], 'mine' => (int)$o['user_id'] === (int)$userId];
                if ($row['mine']) $mine = $row;
                if ($isAuthor || $role === 'leader') $offers[] = $row;
            }

            $needs = $p['needs'] === '' ? [] : explode(',', $p['needs']);
            $out[] = array_merge([
                'id' => (int)$p['id'], 'kind' => $p['kind'], 'text' => $p['text'], 'needs' => $needs, 'visibility' => $p['visibility'],
                'created_at' => $p['created_at'], 'is_me' => $isAuthor, 'under_review' => (bool)$p['hidden'],
                'stale' => (time() - strtotime($p['created_at'])) > STALE_DAYS * 86400,
                'praying' => $praying, 'i_praying' => $iPraying, 'comments' => $comments, 'offers' => $offers, 'my_offer' => $mine,
            ], authorCard($p, $userId, $p['name']));
        }
        jsonResponse(['success' => true, 'prayers' => $out, 'role' => $role]);
    }

    else if ($method === 'POST' && $action === 'create') {
        $data = readJson();
        $groupId = (int)($data['group_id'] ?? 0);
        requireMember($db, $groupId, $userId);
        $kind = $data['kind'] ?? '';
        $text = trim($data['text'] ?? '');
        $visibility = $data['visibility'] ?? 'group';
        $needs = array_values(array_intersect(PRAYER_NEEDS, (array)($data['needs'] ?? ['prayer'])));
        if (!in_array($kind, PRAYER_KINDS, true) || !in_array($visibility, PRAYER_VISIBILITY, true) || $text === '' || mb_strlen($text) > 2000) {
            jsonResponse(['success' => false, 'error' => 'Invalid request'], 400);
        }
        if (!$needs) $needs = ['prayer'];
        $risky = looksRisky($text);
        $db->prepare('INSERT INTO prayer_requests (group_id, user_id, kind, text, needs, visibility, hidden) VALUES (?, ?, ?, ?, ?, ?, ?)')
            ->execute([$groupId, $userId, $kind, $text, implode(',', $needs), $visibility, $risky ? 1 : 0]);
        jsonResponse(['success' => true, 'under_review' => $risky], 201);
    }

    else if ($method === 'POST' && $action === 'pray') {
        $data = readJson();
        [$p] = loadPrayer($db, (int)($data['id'] ?? 0), $userId);
        [$on, $n] = toggleReaction($db, 'prayer', $p['id'], $userId, 'praying');
        jsonResponse(['success' => true, 'i_praying' => $on, 'praying' => $n]);
    }

    else if ($method === 'POST' && $action === 'encourage') {
        $data = readJson();
        [$p] = loadPrayer($db, (int)($data['id'] ?? 0), $userId);
        $text = trim($data['text'] ?? '');
        if ($text === '' || mb_strlen($text) > 1000) jsonResponse(['success' => false, 'error' => 'Invalid text'], 400);
        $db->prepare('INSERT INTO comments (target_type, target_id, user_id, text, hidden) VALUES (?, ?, ?, ?, ?)')
            ->execute(['prayer', $p['id'], $userId, $text, looksRisky($text) ? 1 : 0]);
        jsonResponse(['success' => true], 201);
    }

    else if ($method === 'POST' && $action === 'offer') {
        $data = readJson();
        [$p] = loadPrayer($db, (int)($data['id'] ?? 0), $userId);
        $type = $data['type'] ?? '';
        $detail = trim($data['detail'] ?? '');
        if ((int)$p['user_id'] === (int)$userId) jsonResponse(['success' => false, 'error' => 'Own request'], 400);
        if (!in_array($type, OFFER_TYPES, true) || mb_strlen($detail) > 300) jsonResponse(['success' => false, 'error' => 'Invalid offer'], 400);
        $db->prepare('INSERT INTO help_offers (prayer_id, user_id, type, detail) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE detail = VALUES(detail)')->execute([$p['id'], $userId, $type, $detail ?: null]);
        jsonResponse(['success' => true], 201);
    }

    else if ($method === 'POST' && $action === 'answered') {
        $data = readJson();
        [$p] = loadPrayer($db, (int)($data['id'] ?? 0), $userId);
        $testimony = trim($data['testimony'] ?? '');
        if ((int)$p['user_id'] !== (int)$userId) jsonResponse(['success' => false, 'error' => 'Author only'], 403);
        if ($testimony === '' || mb_strlen($testimony) > 2000) jsonResponse(['success' => false, 'error' => 'Invalid text'], 400);
        $db->prepare('UPDATE prayer_requests SET status = ?, testimony = ?, answered_at = NOW(), hidden = ? WHERE id = ?')
            ->execute(['answered', $testimony, ($p['hidden'] || looksRisky($testimony)) ? 1 : 0, $p['id']]);
        jsonResponse(['success' => true]);
    }

    else if ($method === 'POST' && $action === 'close') {
        // El autor la cierra sin testimonio, o un líder la retira
        $data = readJson();
        [$p, $role] = loadPrayer($db, (int)($data['id'] ?? 0), $userId);
        if ((int)$p['user_id'] !== (int)$userId && $role !== 'leader') jsonResponse(['success' => false, 'error' => 'Not allowed'], 403);
        $db->prepare('UPDATE prayer_requests SET status = ? WHERE id = ?')->execute(['closed', $p['id']]);
        jsonResponse(['success' => true]);
    }

    else if ($method === 'GET' && $action === 'testimonies') {
        $groupId = (int)($_GET['group_id'] ?? 0);
        $role = requireMember($db, $groupId, $userId);
        // Los pedidos reservados al líder no se comparten como testimonio con el resto
        $stmt = $db->prepare('SELECT p.*, u.name FROM prayer_requests p INNER JOIN users u ON u.id = p.user_id
            WHERE p.group_id = ? AND p.status = ? AND (p.user_id = ? OR (p.hidden = 0 AND p.visibility <> ?))
            ORDER BY p.answered_at DESC LIMIT 60');
        $stmt->execute([$groupId, 'answered', $userId, 'leader']);
        $out = [];
        foreach ($stmt->fetchAll() as $p) {
            [$praying] = countReactions($db, 'prayer', $p['id'], 'praying', $userId);
            [$glory, $iGlory] = countReactions($db, 'testimony', $p['id'], 'glory', $userId);
            $out[] = array_merge([
                'id' => (int)$p['id'], 'kind' => $p['kind'], 'asked' => $p['text'], 'testimony' => $p['testimony'], 'answered_at' => $p['answered_at'],
                'is_me' => (int)$p['user_id'] === (int)$userId, 'praying' => $praying, 'glory' => $glory, 'i_glory' => $iGlory,
            ], authorCard($p, $userId, $p['name']));
        }
        jsonResponse(['success' => true, 'testimonies' => $out, 'role' => $role]);
    }

    else if ($method === 'POST' && $action === 'glory') {
        $data = readJson();
        $stmt = $db->prepare('SELECT * FROM prayer_requests WHERE id = ? AND status = ?');
        $stmt->execute([(int)($data['id'] ?? 0), 'answered']);
        $p = $stmt->fetch();
        $role = $p ? memberRole($db, $p['group_id'], $userId) : null;
        if (!$p || !$role || ($p['visibility'] === 'leader' && (int)$p['user_id'] !== (int)$userId) || ($p['hidden'] && (int)$p['user_id'] !== (int)$userId)) {
            jsonResponse(['success' => false, 'error' => 'Not found'], 404);
        }
        [$on, $n] = toggleReaction($db, 'testimony', $p['id'], $userId, 'glory');
        jsonResponse(['success' => true, 'i_glory' => $on, 'glory' => $n]);
    }

    else {
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    error_log('prayers.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Request failed'], 500);
}
