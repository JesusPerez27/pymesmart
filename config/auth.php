<?php
/**
 * Sistema de Autenticación y Autorización
 * PymeSmart - Sistema de Gestión para Imprentas
 */

if (session_status() === PHP_SESSION_NONE) {
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => $isHttps ? 'None' : 'Lax'
    ]);
    session_start();
}

/**
 * Verificar si el usuario está autenticado
 */
function isAuthenticated() {
    return isset($_SESSION['usuario']) && isset($_SESSION['rol']);
}

/**
 * Verificar si el usuario tiene un rol específico
 */
function hasRole($rol) {
    return isAuthenticated() && $_SESSION['rol'] === $rol;
}

/**
 * Verificar si el usuario es administrador
 */
function isAdmin() {
    return hasRole('Administrador');
}

/**
 * Requerir autenticación - redirige si no está autenticado
 */
function requireAuth() {
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(["error" => "No autenticado", "redirect" => "pages/login.html"]);
        exit();
    }
}

/**
 * Requerir rol de administrador
 */
function requireAdmin() {
    requireAuth();
    if (!isAdmin()) {
        http_response_code(403);
        echo json_encode(["error" => "Acceso denegado. Se requiere rol de Administrador."]);
        exit();
    }
}

/**
 * Obtener información del usuario actual
 */
function getCurrentUser() {
    if (isAuthenticated()) {
        return [
            'id' => $_SESSION['user_id'] ?? null,
            'nombre' => $_SESSION['usuario'] ?? '',
            'rol' => $_SESSION['rol'] ?? ''
        ];
    }
    return null;
}
?>



