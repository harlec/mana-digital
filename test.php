<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "PHP funciona correctamente\n";
echo "Versión PHP: " . phpversion() . "\n";

require_once 'config.php';

echo "Config.php cargado\n";
echo "JWT_SECRET definido: " . (defined('JWT_SECRET') ? 'SI' : 'NO') . "\n";
?>