<?php
/**
 * Configuracion CORS para despliegue frontend/backend separado.
 */

function configureCors() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = getenv('ALLOWED_ORIGINS') ?: '';
    $allowedOrigins = array_filter(array_map('trim', explode(',', $allowed)));

    // Si no se define ALLOWED_ORIGINS, permite origen local por defecto.
    if (empty($allowedOrigins) && !empty($origin)) {
        $allowedOrigins = [$origin];
    }

    if (!empty($origin) && in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit();
    }
}
?>
