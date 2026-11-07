<?php
/**
 * Maná Digital - Grupos (Fase 2)
 * Archivo: api/groups.php
 */

require_once '../config.php';
require_once 'lib_groups.php';

setCORSHeaders();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

function groupCard(PDO $db, $g, $role, $today) {
    $day = groupDay($db, $g, $today);
    $stmt = $db->prepare('SELECT COUNT(*) FROM group_members WHERE group_id = ?');
    $stmt->execute([$g['id']]);
    $members = (int)$stmt->fetchColumn();
    $stmt = $db->prepare('SELECT COUNT(*) FROM contributions WHERE group_id = ? AND date = ?');
    $stmt->execute([$g['id'], $today]);
    return [
        'id' => (int)$g['id'], 'name' => $g['name'], 'type' => $g['type'], 'type_label' => GROUP_TYPES[$g['type']],
        'color' => $g['color'], 'initial' => initialOf($g['name']), 'role' => $role, 'members' => $members,
        'book' => $day['book'], 'pace' => (int)$g['pace'], 'total_days' => (int)$g['total_days'], 'start_date' => $g['start_date'],
        'status' => $day['status'], 'day' => $day['day'], 'reference' => $day['reference'],
        'contributions_today' => (int)$stmt->fetchColumn(),
    ];
}

