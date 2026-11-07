<?php
/**
 * Maná Digital - Utilidades de grupos (Fase 2)
 * Archivo: api/lib_groups.php
 */

require_once 'lib_day.php';

const AVATAR_COLORS = ['#E8B04B', '#3B82F6', '#14B8A6', '#6B3FBF', '#EF4444', '#DB2777', '#6B7280', '#7C4FD6', '#0F7A55', '#B7791F'];
const GROUP_TYPES = ['family' => 'Grupo familiar', 'cell' => 'Célula', 'friends' => 'Amigos', 'ministry' => 'Ministerio'];
const NUDGE_TEXT = '¿Ya leíste hoy? Te espero en el capítulo.';

function groupsDb() {
    $db = dayDb();
    try {
        $db->query('SELECT 1 FROM group_members LIMIT 1');
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'groups_migration_pending'], 503);
    }
    return $db;
}

function avatarColor($userId) { return AVATAR_COLORS[((int)$userId) % count(AVATAR_COLORS)]; }

function initialOf($name) { return mb_strtoupper(mb_substr(trim($name) ?: '?', 0, 1)); }

// Membresía del usuario en el grupo o null (las respuestas no distinguen "no existe" de "no eres miembro")
function memberRole(PDO $db, $groupId, $userId) {
    $stmt = $db->prepare('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?');
    $stmt->execute([$groupId, $userId]);
    return $stmt->fetchColumn() ?: null;
}

function requireMember(PDO $db, $groupId, $userId) {
    $role = memberRole($db, $groupId, $userId);
    if (!$role) jsonResponse(['success' => false, 'error' => 'Group not found'], 404);
    return $role;
}

function getGroup(PDO $db, $groupId) {
    $stmt = $db->prepare('SELECT * FROM `groups` WHERE id = ?');
    $stmt->execute([$groupId]);
    return $stmt->fetch() ?: null;
}

// Día del plan del grupo y capítulos de hoy, o el estado si aún no empieza / ya terminó
function groupDay(PDO $db, $group, $date) {
    $book = getBook($db, $group['book_id']);
    $n = planDayNumber($group, $date);
    if (!$n) {
        $upcoming = strtotime($date) < strtotime($group['start_date']);
        return ['status' => $upcoming ? 'upcoming' : 'finished', 'day' => null, 'book' => $book['name_es'], 'reference' => null, 'chapter' => null, 'chapter_end' => null];
    }
    $range = planChapterRange($db, $group, $n);
    return [
        'status' => 'active', 'day' => $n, 'book' => $book['name_es'], 'book_id' => (int)$group['book_id'],
        'chapter' => $range[0], 'chapter_end' => $range[1],
        'reference' => referenceLabel($book['name_es'], $range[0], $range[1]),
    ];
}

function generateInviteCode(PDO $db) {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for ($try = 0; $try < 10; $try++) {
        $code = '';
        for ($i = 0; $i < 6; $i++) $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        $stmt = $db->prepare('SELECT 1 FROM `groups` WHERE invite_code = ?');
        $stmt->execute([$code]);
        if (!$stmt->fetchColumn()) return $code;
    }
    jsonResponse(['success' => false, 'error' => 'Could not generate code'], 500);
}

// ---------- Fase 3: peticiones ----------
const PRAYER_KINDS = ['spiritual', 'health', 'family', 'material'];
const PRAYER_NEEDS = ['prayer', 'encouragement', 'help'];
const PRAYER_VISIBILITY = ['group', 'leader', 'anonymous'];
const OFFER_TYPES = ['transfer', 'food', 'goods', 'transport', 'visit', 'other'];
const STALE_DAYS = 30;

function prayersDb() {
    $db = groupsDb();
    try {
        $db->query('SELECT 1 FROM prayer_requests LIMIT 1');
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'prayers_migration_pending'], 503);
    }
    return $db;
}

// Auto-moderación: cuentas bancarias, CCI, teléfonos, enlaces o pedidos de depósito
function looksRisky($text) {
    return (bool)preg_match('/(\d[\s.-]?){10,}|\b9\d{8}\b|\bcci\b|cuenta\s+(bancaria|de\s+ahorros|corriente)|deposit[aoe]|https?:\/\/|www\./iu', $text);
}

// ¿Puede este usuario ver la petición? El autor y los líderes siempre; el resto solo lo no oculto y no reservado al líder.
function canSeePrayer($p, $userId, $role) {
    if ((int)$p['user_id'] === (int)$userId || $role === 'leader') return true;
    return !$p['hidden'] && $p['visibility'] !== 'leader';
}

function loadPrayer(PDO $db, $id, $userId) {
    $stmt = $db->prepare('SELECT * FROM prayer_requests WHERE id = ?');
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    if (!$p) jsonResponse(['success' => false, 'error' => 'Not found'], 404);
    $role = memberRole($db, $p['group_id'], $userId);
    if (!$role || !canSeePrayer($p, $userId, $role)) jsonResponse(['success' => false, 'error' => 'Not found'], 404);
    return [$p, $role];
}

function authorCard($p, $userId, $name) {
    if ($p['visibility'] === 'anonymous' && (int)$p['user_id'] !== (int)$userId) {
        return ['author' => 'Anónimo', 'initial' => '?', 'color' => '#6B7280'];
    }
    return ['author' => (int)$p['user_id'] === (int)$userId ? 'Tú' : $name, 'initial' => initialOf($name), 'color' => avatarColor($p['user_id'])];
}

