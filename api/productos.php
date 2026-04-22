<?php
/**
 * API de Gestión de Servicios de Impresión
 * PymeSmart - Sistema de Gestión para Imprentas
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

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
            $result = $mysqli->query("
                SELECT servicios_impresion.*, proveedores.nombre AS proveedor
                FROM servicios_impresion
                LEFT JOIN proveedores ON servicios_impresion.proveedor_id = proveedores.id
                WHERE servicios_impresion.id = $id
            ");
            if (!$result) {
                echo json_encode(["error" => $mysqli->error]);
            } else {
                $producto = $result->fetch_assoc();
                if ($producto) {
                    echo json_encode($producto);
                } else {
                    echo json_encode(["error" => "Producto no encontrado"]);
                }
            }
        } else {
            $result = $mysqli->query("
                SELECT servicios_impresion.*, proveedores.nombre AS proveedor
                FROM servicios_impresion
                LEFT JOIN proveedores ON servicios_impresion.proveedor_id = proveedores.id
                ORDER BY servicios_impresion.id ASC
            ");
            if (!$result) {
                echo json_encode(["error" => $mysqli->error]);
            } else {
                $productos = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode($productos);
            }
        }
        break;

    case "create":
        $nombre = $mysqli->real_escape_string($_POST['nombre'] ?? '');
        $descripcion = $mysqli->real_escape_string($_POST['descripcion'] ?? '');
        $precio = floatval($_POST['precio'] ?? 0);
        $stock = intval($_POST['stock'] ?? 0);
        $proveedor_id = intval($_POST['proveedor_id'] ?? 0);
        $result = $mysqli->query("
            INSERT INTO servicios_impresion (nombre, descripcion, precio, stock, proveedor_id)
            VALUES ('$nombre', '$descripcion', $precio, $stock, $proveedor_id)
        ");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            echo json_encode(["status" => "success"]);
        }
        break;

    case "update":
        $id = intval($_POST['id'] ?? 0);
        $nombre = $mysqli->real_escape_string($_POST['nombre'] ?? '');
        $descripcion = $mysqli->real_escape_string($_POST['descripcion'] ?? '');
        $precio = floatval($_POST['precio'] ?? 0);
        $stock = intval($_POST['stock'] ?? 0);
        $proveedor_id = intval($_POST['proveedor_id'] ?? 0);
        $result = $mysqli->query("
            UPDATE servicios_impresion
            SET nombre='$nombre', descripcion='$descripcion', precio=$precio, stock=$stock, proveedor_id=$proveedor_id
            WHERE id=$id
        ");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            echo json_encode(["status" => "success"]);
        }
        break;

    case "delete":
        $id = intval($_POST['id'] ?? 0);
        $result = $mysqli->query("DELETE FROM servicios_impresion WHERE id=$id");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            echo json_encode(["status" => "success"]);
        }
        break;

    case "fetch_providers":
        $result = $mysqli->query("SELECT id, nombre FROM proveedores");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            $proveedores = $result->fetch_all(MYSQLI_ASSOC);
            echo json_encode($proveedores);
        }
        break;

    default:
        echo json_encode(["error" => "Acción no válida"]);
}

$mysqli->close();
?>

