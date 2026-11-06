<?php
/**
 * Maná Digital - Biblia por capítulo
 * Archivo: api/bible.php
 */

require_once '../config.php';
require_once 'lib_day.php';

setCORSHeaders();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
getCurrentUser();

try {
    $db = dayDb();

    if ($method === 'GET' && $action === 'books') {
        $books = $db->query('SELECT id, name_es, chapters, testament FROM bible_books ORDER BY id')->fetchAll();
        jsonResponse(['success' => true, 'books' => $books]);
    }

    else if ($method === 'GET' && $action === 'chapter') {
        $bookId = (int)($_GET['book_id'] ?? 0);
        $chapter = (int)($_GET['chapter'] ?? 0);
        $book = getBook($db, $bookId);
        if (!$book || $chapter < 1 || $chapter > $book['chapters']) {
            jsonResponse(['success' => false, 'error' => 'Invalid book or chapter'], 400);
        }
        jsonResponse([
            'success' => true,
            'reference' => referenceLabel($book['name_es'], $chapter, $chapter),
            'verses' => chapterVerses($db, $bookId, $chapter, $chapter),
        ]);
    }

    else {
        jsonResponse(['success' => false, 'error' => 'Invalid action'], 400);
    }
} catch (PDOException $e) {
    error_log('bible.php: ' . $e->getMessage());
    jsonResponse(['success' => false, 'error' => 'Request failed'], 500);
}
