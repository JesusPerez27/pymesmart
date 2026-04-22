<?php
/**
 * API de Estadísticas Mejorada
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

$type = $_GET['type'] ?? 'daily';

// Función para obtener estadísticas detalladas
function getEstadisticas($mysqli, $type) {
    $whereClause = '';
    $groupBy = '';
    
    switch ($type) {
        case 'daily':
            $whereClause = "WHERE DATE(o.fecha) = CURDATE()";
            $groupBy = "GROUP BY s.id, s.nombre, DATE(o.fecha)";
            break;
        case 'monthly':
            $whereClause = "WHERE MONTH(o.fecha) = MONTH(CURDATE()) AND YEAR(o.fecha) = YEAR(CURDATE())";
            $groupBy = "GROUP BY s.id, s.nombre, MONTH(o.fecha)";
            break;
        case 'yearly':
            $whereClause = "WHERE YEAR(o.fecha) = YEAR(CURDATE())";
            $groupBy = "GROUP BY s.id, s.nombre, YEAR(o.fecha)";
            break;
        case 'summary':
            // Resumen general
            $sql = "
                SELECT 
                    COUNT(DISTINCT o.id) AS total_ordenes,
                    SUM(o.cantidad) AS total_unidades,
                    SUM(o.cantidad * s.precio) AS total_ingresos,
                    AVG(o.cantidad * s.precio) AS promedio_orden,
                    COUNT(DISTINCT o.servicio_id) AS servicios_vendidos
                FROM ordenes_impresion o
                INNER JOIN servicios_impresion s ON o.servicio_id = s.id
                WHERE DATE(o.fecha) = CURDATE()
            ";
            $result = $mysqli->query($sql);
            if ($result && $result->num_rows > 0) {
                return $result->fetch_assoc();
            }
            return null;
        default:
            return null;
    }
    
    $sql = "
        SELECT 
            s.id,
            s.nombre AS producto,
            SUM(o.cantidad) AS total_vendido,
            SUM(o.cantidad * s.precio) AS total_ingresos,
            AVG(o.cantidad * s.precio) AS promedio_orden,
            COUNT(o.id) AS num_ordenes
        FROM ordenes_impresion o
        INNER JOIN servicios_impresion s ON o.servicio_id = s.id
        $whereClause
        $groupBy
        ORDER BY total_ingresos DESC
    ";
    
    $result = $mysqli->query($sql);
    $data = [];
    
    if ($result) {
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
        }
    }
    
    return $data;
}

// Obtener datos según el tipo
if ($type === 'summary') {
    $summary = getEstadisticas($mysqli, 'summary');
    echo json_encode($summary ?: [
        'total_ordenes' => 0,
        'total_unidades' => 0,
        'total_ingresos' => 0,
        'promedio_orden' => 0,
        'servicios_vendidos' => 0
    ]);
} else {
    $data = getEstadisticas($mysqli, $type);
    
    // Calcular totales
    $totales = [
        'total_unidades' => 0,
        'total_ingresos' => 0,
        'total_ordenes' => 0
    ];
    
    foreach ($data as $item) {
        $totales['total_unidades'] += $item['total_vendido'];
        $totales['total_ingresos'] += $item['total_ingresos'];
        $totales['total_ordenes'] += $item['num_ordenes'];
    }
    
    echo json_encode([
        'datos' => $data,
        'totales' => $totales
    ]);
}

$mysqli->close();
?>

