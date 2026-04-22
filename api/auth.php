<?php
/**
 * API de Autenticación
 * PymeSmart - Sistema de Gestión para Imprentas
 */

session_start();
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? null;

switch ($action) {
    case "login":
        if ($_SERVER["REQUEST_METHOD"] == "POST") {
            $username = $_POST['username'] ?? '';
            $password = $_POST['password'] ?? '';
            
            $mysqli = getDBConnection();
            if (!$mysqli) {
                echo json_encode(["error" => "Error de conexión a la base de datos"]);
                exit();
            }
            
            $sql = "SELECT * FROM usuarios WHERE username = ?";
            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param("s", $username);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                if (password_verify($password, $row['password'])) {
                    $_SESSION['usuario'] = $row['nombre'];
                    $_SESSION['rol'] = $row['rol'];
                    $_SESSION['user_id'] = $row['id'];
                    echo json_encode(["status" => "success", "redirect" => "dashboard.html"]);
                } else {
                    echo json_encode(["error" => "Nombre de usuario o contraseña incorrectos"]);
                }
            } else {
                echo json_encode(["error" => "Nombre de usuario o contraseña incorrectos"]);
            }
            
            $stmt->close();
            $mysqli->close();
        }
        break;
        
    case "logout":
        session_unset();
        session_destroy();
        echo json_encode(["status" => "success", "redirect" => "login.html"]);
        break;
        
    case "check":
        if (isset($_SESSION['usuario'])) {
            echo json_encode([
                "authenticated" => true,
                "usuario" => $_SESSION['usuario'],
                "rol" => $_SESSION['rol']
            ]);
        } else {
            echo json_encode(["authenticated" => false]);
        }
        break;
        
    default:
        echo json_encode(["error" => "Acción no válida"]);
}
?>