function openPrayersCount(PDO $db, $groupId, $userId, $role) {
    try {
        $stmt = $db->prepare('SELECT COUNT(*) FROM prayer_requests WHERE group_id = ? AND status = ?
            AND (user_id = ? OR ? = 1 OR (hidden = 0 AND visibility <> ?))');
        $stmt->execute([$groupId, 'open', $userId, $role === 'leader' ? 1 : 0, 'leader']);
        return (int)$stmt->fetchColumn();
    } catch (PDOException $e) {
        return 0;
    }
}

// ---------- Fase 4: líder ----------
function leaderDb() {
    $db = prayersDb();
    try {
        $db->query('SELECT 1 FROM reports LIMIT 1');
    } catch (PDOException $e) {
        jsonResponse(['success' => false, 'error' => 'leader_migration_pending'], 503);
    }
    return $db;
}

function requireLeader(PDO $db, $groupId, $userId) {
    if (requireMember($db, $groupId, $userId) !== 'leader') jsonResponse(['success' => false, 'error' => 'Leader only'], 403);
}

function groupRules(PDO $db, $groupId) {
    try {
        $stmt = $db->prepare('SELECT close_after_30d, allow_anonymous FROM group_rules WHERE group_id = ?');
        $stmt->execute([$groupId]);
        $r = $stmt->fetch();
    } catch (PDOException $e) {
        $r = null;
    }
    return ['close_after_30d' => $r ? (bool)$r['close_after_30d'] : false, 'allow_anonymous' => $r ? (bool)$r['allow_anonymous'] : true];
}

// Reporte automático (reporter NULL); no falla si la Fase 4 aún no se migró
function autoReport(PDO $db, $groupId, $type, $targetId, $reason) {
    try {
        $db->prepare('INSERT INTO reports (group_id, reporter_id, target_type, target_id, reason) VALUES (?, NULL, ?, ?, ?)')
            ->execute([$groupId, $type, $targetId, $reason]);
    } catch (PDOException $e) {
        error_log('autoReport: ' . $e->getMessage());
    }
}

// Lunes–domingo de la semana desplazada $offset semanas (0 = actual)
function weekRange($offset, $today) {
    $mon = new DateTime($today);
    $mon->modify('monday this week')->modify(((int)$offset * 7) . ' days');
    $sun = clone $mon;
    $sun->modify('+6 days');
    return [$mon->format('Y-m-d'), $sun->format('Y-m-d')];
}

function daysBetween($from, $to) { return (int)floor((strtotime($to) - strtotime($from)) / 86400); }

// Miembros que necesitan ánimo: ≥3 días sin leer o ≥7 días sin aportar (contando desde que se unieron)
function needsCare(PDO $db, $groupId, $leaderId, $today) {
    $stmt = $db->prepare('SELECT u.id, u.name, DATE(m.joined_at) AS joined,
            (SELECT MAX(d.date) FROM daily_readings d WHERE d.user_id = u.id AND d.read_at IS NOT NULL) AS last_read,
            (SELECT MAX(c.date) FROM contributions c WHERE c.user_id = u.id AND c.group_id = m.group_id) AS last_contrib
        FROM group_members m INNER JOIN users u ON u.id = m.user_id WHERE m.group_id = ? AND m.user_id <> ?');
    $stmt->execute([$groupId, $leaderId]);
    $out = [];
    foreach ($stmt->fetchAll() as $m) {
        $sinceRead = daysBetween($m['last_read'] && $m['last_read'] > $m['joined'] ? $m['last_read'] : $m['joined'], $today);
        $sinceContrib = daysBetween($m['last_contrib'] && $m['last_contrib'] > $m['joined'] ? $m['last_contrib'] : $m['joined'], $today);
        $reason = null;
        if ($sinceRead >= 3) $reason = $m['last_read'] ? "$sinceRead días sin leer" : 'Aún no ha leído';
        elseif ($sinceContrib >= 7) $reason = "$sinceContrib días sin aportar";
        if ($reason) $out[] = ['user_id' => (int)$m['id'], 'name' => $m['name'], 'initial' => initialOf($m['name']), 'color' => avatarColor($m['id']), 'reason' => $reason, 'days' => max($sinceRead, $sinceContrib)];
    }
    usort($out, fn($a, $b) => $b['days'] <=> $a['days']);
    return $out;
}

function groupKpis(PDO $db, $groupId, $today) {
    [$mon, $sun] = weekRange(0, $today);
    $members = $db->prepare('SELECT COUNT(*) FROM group_members WHERE group_id = ?');
    $members->execute([$groupId]);
    $members = (int)$members->fetchColumn();
    $reads = $db->prepare('SELECT COUNT(*) FROM daily_readings d INNER JOIN group_members m ON m.user_id = d.user_id AND m.group_id = ?
        WHERE d.read_at IS NOT NULL AND d.date BETWEEN ? AND ?');
    $reads->execute([$groupId, $mon, $sun]);
    $contrib = $db->prepare('SELECT COUNT(*) FROM contributions WHERE group_id = ? AND date = ?');
    $contrib->execute([$groupId, $today]);
    $prayers = $db->prepare('SELECT COUNT(*) FROM prayer_requests WHERE group_id = ? AND status = ?');
    $prayers->execute([$groupId, 'open']);
    $reports = $db->prepare('SELECT COUNT(*) FROM reports WHERE group_id = ? AND status = ?');
    $reports->execute([$groupId, 'open']);
    return ['members' => $members, 'reads_week' => (int)$reads->fetchColumn(), 'reads_possible' => $members * 7,
        'contributions_today' => (int)$contrib->fetchColumn(), 'open_prayers' => (int)$prayers->fetchColumn(), 'reports_open' => (int)$reports->fetchColumn()];
}