try {
    $db = groupsDb();
    $today = todayDate();

    if ($method === 'GET' && $action === 'mine') {
        $stmt = $db->prepare('SELECT g.*, m.role FROM `groups` g INNER JOIN group_members m ON m.group_id = g.id
            WHERE m.user_id = ? ORDER BY m.joined_at DESC');
        $stmt->execute([$userId]);
        $out = [];
        foreach ($stmt->fetchAll() as $g) {
            $card = groupCard($db, $g, $g['role'], $today);
            $card['open_prayers'] = openPrayersCount($db, $g['id'], $userId, $g['role']);
            $out[] = $card;
        }
        jsonResponse(['success' => true, 'groups' => $out]);
    }

    else if ($method === 'POST' && $action === 'create') {
        $data = readJson();
        $name = trim($data['name'] ?? '');
        $type = $data['type'] ?? 'friends';
        $book = getBook($db, (int)($data['book_id'] ?? 0));
        $pace = max(1, min(3, (int)($data['pace'] ?? 1)));
        $period = $data['period'] ?? 'book';
        if ($name === '' || mb_strlen($name) > 80 || !isset(GROUP_TYPES[$type]) || !$book) {
            jsonResponse(['success' => false, 'error' => 'Invalid group'], 400);
        }
        $days = (int)ceil($book['chapters'] / $pace);
        if ($period === 'week') $days = min($days, 7);
        elseif ($period === 'month') $days = min($days, 30);
        $start = ($data['start'] ?? 'today') === 'monday' ? date('Y-m-d', strtotime('next monday')) : $today;
        $color = AVATAR_COLORS[random_int(0, count(AVATAR_COLORS) - 1)];

        $db->beginTransaction();
        $db->prepare('INSERT INTO `groups` (name, type, color, book_id, pace, start_date, total_days, invite_code, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
            ->execute([$name, $type, $color, $book['id'], $pace, $start, $days, generateInviteCode($db), $userId]);
        $groupId = (int)$db->lastInsertId();
        $db->prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)')->execute([$groupId, $userId, 'leader']);
        $db->commit();
        jsonResponse(['success' => true, 'group' => groupCard($db, getGroup($db, $groupId), 'leader', $today)], 201);
    }

    else if ($method === 'GET' && $action === 'preview') {
        $stmt = $db->prepare('SELECT * FROM `groups` WHERE invite_code = ?');
        $stmt->execute([strtoupper(trim($_GET['code'] ?? ''))]);
        $g = $stmt->fetch();
        if (!$g) jsonResponse(['success' => false, 'error' => 'Invalid code'], 404);
        $stmt = $db->prepare('SELECT u.name FROM group_members m INNER JOIN users u ON u.id = m.user_id
            WHERE m.group_id = ? AND m.role = ? ORDER BY m.joined_at LIMIT 1');
        $stmt->execute([$g['id'], 'leader']);
        $card = groupCard($db, $g, memberRole($db, $g['id'], $userId), $today);
        $card['leader_name'] = $stmt->fetchColumn();
        $card['joined'] = $card['role'] !== null;
        jsonResponse(['success' => true, 'group' => $card]);
    }

    else if ($method === 'POST' && $action === 'join') {
        $data = readJson();
        $stmt = $db->prepare('SELECT * FROM `groups` WHERE invite_code = ?');
        $stmt->execute([strtoupper(trim($data['code'] ?? ''))]);
        $g = $stmt->fetch();
        if (!$g) jsonResponse(['success' => false, 'error' => 'Invalid code'], 404);
        $db->prepare('INSERT IGNORE INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)')->execute([$g['id'], $userId, 'member']);
        jsonResponse(['success' => true, 'group' => groupCard($db, $g, memberRole($db, $g['id'], $userId), $today)]);
    }

    else if ($method === 'GET' && $action === 'get') {
        $groupId = (int)($_GET['id'] ?? 0);
        $role = requireMember($db, $groupId, $userId);
        $g = getGroup($db, $groupId);

        $stmt = $db->prepare('SELECT u.id, u.name, m.role,
                d.read_at, d.communion_check, d.examen_closed_at
            FROM group_members m
            INNER JOIN users u ON u.id = m.user_id
            LEFT JOIN daily_readings d ON d.user_id = u.id AND d.date = ?
            WHERE m.group_id = ? ORDER BY m.joined_at');
        $stmt->execute([$today, $groupId]);
        $sent = $db->prepare('SELECT to_user_id FROM nudges WHERE from_user_id = ? AND date = ? AND kind = ?');
        $sent->execute([$userId, $today, 'reminder']);
        $sent = array_flip($sent->fetchAll(PDO::FETCH_COLUMN));

        $members = [];
        foreach ($stmt->fetchAll() as $m) {
            $members[] = [
                'id' => (int)$m['id'], 'name' => $m['name'], 'initial' => initialOf($m['name']), 'color' => avatarColor($m['id']),
                'role' => $m['role'], 'me' => (int)$m['id'] === (int)$userId,
                'streak' => computeStreak($db, $m['id'], $today),
                'today' => ['read' => $m['read_at'] !== null, 'communion' => (bool)$m['communion_check'], 'examen' => $m['examen_closed_at'] !== null],
                'nudged' => isset($sent[$m['id']]),
            ];
        }

        $q = $db->prepare('SELECT text FROM group_questions WHERE group_id = ? AND date = ?');
        $q->execute([$groupId, $today]);
        $feed = $db->prepare('SELECT c.id, c.text, c.chapter, c.verse, c.created_at, u.id AS uid, u.name,
                (SELECT COUNT(*) FROM reactions r WHERE r.target_type = ? AND r.target_id = c.id AND r.kind = ?) AS amens
            FROM contributions c INNER JOIN users u ON u.id = c.user_id
            WHERE c.group_id = ? ORDER BY c.created_at DESC LIMIT 5');
        $feed->execute(['contribution', 'amen', $groupId]);
        $recent = [];
        foreach ($feed->fetchAll() as $c) {
            $recent[] = ['id' => (int)$c['id'], 'text' => $c['text'], 'author' => $c['name'], 'initial' => initialOf($c['name']),
                'color' => avatarColor($c['uid']), 'amens' => (int)$c['amens'], 'created_at' => $c['created_at']];
        }

        $card = groupCard($db, $g, $role, $today);
        $card['invite_code'] = $g['invite_code'];
        $card['open_prayers'] = openPrayersCount($db, $groupId, $userId, $role);
        jsonResponse(['success' => true, 'group' => $card, 'members' => $members, 'question' => $q->fetchColumn() ?: null, 'recent' => $recent]);
    }

    else if ($method === 'POST' && $action === 'question') {
        $data = readJson();
        $groupId = (int)($data['group_id'] ?? 0);
        $text = trim($data['text'] ?? '');
        if (requireMember($db, $groupId, $userId) !== 'leader') jsonResponse(['success' => false, 'error' => 'Leader only'], 403);
        if ($text === '' || mb_strlen($text) > 400) jsonResponse(['success' => false, 'error' => 'Invalid text'], 400);
        $db->prepare('INSERT INTO group_questions (group_id, date, text, author_id) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE text = VALUES(text), author_id = VALUES(author_id)')->execute([$groupId, $today, $text, $userId]);
        jsonResponse(['success' => true]);
    }

    else if ($method === 'POST' && $action === 'nudge') {
        $data = readJson();
        $groupId = (int)($data['group_id'] ?? 0);
        $to = (int)($data['to_user_id'] ?? 0);
        requireMember($db, $groupId, $userId);
        if ($to === (int)$userId || !memberRole($db, $groupId, $to)) jsonResponse(['success' => false, 'error' => 'Invalid member'], 400);
        $db->prepare('INSERT IGNORE INTO nudges (group_id, from_user_id, to_user_id, date, kind, message) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$groupId, $userId, $to, $today, 'reminder', NUDGE_TEXT]);
        jsonResponse(['success' => true]);
    }

    else if ($method === 'POST' && $action === 'adopt') {
        // Convierte el plan del grupo en el plan personal: mismos capítulos y mismo día para todos
        $data = readJson();
        $groupId = (int)($data['group_id'] ?? 0);
        requireMember($db, $groupId, $userId);
        $g = getGroup($db, $groupId);
        $db->beginTransaction();
        $db->prepare('UPDATE reading_plans SET is_active = 0 WHERE user_id = ?')->execute([$userId]);
        $db->prepare('INSERT INTO reading_plans (user_id, title, book_id, pace, start_date, total_days) VALUES (?, ?, ?, ?, ?, ?)')
            ->execute([$userId, $g['name'], $g['book_id'], $g['pace'], $g['start_date'], $g['total_days']]);
        $db->commit();
        ensureDay($db, $userId, $today, 'plan');
        jsonResponse(['success' => true]);
    }

    else if ($method === 'POST' && $action === 'leave') {
        $data = readJson();
        $groupId = (int)($data['group_id'] ?? 0);
        $role = requireMember($db, $groupId, $userId);
        $db->beginTransaction();
        $db->prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?')->execute([$groupId, $userId]);
        $stmt = $db->prepare('SELECT user_id, role FROM group_members WHERE group_id = ? ORDER BY joined_at');
        $stmt->execute([$groupId]);
        $left = $stmt->fetchAll();
        if (!$left) {
            $db->prepare('DELETE FROM `groups` WHERE id = ?')->execute([$groupId]);
        } elseif ($role === 'leader' && !in_array('leader', array_column($left, 'role'), true)) {
            $db->prepare('UPDATE group_members SET role = ? WHERE group_id = ? AND user_id = ?')->execute(['leader', $groupId, $left[0]['user_id']]);
        }
        $db->commit();
        jsonResponse(['success' => true]);
    }

    else {
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('groups.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Request failed'], 500);
}
