<?php
/**
 * API de Gestión de Usuarios/Empleados
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
            $result = $mysqli->query("SELECT * FROM usuarios WHERE id = $id");
            if (!$result) {
                echo json_encode(["error" => $mysqli->error]);
            } else {
                $usuario = $result->fetch_assoc();
                if ($usuario) {
                    unset($usuario['password']);
                    echo json_encode($usuario);
                } else {
                    echo json_encode(["error" => "Usuario no encontrado"]);
                }
            }
        } else {
            $result = $mysqli->query("SELECT id, nombre, correo, rol, username, created_at FROM usuarios");
            if (!$result) {
                echo json_encode(["error" => $mysqli->error]);
            } else {
                $usuarios = $result->fetch_all(MYSQLI_ASSOC);
                echo json_encode($usuarios);
            }
        }
        break;

    case "create":
        // Solo administradores pueden crear usuarios
        requireAdmin();
        
        $nombre = $mysqli->real_escape_string($_POST['nombre'] ?? '');
        $correo = $mysqli->real_escape_string($_POST['correo'] ?? '');
        $rol = $mysqli->real_escape_string($_POST['rol'] ?? 'Vendedor');
        $password = password_hash($_POST['password'] ?? '', PASSWORD_DEFAULT);

        // Validaciones
        if (empty($nombre) || empty($correo) || empty($_POST['password'])) {
            echo json_encode(["error" => "Todos los campos son requeridos"]);
            break;
        }

        $stmt = $mysqli->prepare("INSERT INTO usuarios (nombre, correo, rol, username, password) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $nombre, $correo, $rol, $correo, $password);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["error" => $stmt->error]);
        }
        $stmt->close();
        break;

    case "update":
        // Solo administradores pueden editar usuarios
        requireAdmin();
        
        $id = intval($_POST['id'] ?? 0);
        $nombre = $mysqli->real_escape_string($_POST['nombre'] ?? '');
        $correo = $mysqli->real_escape_string($_POST['correo'] ?? '');
        $rol = $mysqli->real_escape_string($_POST['rol'] ?? '');
        $password = !empty($_POST['password']) ? password_hash($_POST['password'], PASSWORD_DEFAULT) : null;

        if ($password) {
            $stmt = $mysqli->prepare("UPDATE usuarios SET nombre=?, correo=?, rol=?, password=? WHERE id=?");
            $stmt->bind_param("ssssi", $nombre, $correo, $rol, $password, $id);
        } else {
            $stmt = $mysqli->prepare("UPDATE usuarios SET nombre=?, correo=?, rol=? WHERE id=?");
            $stmt->bind_param("sssi", $nombre, $correo, $rol, $id);
        }
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["error" => $stmt->error]);
        }
        $stmt->close();
        break;

    case "delete":
        // Solo administradores pueden eliminar usuarios
        requireAdmin();
        
        $id = intval($_POST['id'] ?? 0);
        $stmt = $mysqli->prepare("DELETE FROM usuarios WHERE id=?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["error" => $stmt->error]);
        }
        $stmt->close();
        break;

    default:
        echo json_encode(["error" => "Acción no válida"]);
}

$mysqli->close();
?>

