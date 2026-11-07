<?php
/**
 * Maná Digital - Panel del líder / pastor (Fase 4)
 * Archivo: api/leader.php
 * Panel y vista pastoral, mensajes de cuidado, reportes, reglas, resumen semanal y modo reunión
 */

require_once '../config.php';
require_once 'lib_groups.php';

setCORSHeaders();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$userId = getCurrentUser();

const CARE_DEFAULT = 'Te extrañamos en el grupo. ¿Cómo estás? Aquí estamos para orar contigo.';

// Reporte → fila con el texto del contenido, su autor y el grupo
function reportTarget(PDO $db, $type, $id) {
    $sql = ['contribution' => 'SELECT group_id, user_id, text, NULL AS visibility FROM contributions WHERE id = ?',
            'prayer' => 'SELECT group_id, user_id, text, visibility FROM prayer_requests WHERE id = ?',
            'comment' => 'SELECT p.group_id, c.user_id, c.text, NULL AS visibility FROM comments c
                INNER JOIN prayer_requests p ON c.target_type = \'prayer\' AND p.id = c.target_id WHERE c.id = ?
                UNION ALL SELECT g.group_id, c.user_id, c.text, NULL FROM comments c
                INNER JOIN contributions g ON c.target_type = \'contribution\' AND g.id = c.target_id WHERE c.id = ?'][$type] ?? null;
    if (!$sql) return null;
    $stmt = $db->prepare($sql);
    $stmt->execute($type === 'comment' ? [$id, $id] : [$id]);
    return $stmt->fetch() ?: null;
}

