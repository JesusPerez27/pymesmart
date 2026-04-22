<?php
/**
 * API de Gestión de Órdenes de Impresión
 * PymeSmart - Sistema de Gestión para Imprentas
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/auth.php';
configureCors();

// Requerir autenticación
requireAuth();

$action = $_GET['action'] ?? null;
$mysqli = getDBConnection();

if (!$mysqli) {
    echo json_encode(["error" => "Error de conexión a la base de datos"]);
    exit();
}

switch ($action) {
    case "read":
        if (isset($_GET['id'])) {
            $id = intval($_GET['id']);
            $stmt = $mysqli->prepare("
                SELECT ordenes_impresion.id, ordenes_impresion.servicio_id, servicios_impresion.nombre AS producto, ordenes_impresion.cantidad, ordenes_impresion.fecha
                FROM ordenes_impresion
                JOIN servicios_impresion ON ordenes_impresion.servicio_id = servicios_impresion.id
                WHERE ordenes_impresion.id = ?
            ");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($venta = $result->fetch_assoc()) {
                echo json_encode($venta);
            } else {
                echo json_encode(["error" => "Orden no encontrada"]);
            }
            $stmt->close();
        } else {
            // Filtros por fecha
            $fechaDesde = $_GET['fecha_desde'] ?? null;
            $fechaHasta = $_GET['fecha_hasta'] ?? null;
            
            $sql = "
                SELECT ordenes_impresion.id, servicios_impresion.nombre AS producto, ordenes_impresion.cantidad, ordenes_impresion.fecha
                FROM ordenes_impresion
                JOIN servicios_impresion ON ordenes_impresion.servicio_id = servicios_impresion.id
                WHERE 1=1
            ";
            
            $params = [];
            $types = "";
            
            if ($fechaDesde) {
                $sql .= " AND DATE(ordenes_impresion.fecha) >= ?";
                $params[] = $fechaDesde;
                $types .= "s";
            }
            
            if ($fechaHasta) {
                $sql .= " AND DATE(ordenes_impresion.fecha) <= ?";
                $params[] = $fechaHasta;
                $types .= "s";
            }
            
            $sql .= " ORDER BY ordenes_impresion.fecha DESC";
            
            if (count($params) > 0) {
                $stmt = $mysqli->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $mysqli->query($sql);
            }
            
            if (!$result) {
                echo json_encode(["error" => $mysqli->error]);
            } else {
                $ventas = [];
                while ($row = $result->fetch_assoc()) {
                    $ventas[] = $row;
                }
                echo json_encode($ventas);
            }
            
            if (isset($stmt)) $stmt->close();
        }
        break;

    case "create":
        $servicio_id = intval($_POST['servicio_id'] ?? 0);
        $cantidad = intval($_POST['cantidad'] ?? 0);

        $result = $mysqli->query("SELECT nombre, stock FROM servicios_impresion WHERE id = $servicio_id");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            $servicio = $result->fetch_assoc();
            if (!$servicio) {
                echo json_encode(['status' => 'error', 'message' => 'Servicio de impresión no encontrado.']);
            } elseif ($cantidad <= 0) {
                echo json_encode(['status' => 'error', 'message' => 'La cantidad debe ser mayor a 0.']);
            } elseif ($servicio['stock'] < $cantidad) {
                echo json_encode(['status' => 'error', 'message' => 'Cantidad insuficiente en el stock.']);
            } else {
                $result = $mysqli->query("INSERT INTO ordenes_impresion (servicio_id, cantidad) VALUES ($servicio_id, $cantidad)");
                if (!$result) {
                    echo json_encode(["error" => $mysqli->error]);
                } else {
                    $nuevo_stock = $servicio['stock'] - $cantidad;
                    $result = $mysqli->query("UPDATE servicios_impresion SET stock = $nuevo_stock WHERE id = $servicio_id");
                    if (!$result) {
                        echo json_encode(["error" => $mysqli->error]);
                    } else {
                        $lowStockServicio = null;
                        if ($nuevo_stock < 50) {
                            $lowStockServicio = ['nombre' => $servicio['nombre'], 'stock' => $nuevo_stock];
                        }
                        echo json_encode([
                            'status' => 'success',
                            'lowStockProduct' => $lowStockServicio
                        ]);
                    }
                }
            }
        }
        break;

    case "update":
        $id = intval($_POST['id'] ?? 0);
        $servicio_id = intval($_POST['servicio_id'] ?? 0);
        $cantidad = intval($_POST['cantidad'] ?? 0);

        $result = $mysqli->query("SELECT cantidad, servicio_id FROM ordenes_impresion WHERE id = $id");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            $orden_actual = $result->fetch_assoc();
            if (!$orden_actual) {
                echo json_encode(['status' => 'error', 'message' => 'Orden de impresión no encontrada.']);
            } else {
                $result = $mysqli->query("SELECT nombre, stock FROM servicios_impresion WHERE id = $servicio_id");
                if (!$result) {
                    echo json_encode(["error" => $mysqli->error]);
                } else {
                    $servicio = $result->fetch_assoc();
                    if (!$servicio) {
                        echo json_encode(['status' => 'error', 'message' => 'Servicio de impresión no encontrado.']);
                    } else {
                        $mysqli->query("UPDATE servicios_impresion SET stock = stock + {$orden_actual['cantidad']} WHERE id = {$orden_actual['servicio_id']}");
                        $result = $mysqli->query("UPDATE ordenes_impresion SET servicio_id = $servicio_id, cantidad = $cantidad WHERE id = $id");
                        if (!$result) {
                            echo json_encode(["error" => $mysqli->error]);
                        } else {
                            $nuevo_stock = $servicio['stock'] - $cantidad;
                            if ($nuevo_stock < 0) {
                                echo json_encode(['status' => 'error', 'message' => 'Cantidad insuficiente en el stock.']);
                            } else {
                                $result = $mysqli->query("UPDATE servicios_impresion SET stock = $nuevo_stock WHERE id = $servicio_id");
                                if (!$result) {
                                    echo json_encode(["error" => $mysqli->error]);
                                } else {
                                    $lowStockServicio = null;
                                    if ($nuevo_stock < 50) {
                                        $lowStockServicio = ['nombre' => $servicio['nombre'], 'stock' => $nuevo_stock];
                                    }
                                    echo json_encode([
                                        'status' => 'success',
                                        'lowStockProduct' => $lowStockServicio
                                    ]);
                                }
                            }
                        }
                    }
                }
            }
        }
        break;

    case "delete":
        $id = intval($_POST['id'] ?? 0);
        $result = $mysqli->query("SELECT cantidad, servicio_id FROM ordenes_impresion WHERE id = $id");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            $orden_actual = $result->fetch_assoc();
            if (!$orden_actual) {
                echo json_encode(['status' => 'error', 'message' => 'Orden de impresión no encontrada.']);
            } else {
                $mysqli->query("UPDATE servicios_impresion SET stock = stock + {$orden_actual['cantidad']} WHERE id = {$orden_actual['servicio_id']}");
                $result = $mysqli->query("DELETE FROM ordenes_impresion WHERE id = $id");
                if (!$result) {
                    echo json_encode(["error" => $mysqli->error]);
                } else {
                    echo json_encode(['status' => 'success']);
                }
            }
        }
        break;

    case "fetch_products":
        $result = $mysqli->query("SELECT id, nombre FROM servicios_impresion");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            $productos = [];
            while ($row = $result->fetch_assoc()) {
                $productos[] = $row;
            }
            echo json_encode($productos);
        }
        break;

    default:
        echo json_encode(["error" => "Acción no válida"]);
}

$mysqli->close();
?>

