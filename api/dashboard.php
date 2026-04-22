<?php
/**
 * API de Dashboard
 * PymeSmart - Sistema de Gestión para Imprentas
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
configureCors();

// Requerir autenticación
requireAuth();

$mysqli = getDBConnection();

if (!$mysqli) {
    echo json_encode(["error" => "Error de conexión a la base de datos"]);
    exit();
}

$action = $_GET['action'] ?? 'summary';

switch ($action) {
    case 'summary':
        // Resumen del día
        $sql = "
            SELECT 
                COUNT(DISTINCT o.id) AS total_ordenes,
                SUM(o.cantidad) AS total_unidades,
                SUM(o.cantidad * s.precio) AS total_ingresos,
                COUNT(DISTINCT s.id) AS servicios_vendidos
            FROM ordenes_impresion o
            INNER JOIN servicios_impresion s ON o.servicio_id = s.id
            WHERE DATE(o.fecha) = CURDATE()
        ";
        
        $result = $mysqli->query($sql);
        $summary = $result ? $result->fetch_assoc() : null;
        
        // Servicios activos y stock bajo
        $productosResult = $mysqli->query("SELECT COUNT(*) as total FROM servicios_impresion");
        $productosTotal = $productosResult ? $productosResult->fetch_assoc()['total'] : 0;
        
        $stockBajoResult = $mysqli->query("SELECT COUNT(*) as total FROM servicios_impresion WHERE stock < 50");
        $stockBajo = $stockBajoResult ? $stockBajoResult->fetch_assoc()['total'] : 0;
        
        echo json_encode([
            'estadisticas' => $summary ?: [
                'total_ordenes' => 0,
                'total_unidades' => 0,
                'total_ingresos' => 0,
                'servicios_vendidos' => 0
            ],
            'servicios_activos' => $productosTotal,
            'stock_bajo' => $stockBajo
        ]);
        break;
        
    default:
        echo json_encode(["error" => "Acción no válida"]);
}

$mysqli->close();
?>

