<?php
/**
 * Configuración de conexión a la base de datos
 * PymeSmart - Sistema de Gestión para Imprentas
 */

$db_config = [
    'host' => getenv('DB_HOST') ?: '127.0.0.1',
    'username' => getenv('DB_USER') ?: 'root',
    'password' => getenv('DB_PASS') ?: '',
    'database' => getenv('DB_NAME') ?: 'pymesmart_imprentas',
    'charset' => 'utf8mb4',
    // Puerto de MySQL en tu XAMPP.
    'port' => (int)(getenv('DB_PORT') ?: 3307)
];

function getDBConnection() {
    global $db_config;

    $mysqli = @new mysqli(
        $db_config['host'],
        $db_config['username'],
        $db_config['password'],
        $db_config['database'],
        $db_config['port']
    );

    if (!$mysqli->connect_error) {
        $mysqli->set_charset($db_config['charset']);
        return $mysqli;
    }

    error_log("Error de conexión MySQL en {$db_config['host']}:{$db_config['port']} con usuario {$db_config['username']} y base {$db_config['database']}");
    return null;
}
?>

