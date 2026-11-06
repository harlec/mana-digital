<?php
/**
 * Maná Digital - Importador de texto bíblico (solo línea de comandos)
 *
 * Uso:
 *   php tools/import_bible.php --helloao spa_r09 [VERSION]   (descarga de bible.helloao.org, recomendado)
 *   php tools/import_bible.php archivo.json|archivo.csv [VERSION]
 *
 * Con --helloao se descarga la traducción completa (~5 MB) de la API gratuita de AO Lab.
 * Traducción por defecto: spa_r09 = Reina Valera 1909 (dominio público), guardada como versión RV1909.
 * RVR1960 NO está disponible en esa API (tiene derechos).
 *
 * Formatos aceptados:
 *  - JSON: lista de 66 libros en orden canónico; cada libro tiene "chapters":
 *    lista de capítulos, y cada capítulo es una lista de textos de versículo.
 *      [ {"name":"Génesis","chapters":[["En el principio...","Y la tierra..."], ...]}, ... ]
 *  - CSV (UTF-8, con encabezado opcional): libro_id,capitulo,versiculo,texto
 *
 * Es repetible: si un versículo ya existe en esa versión, se actualiza.
 * El texto debe cargarse con la licencia correspondiente (RVR1960: Sociedades Bíblicas Unidas).
 */

if (php_sapi_name() !== 'cli') { http_response_code(404); exit; }

require_once __DIR__ . '/../config.php';

$rows = []; // [book_id, chapter, verse, text]

if (($argv[1] ?? '') === '--helloao') {
    $code = $argv[2] ?? 'spa_r09';
    $version = $argv[3] ?? 'RV1909';
    if (!preg_match('/^[A-Za-z0-9_]+$/', $code)) { fwrite(STDERR, "Código de traducción inválido.\n"); exit(1); }
    $url = "https://bible.helloao.org/api/$code/complete.json";
    echo "Descargando $url …\n";
    $json = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 120]]));
    $data = $json ? json_decode($json, true) : null;
    if (!$data || count($data['books'] ?? []) !== 66) {
        fwrite(STDERR, "No se pudo descargar o la traducción no tiene 66 libros.\n");
        exit(1);
    }
    foreach ($data['books'] as $i => $book) {
        foreach ($book['chapters'] as $ch) {
            foreach ($ch['chapter']['content'] as $item) {
                if (($item['type'] ?? '') !== 'verse') continue;
                $text = '';
                foreach ($item['content'] as $part) {
                    $text .= is_array($part) ? ($part['text'] ?? '') : $part;
                }
                $rows[] = [$i + 1, (int)$ch['chapter']['number'], (int)$item['number'], trim(preg_replace('/\s+/', ' ', $text))];
            }
        }
    }
} else {
    $file = $argv[1] ?? null;
    $version = $argv[2] ?? 'RV1909';
    if (!$file || !is_readable($file)) {
        fwrite(STDERR, "Uso: php tools/import_bible.php --helloao spa_r09 | archivo.json|archivo.csv [VERSION]\n");
        exit(1);
    }
}

if (isset($file) && preg_match('/\.csv$/i', $file)) {
    $fh = fopen($file, 'r');
    while (($r = fgetcsv($fh, 0, ',', '"', '\\')) !== false) {
        if (count($r) < 4 || !ctype_digit(trim($r[0]))) continue; // salta encabezado
        $rows[] = [(int)$r[0], (int)$r[1], (int)$r[2], trim($r[3])];
    }
    fclose($fh);
} elseif (isset($file)) {
    $books = json_decode(file_get_contents($file), true);
    if (!is_array($books) || count($books) !== 66) {
        fwrite(STDERR, "El JSON debe contener exactamente 66 libros en orden canónico (tiene " . (is_array($books) ? count($books) : 0) . ").\n");
        exit(1);
    }
    foreach (array_values($books) as $i => $book) {
        foreach (array_values($book['chapters'] ?? []) as $c => $verses) {
            foreach (array_values($verses) as $v => $text) {
                $rows[] = [$i + 1, $c + 1, $v + 1, trim($text)];
            }
        }
    }
}

$db = getDBConnection();
$stmt = $db->prepare('INSERT INTO bible_verses (version, book_id, chapter, verse, text) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE text = VALUES(text)');
$db->beginTransaction();
$n = 0;
foreach ($rows as [$b, $c, $v, $t]) {
    if ($b < 1 || $b > 66 || $c < 1 || $v < 1 || $t === '') continue;
    $stmt->execute([$version, $b, $c, $v, $t]);
    if (++$n % 5000 === 0) echo "  $n versículos…\n";
}
$db->commit();
echo "Listo: $n versículos importados en la versión $version.\n";