function weekly(PDO $db, $g, $offset, $today) {
    [$mon, $sun] = weekRange($offset, $today);
    $gid = (int)$g['id'];
    $mem = $db->prepare('SELECT u.id, u.name FROM group_members m INNER JOIN users u ON u.id = m.user_id WHERE m.group_id = ? ORDER BY m.joined_at');
    $mem->execute([$gid]);
    $members = $mem->fetchAll();

    $rd = $db->prepare('SELECT d.user_id, d.date FROM daily_readings d INNER JOIN group_members m ON m.user_id = d.user_id AND m.group_id = ?
        WHERE d.read_at IS NOT NULL AND d.date BETWEEN ? AND ?');
    $rd->execute([$gid, $mon, $sun]);
    $readMap = [];
    foreach ($rd->fetchAll() as $r) $readMap[$r['user_id']][$r['date']] = true;
    $days = [];
    for ($i = 0; $i < 7; $i++) $days[] = date('Y-m-d', strtotime("$mon +$i day"));
    $bars = []; $reads = 0;
    foreach ($members as $m) {
        $row = [];
        foreach ($days as $d) { $on = !empty($readMap[$m['id']][$d]); $row[] = $on; $reads += $on ? 1 : 0; }
        $bars[] = ['name' => $m['name'], 'initial' => initialOf($m['name']), 'color' => avatarColor($m['id']), 'days' => $row, 'count' => count(array_filter($row))];
    }

    $q = function ($sql, $args) use ($db) { $s = $db->prepare($sql); $s->execute($args); return (int)$s->fetchColumn(); };
    $contrib = $q('SELECT COUNT(*) FROM contributions WHERE group_id = ? AND date BETWEEN ? AND ?', [$gid, $mon, $sun]);
    $accompanied = $q('SELECT COUNT(DISTINCT r.target_id) FROM reactions r INNER JOIN prayer_requests p ON p.id = r.target_id
        WHERE r.target_type = \'prayer\' AND r.kind = \'praying\' AND p.group_id = ? AND p.hidden = 0 AND p.visibility <> \'leader\'
        AND DATE(r.created_at) BETWEEN ? AND ?', [$gid, $mon, $sun]);
    $testimonies = $q('SELECT COUNT(*) FROM prayer_requests WHERE group_id = ? AND status = \'answered\' AND hidden = 0 AND visibility <> \'leader\'
        AND DATE(answered_at) BETWEEN ? AND ?', [$gid, $mon, $sun]);

    // Versículo más marcado como palabra rhema por los miembros esta semana
    $top = $db->prepare('SELECT d.book_id, d.rhema_chapter AS chapter, d.rhema_verse AS verse, COUNT(*) AS n FROM daily_readings d
        INNER JOIN group_members m ON m.user_id = d.user_id AND m.group_id = ?
        WHERE d.rhema_verse IS NOT NULL AND d.date BETWEEN ? AND ? GROUP BY d.book_id, d.rhema_chapter, d.rhema_verse ORDER BY n DESC LIMIT 1');
    $top->execute([$gid, $mon, $sun]);
    $verse = null;
    if ($t = $top->fetch()) {
        $v = $db->prepare('SELECT text FROM bible_verses WHERE version = ? AND book_id = ? AND chapter = ? AND verse = ?');
        $v->execute([BIBLE_VERSION, $t['book_id'], $t['chapter'], $t['verse']]);
        $book = getBook($db, $t['book_id']);
        $verse = ['reference' => $book['name_es'] . ' ' . $t['chapter'] . ':' . $t['verse'], 'text' => $v->fetchColumn() ?: null, 'count' => (int)$t['n']];
    }

    // Capítulos de la semana, recortados a los días del plan
    $book = getBook($db, $g['book_id']);
    $label = null; $first = null; $last = null;
    foreach ($days as $d) {
        if (($n = planDayNumber($g, $d)) && ($r = planChapterRange($db, $g, $n))) { $first = $first ?? $r[0]; $last = $r[1]; }
    }
    if ($first) $label = $book['name_es'] . ' ' . $first . ($last > $first ? ' al ' . $last : '');

    $weekNo = max(1, (int)floor(daysBetween(date('Y-m-d', strtotime($g['start_date'] . ' monday this week')), $mon) / 7) + 1);
    return ['group' => ['id' => $gid, 'name' => $g['name']], 'week' => $weekNo, 'from' => $mon, 'to' => $sun, 'offset' => (int)$offset, 'chapters' => $label,
        'reads' => $reads, 'reads_possible' => count($members) * 7, 'contributions' => $contrib, 'accompanied' => $accompanied, 'testimonies' => $testimonies,
        'members' => $bars, 'top_verse' => $verse];
}

try {
    $db = leaderDb();
    $today = todayDate();

    // Vista pastoral: todos los grupos que lidero
    if ($method === 'GET' && $action === 'overview') {
        $stmt = $db->prepare('SELECT g.* FROM `groups` g INNER JOIN group_members m ON m.group_id = g.id WHERE m.user_id = ? AND m.role = ? ORDER BY g.name');
        $stmt->execute([$userId, 'leader']);
        $groups = []; $tot = ['members' => 0, 'reads_week' => 0, 'reads_possible' => 0, 'contributions_today' => 0, 'open_prayers' => 0, 'reports_open' => 0, 'needs_care' => 0];
        foreach ($stmt->fetchAll() as $g) {
            $k = groupKpis($db, $g['id'], $today);
            $care = needsCare($db, $g['id'], $userId, $today);
            $day = groupDay($db, $g, $today);
            $groups[] = array_merge(['id' => (int)$g['id'], 'name' => $g['name'], 'initial' => initialOf($g['name']), 'color' => $g['color'],
                'type_label' => GROUP_TYPES[$g['type']], 'reference' => $day['reference'], 'status' => $day['status'], 'needs_care' => count($care),
                'care_names' => array_slice(array_column($care, 'name'), 0, 3)], $k);
            foreach ($tot as $key => $_) $tot[$key] += $key === 'needs_care' ? count($care) : $k[$key];
        }
        jsonResponse(['success' => true, 'groups' => $groups, 'totals' => $tot]);
    }

    else if ($method === 'GET' && $action === 'dashboard') {
        $groupId = (int)($_GET['group_id'] ?? 0);
        requireLeader($db, $groupId, $userId);
        $g = getGroup($db, $groupId);
        $tomorrow = date('Y-m-d', strtotime($today . ' +1 day'));
        $q = $db->prepare('SELECT date, text FROM group_questions WHERE group_id = ? AND date IN (?, ?)');
        $q->execute([$groupId, $today, $tomorrow]);
        $qs = array_column($q->fetchAll(), 'text', 'date');
        jsonResponse(['success' => true, 'group' => ['id' => (int)$g['id'], 'name' => $g['name']], 'kpis' => groupKpis($db, $groupId, $today),
            'needs_care' => needsCare($db, $groupId, $userId, $today), 'question_today' => $qs[$today] ?? null, 'question_tomorrow' => $qs[$tomorrow] ?? null,
            'care_default' => CARE_DEFAULT, 'rules' => groupRules($db, $groupId)]);
    }

    else if ($method === 'POST' && $action === 'care-message') {
        $data = readJson();
        $groupId = (int)($data['group_id'] ?? 0);
        $to = (int)($data['user_id'] ?? 0);
        $text = trim($data['text'] ?? '') ?: CARE_DEFAULT;
        requireLeader($db, $groupId, $userId);
        if ($to === (int)$userId || !memberRole($db, $groupId, $to) || mb_strlen($text) > 300) jsonResponse(['success' => false, 'error' => 'Invalid'], 400);
        $db->prepare('INSERT INTO nudges (group_id, from_user_id, to_user_id, date, kind, message) VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE message = VALUES(message)')->execute([$groupId, $userId, $to, $today, 'care', $text]);
        pushLater($db, $to, nameOf($db, $userId) . ' · ' . getGroup($db, $groupId)['name'], $text, '/');
        jsonResponse(['success' => true]);
    }

    else if ($method === 'POST' && $action === 'question') {
        // Pregunta para hoy o para mañana; sale sola al llegar el día
        $data = readJson();
        $groupId = (int)($data['group_id'] ?? 0);
        $text = trim($data['text'] ?? '');
        requireLeader($db, $groupId, $userId);
        if ($text === '' || mb_strlen($text) > 400) jsonResponse(['success' => false, 'error' => 'Invalid text'], 400);
        $date = ($data['when'] ?? 'tomorrow') === 'today' ? $today : date('Y-m-d', strtotime($today . ' +1 day'));
        $db->prepare('INSERT INTO group_questions (group_id, date, text, author_id) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE text = VALUES(text), author_id = VALUES(author_id)')->execute([$groupId, $date, $text, $userId]);
        jsonResponse(['success' => true]);
    }

    else if ($action === 'rules') {
        $groupId = (int)($_GET['group_id'] ?? (readJson()['group_id'] ?? 0));
        requireLeader($db, $groupId, $userId);
        if ($method === 'PUT') {
            $data = readJson();
            $db->prepare('INSERT INTO group_rules (group_id, close_after_30d, allow_anonymous) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE close_after_30d = VALUES(close_after_30d), allow_anonymous = VALUES(allow_anonymous)')
                ->execute([$groupId, !empty($data['close_after_30d']) ? 1 : 0, array_key_exists('allow_anonymous', $data) && empty($data['allow_anonymous']) ? 0 : 1]);
        }
        jsonResponse(['success' => true, 'rules' => groupRules($db, $groupId)]);
    }

    // Cualquier miembro puede reportar contenido de su grupo
    else if ($method === 'POST' && $action === 'report') {
        $data = readJson();
        $type = $data['target_type'] ?? '';
        $id = (int)($data['target_id'] ?? 0);
        $t = reportTarget($db, $type, $id);
        if (!$t || !($role = memberRole($db, $t['group_id'], $userId))) jsonResponse(['success' => false, 'error' => 'Not found'], 404);
        if ($t['visibility'] === 'leader' && $role !== 'leader' && (int)$t['user_id'] !== (int)$userId) jsonResponse(['success' => false, 'error' => 'Not found'], 404);
        $dup = $db->prepare('SELECT 1 FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ? AND status = ?');
        $dup->execute([$userId, $type, $id, 'open']);
        if (!$dup->fetchColumn()) {
            $db->prepare('INSERT INTO reports (group_id, reporter_id, target_type, target_id, reason) VALUES (?, ?, ?, ?, ?)')
                ->execute([$t['group_id'], $userId, $type, $id, mb_substr(trim($data['reason'] ?? ''), 0, 300) ?: null]);
        }
        jsonResponse(['success' => true], 201);
    }

    else if ($method === 'GET' && $action === 'reports') {
        $groupId = (int)($_GET['group_id'] ?? 0);
        requireLeader($db, $groupId, $userId);
        $stmt = $db->prepare('SELECT * FROM reports WHERE group_id = ? AND status = ? ORDER BY created_at DESC LIMIT 50');
        $stmt->execute([$groupId, 'open']);
        $out = [];
        foreach ($stmt->fetchAll() as $r) {
            $t = reportTarget($db, $r['target_type'], $r['target_id']);
            if (!$t) { $db->prepare('UPDATE reports SET status = ? WHERE id = ?')->execute(['removed', $r['id']]); continue; }
            $a = $db->prepare('SELECT name FROM users WHERE id = ?');
            $a->execute([$t['user_id']]);
            $out[] = ['id' => (int)$r['id'], 'type' => $r['target_type'], 'text' => $t['text'], 'reason' => $r['reason'], 'auto' => $r['reporter_id'] === null,
                'author' => $t['visibility'] === 'anonymous' ? 'Anónimo' : $a->fetchColumn(), 'created_at' => $r['created_at']];
        }
        jsonResponse(['success' => true, 'reports' => $out]);
    }

    else if ($method === 'POST' && $action === 'resolve-report') {
        $data = readJson();
        $stmt = $db->prepare('SELECT * FROM reports WHERE id = ? AND status = ?');
        $stmt->execute([(int)($data['id'] ?? 0), 'open']);
        $r = $stmt->fetch();
        if (!$r) jsonResponse(['success' => false, 'error' => 'Not found'], 404);
        requireLeader($db, $r['group_id'], $userId);
        $keep = ($data['action'] ?? '') === 'keep';
        $db->beginTransaction();
        if ($keep) {
            if ($r['target_type'] === 'prayer') $db->prepare('UPDATE prayer_requests SET hidden = 0 WHERE id = ?')->execute([$r['target_id']]);
            if ($r['target_type'] === 'comment') $db->prepare('UPDATE comments SET hidden = 0 WHERE id = ?')->execute([$r['target_id']]);
        } else {
            if ($r['target_type'] === 'prayer') $db->prepare('UPDATE prayer_requests SET status = ?, hidden = 1 WHERE id = ?')->execute(['closed', $r['target_id']]);
            if ($r['target_type'] === 'comment') $db->prepare('DELETE FROM comments WHERE id = ?')->execute([$r['target_id']]);
            if ($r['target_type'] === 'contribution') {
                $db->prepare('DELETE FROM comments WHERE target_type = ? AND target_id = ?')->execute(['contribution', $r['target_id']]);
                $db->prepare('DELETE FROM reactions WHERE target_type = ? AND target_id = ?')->execute(['contribution', $r['target_id']]);
                $db->prepare('DELETE FROM contributions WHERE id = ?')->execute([$r['target_id']]);
            }
        }
        $db->prepare('UPDATE reports SET status = ?, resolved_by = ? WHERE target_type = ? AND target_id = ? AND status = ?')
            ->execute([$keep ? 'kept' : 'removed', $userId, $r['target_type'], $r['target_id'], 'open']);
        $db->commit();
        jsonResponse(['success' => true]);
    }

    else if ($method === 'GET' && $action === 'weekly') {
        $groupId = (int)($_GET['group_id'] ?? 0);
        requireMember($db, $groupId, $userId);
        jsonResponse(['success' => true] + weekly($db, getGroup($db, $groupId), min(0, (int)($_GET['offset'] ?? 0)), $today));
    }

    else if ($method === 'GET' && $action === 'meeting') {
        $groupId = (int)($_GET['group_id'] ?? 0);
        requireLeader($db, $groupId, $userId);
        $g = getGroup($db, $groupId);
        $w = weekly($db, $g, 0, $today);

        $stmt = $db->prepare('SELECT c.id, c.text, c.chapter, c.verse, u.id AS uid, u.name,
                (SELECT COUNT(*) FROM reactions r WHERE r.target_type = \'contribution\' AND r.target_id = c.id AND r.kind = \'amen\') AS amens
            FROM contributions c INNER JOIN users u ON u.id = c.user_id WHERE c.group_id = ? AND c.date BETWEEN ? AND ?
            ORDER BY amens DESC, c.created_at DESC LIMIT 2');
        $stmt->execute([$groupId, $w['from'], $w['to']]);
        $book = getBook($db, $g['book_id']);
        $featured = array_map(fn($c) => ['author' => $c['name'], 'initial' => initialOf($c['name']), 'color' => avatarColor($c['uid']), 'text' => $c['text'],
            'verse_ref' => $c['verse'] ? $book['name_es'] . ' ' . $c['chapter'] . ':' . $c['verse'] : null, 'amens' => (int)$c['amens']], $stmt->fetchAll());

        $q = $db->prepare('SELECT text FROM group_questions WHERE group_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC LIMIT 1');
        $q->execute([$groupId, $w['from'], $w['to']]);

        // Solo lo que el grupo puede ver: nada reservado al líder ni en revisión; los anónimos sin nombre
        $pr = $db->prepare('SELECT p.*, u.name FROM prayer_requests p INNER JOIN users u ON u.id = p.user_id
            WHERE p.group_id = ? AND p.status = ? AND p.hidden = 0 AND p.visibility <> ? ORDER BY p.created_at DESC LIMIT 6');
        $pr->execute([$groupId, 'open', 'leader']);
        $prayers = array_map(fn($p) => ['author' => $p['visibility'] === 'anonymous' ? 'Anónimo' : $p['name'], 'kind' => $p['kind'], 'text' => $p['text']], $pr->fetchAll());

        $ts = $db->prepare('SELECT p.*, u.name FROM prayer_requests p INNER JOIN users u ON u.id = p.user_id
            WHERE p.group_id = ? AND p.status = ? AND p.hidden = 0 AND p.visibility <> ? ORDER BY p.answered_at DESC LIMIT 3');
        $ts->execute([$groupId, 'answered', 'leader']);
        $testimonies = array_map(fn($p) => ['author' => $p['visibility'] === 'anonymous' ? 'Anónimo' : $p['name'], 'asked' => $p['text'], 'testimony' => $p['testimony']], $ts->fetchAll());

        jsonResponse(['success' => true, 'weekly' => $w, 'featured' => $featured, 'question' => $q->fetchColumn() ?: null, 'prayers' => $prayers, 'testimonies' => $testimonies]);
    }

    else {
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('leader.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Request failed'], 500);
}
