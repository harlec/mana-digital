<?php
/**
 * Maná Digital - Capítulo del día y aportes del grupo (Fase 2)
 * Archivo: api/contributions.php
 */

require_once '../config.php';
require_once 'lib_groups.php';

setCORSHeaders();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

// El aporte debe pertenecer a un grupo del que soy miembro
function requireContribution(PDO $db, $id, $userId) {
    $stmt = $db->prepare('SELECT * FROM contributions WHERE id = ?');
    $stmt->execute([$id]);
    $c = $stmt->fetch();
    if (!$c || !memberRole($db, $c['group_id'], $userId)) jsonResponse(['success' => false, 'error' => 'Not found'], 404);
    return $c;
}

try {
    $db = groupsDb();
    $today = todayDate();

    if ($method === 'GET' && $action === 'day') {
        $groupId = (int)($_GET['group_id'] ?? 0);
        requireMember($db, $groupId, $userId);
        $g = getGroup($db, $groupId);
        $day = groupDay($db, $g, $today);

        $verses = [];
        if ($day['status'] === 'active') {
            $verses = chapterVerses($db, $g['book_id'], $day['chapter'], $day['chapter_end']);
        }

        $q = $db->prepare('SELECT text FROM group_questions WHERE group_id = ? AND date = ?');
        $q->execute([$groupId, $today]);

        $stmt = $db->prepare('SELECT c.id, c.text, c.chapter, c.verse, c.created_at, u.id AS uid, u.name,
                (SELECT COUNT(*) FROM reactions r WHERE r.target_type = ? AND r.target_id = c.id AND r.kind = ?) AS amens,
                (SELECT COUNT(*) FROM reactions r WHERE r.target_type = ? AND r.target_id = c.id AND r.kind = ? AND r.user_id = ?) AS mine
            FROM contributions c INNER JOIN users u ON u.id = c.user_id
            WHERE c.group_id = ? AND c.date = ? ORDER BY c.created_at');
        $stmt->execute(['contribution', 'amen', 'contribution', 'amen', $userId, $groupId, $today]);
        $rows = $stmt->fetchAll();

        $byVerse = [];
        foreach ($verses as $v) $byVerse[$v['chapter'] . ':' . $v['n']] = $v['text'];

        $cm = $db->prepare('SELECT m.id, m.text, m.created_at, u.id AS uid, u.name FROM comments m
            INNER JOIN users u ON u.id = m.user_id WHERE m.target_type = ? AND m.target_id = ? AND m.hidden = 0 ORDER BY m.created_at');
        $out = []; $mine = false;
        foreach ($rows as $c) {
            $cm->execute(['contribution', $c['id']]);
            $comments = [];
            foreach ($cm->fetchAll() as $x) {
                $comments[] = ['id' => (int)$x['id'], 'text' => $x['text'], 'author' => $x['name'], 'created_at' => $x['created_at']];
            }
            if ((int)$c['uid'] === (int)$userId) $mine = true;
            $out[] = [
                'id' => (int)$c['id'], 'text' => $c['text'], 'created_at' => $c['created_at'],
                'author' => $c['name'], 'initial' => initialOf($c['name']), 'color' => avatarColor($c['uid']), 'is_me' => (int)$c['uid'] === (int)$userId,
                'verse_ref' => $c['verse'] ? $day['book'] . ' ' . $c['chapter'] . ':' . $c['verse'] : null,
                'verse_text' => $c['verse'] ? ($byVerse[$c['chapter'] . ':' . $c['verse']] ?? null) : null,
                'amens' => (int)$c['amens'], 'i_amened' => (int)$c['mine'] > 0, 'comments' => $comments,
            ];
        }

        jsonResponse(['success' => true, 'group' => ['id' => (int)$g['id'], 'name' => $g['name'], 'total_days' => (int)$g['total_days']],
            'day' => $day, 'question' => $q->fetchColumn() ?: null, 'verses' => $verses, 'contributions' => $out, 'i_contributed' => $mine]);
    }

    else if ($method === 'POST' && $action === 'create') {
        $data = readJson();
        $groupId = (int)($data['group_id'] ?? 0);
        $text = trim($data['text'] ?? '');
        requireMember($db, $groupId, $userId);
        $g = getGroup($db, $groupId);
        $day = groupDay($db, $g, $today);
        if ($day['status'] !== 'active') jsonResponse(['success' => false, 'error' => 'No reading today'], 400);
        if ($text === '' || mb_strlen($text) > 2000) jsonResponse(['success' => false, 'error' => 'Invalid text'], 400);

        $chapter = (int)($data['chapter'] ?? $day['chapter']);
        $verse = isset($data['verse']) ? (int)$data['verse'] : null;
        if ($chapter < $day['chapter'] || $chapter > $day['chapter_end']) $chapter = $day['chapter'];

        $ins = $db->prepare('INSERT INTO contributions (group_id, user_id, date, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE chapter = VALUES(chapter), verse = VALUES(verse), text = VALUES(text)');
        $ins->execute([$groupId, $userId, $today, $g['book_id'], $chapter, $verse ?: null, $text]);
        if ($ins->rowCount() === 1) {
            // Un solo aviso por grupo y día a cada miembro, para no saturar
            $others = $db->prepare('SELECT user_id FROM group_members WHERE group_id = ? AND user_id <> ?');
            $others->execute([$groupId, $userId]);
            $who = nameOf($db, $userId);
            foreach ($others->fetchAll(PDO::FETCH_COLUMN) as $uid) {
                pushLater($db, $uid, $g['name'], $who . ' compartió lo que Dios le habló en ' . $day['reference'] . '.', '/?go=groups', 'contrib:' . $groupId . ':' . $today);
            }
        }
        jsonResponse(['success' => true], 201);
    }

    else if ($method === 'POST' && $action === 'amen') {
        $data = readJson();
        $c = requireContribution($db, (int)($data['id'] ?? 0), $userId);
        $del = $db->prepare('DELETE FROM reactions WHERE target_type = ? AND target_id = ? AND user_id = ? AND kind = ?');
        $del->execute(['contribution', $c['id'], $userId, 'amen']);
        $on = $del->rowCount() === 0;
        if ($on) {
            $db->prepare('INSERT IGNORE INTO reactions (target_type, target_id, user_id, kind) VALUES (?, ?, ?, ?)')
                ->execute(['contribution', $c['id'], $userId, 'amen']);
        }
        if ($on && (int)$c['user_id'] !== (int)$userId) {
            pushLater($db, $c['user_id'], 'Amén a tu aporte', nameOf($db, $userId) . ' dijo amén a lo que compartiste.', '/?go=groups', 'amen:' . $c['id'] . ':' . date('Y-m-d'));
        }
        $n = $db->prepare('SELECT COUNT(*) FROM reactions WHERE target_type = ? AND target_id = ? AND kind = ?');
        $n->execute(['contribution', $c['id'], 'amen']);
        jsonResponse(['success' => true, 'i_amened' => $on, 'amens' => (int)$n->fetchColumn()]);
    }

    else if ($method === 'POST' && $action === 'comment') {
        $data = readJson();
        $c = requireContribution($db, (int)($data['id'] ?? 0), $userId);
        $text = trim($data['text'] ?? '');
        if ($text === '' || mb_strlen($text) > 1000) jsonResponse(['success' => false, 'error' => 'Invalid text'], 400);
        $db->prepare('INSERT INTO comments (target_type, target_id, user_id, text) VALUES (?, ?, ?, ?)')->execute(['contribution', $c['id'], $userId, $text]);
        jsonResponse(['success' => true], 201);
    }

    else {
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    error_log('contributions.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Request failed'], 500);
}
