<?php
/**
 * API de Gestión de Proveedores
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
            $result = $mysqli->query("SELECT * FROM proveedores WHERE id = $id");
            if (!$result) {
                echo json_encode(["error" => $mysqli->error]);
            } else {
                $proveedor = $result->fetch_assoc();
                if ($proveedor) {
                    echo json_encode($proveedor);
                } else {
                    echo json_encode(["error" => "Proveedor no encontrado"]);
                }
            }
        } else {
            $result = $mysqli->query("SELECT * FROM proveedores ORDER BY id ASC");
            if (!$result) {
                echo json_encode(["error" => $mysqli->error]);
            } else {
                $proveedores = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode($proveedores);
            }
        }
        break;

    case "create":
        $nombre = $mysqli->real_escape_string($_POST['nombre'] ?? '');
        $contacto = $mysqli->real_escape_string($_POST['contacto'] ?? '');
        $telefono = $mysqli->real_escape_string($_POST['telefono'] ?? '');
        $email = $mysqli->real_escape_string($_POST['email'] ?? '');
        $result = $mysqli->query("INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES ('$nombre', '$contacto', '$telefono', '$email')");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            echo json_encode(["status" => "success"]);
        }
        break;

    case "update":
        $id = intval($_POST['id'] ?? 0);
        $nombre = $mysqli->real_escape_string($_POST['nombre'] ?? '');
        $contacto = $mysqli->real_escape_string($_POST['contacto'] ?? '');
        $telefono = $mysqli->real_escape_string($_POST['telefono'] ?? '');
        $email = $mysqli->real_escape_string($_POST['email'] ?? '');
        $result = $mysqli->query("UPDATE proveedores SET nombre='$nombre', contacto='$contacto', telefono='$telefono', email='$email' WHERE id=$id");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            echo json_encode(["status" => "success"]);
        }
        break;

    case "delete":
        $id = intval($_POST['id'] ?? 0);
        $result = $mysqli->query("DELETE FROM proveedores WHERE id=$id");
        if (!$result) {
            echo json_encode(["error" => $mysqli->error]);
        } else {
            echo json_encode(["status" => "success"]);
        }
        break;

    default:
        echo json_encode(["error" => "Acción no válida"]);
}

$mysqli->close();
?>

