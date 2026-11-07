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
