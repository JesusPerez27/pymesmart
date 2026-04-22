# PymeSmart - Código Completo del Proyecto

Este documento contiene todo el código fuente del proyecto PymeSmart - Sistema de Gestión para Imprentas.

---

## 📁 ARCHIVOS DE API (PHP)

### api/auth.php
```php
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
```

### api/dashboard.php
```php
<?php
/**
 * API de Dashboard
 * PymeSmart - Sistema de Gestión para Imprentas
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

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
```

### api/estadisticas.php
```php
<?php
/**
 * API de Estadísticas Mejorada
 * PymeSmart - Sistema de Gestión para Imprentas
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/auth.php';

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
```

### api/productos.php
```php
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
```

### api/proveedores.php
```php
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
```

### api/usuarios.php
```php
<?php
/**
 * API de Gestión de Usuarios/Empleados
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
```

### api/ventas.php
```php
<?php
/**
 * API de Gestión de Órdenes de Impresión
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
```

---

## 📁 ARCHIVOS DE CONFIGURACIÓN (PHP)

### config/auth.php
```php
<?php
/**
 * Sistema de Autenticación y Autorización
 * PymeSmart - Sistema de Gestión para Imprentas
 */

session_start();

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
```

### config/database.php
```php
<?php
/**
 * Configuración de conexión a la base de datos
 * PymeSmart - Sistema de Gestión para Imprentas
 */

$db_config = [
    'host' => 'localhost',
    'username' => 'root',
    'password' => '',
    'database' => 'pymesmart_imprentas',
    'charset' => 'utf8mb4'
];

function getDBConnection() {
    global $db_config;
    
    $mysqli = new mysqli(
        $db_config['host'],
        $db_config['username'],
        $db_config['password'],
        $db_config['database']
    );
    
    if ($mysqli->connect_error) {
        error_log("Error de conexión: " . $mysqli->connect_error);
        return null;
    }
    
    $mysqli->set_charset($db_config['charset']);
    return $mysqli;
}
?>
```

---

## 📁 BASE DE DATOS (SQL)

### database.sql
```sql
-- ============================================
-- PymeSmart - Sistema de Gestión para Imprentas
-- Script de creación de base de datos
-- ============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS pymesmart_imprentas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pymesmart_imprentas;

-- Tabla de usuarios/empleados
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('Administrador', 'Vendedor') NOT NULL DEFAULT 'Vendedor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de servicios de impresión
CREATE TABLE IF NOT EXISTS servicios_impresion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    proveedor_id INT,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de órdenes de impresión
CREATE TABLE IF NOT EXISTS ordenes_impresion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    servicio_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (servicio_id) REFERENCES servicios_impresion(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERTAR USUARIO ADMINISTRADOR PRINCIPAL
-- ============================================

-- Insertar usuario administrador principal
-- Contraseña: admin123
INSERT INTO usuarios (nombre, correo, username, password, rol) VALUES
('Administrador Principal', 'admin@pymesmart.com', 'admin', '$2y$10$nogy/yoL4nMMh574knMf1u.ltFuEZsguGjQR.TkQ3p3sPM6QvccVK', 'Administrador');
```

---

---

## 📁 ARCHIVOS CSS

### assets/css/main.css

*Nota: Este archivo CSS es muy extenso (más de 1500 líneas). Contiene todos los estilos del sistema incluyendo: variables CSS, modo oscuro, navegación, tablas, botones, modales, página de login, landing page, estadísticas, dashboard, notificaciones toast, y estilos responsive.*

El archivo completo está disponible en: `assets/css/main.css`

---

## 📁 ARCHIVOS JAVASCRIPT

### assets/js/auth.js
```javascript
/**
 * Módulo de Autenticación
 * PymeSmart - Sistema de Gestión para Imprentas
 */

// Verificar autenticación al cargar páginas protegidas
document.addEventListener('DOMContentLoaded', () => {
    const protectedPages = ['dashboard', 'usuarios', 'proveedores', 'productos', 'ventas', 'estadisticas'];
    const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
    
    if (protectedPages.includes(currentPage)) {
        checkAuth();
    }
    
    // Manejar login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Manejar logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

async function checkAuth() {
    try {
        const response = await fetch('../api/auth.php?action=check');
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Error verificando autenticación:', error);
        window.location.href = 'login.html';
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const errorMsg = document.getElementById('error-message');
    
    try {
        const response = await fetch('../api/auth.php?action=login', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            window.location.href = data.redirect;
        } else {
            errorMsg.textContent = data.error || 'Error al iniciar sesión';
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        errorMsg.textContent = 'Error de conexión. Intenta nuevamente.';
        errorMsg.style.display = 'block';
    }
}

async function handleLogout(e) {
    e.preventDefault();
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        try {
            const response = await fetch('../api/auth.php?action=logout');
            const data = await response.json();
            
            if (data.status === 'success') {
                window.location.href = data.redirect;
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            window.location.href = 'login.html';
        }
    }
}
```

### assets/js/dashboard.js
```javascript
/**
 * Dashboard Mejorado
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener("DOMContentLoaded", () => {
    let dashboardChart = null;
    
    // Cargar nombre de usuario
    loadUserInfo();
    
    // Cargar datos del dashboard
    loadDashboardData();
    
    // Cargar últimas órdenes
    loadUltimasOrdenes();
    
    // Cargar alertas
    loadAlertas();
});

// Cargar información del usuario
async function loadUserInfo() {
    try {
        const response = await fetch('../api/auth.php?action=check');
        const data = await response.json();
        if (data.authenticated && data.usuario) {
            document.getElementById('user-name').textContent = data.usuario;
        }
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Cargar estadísticas de hoy
        const statsResponse = await fetch('../api/estadisticas.php?type=daily');
        const statsData = await statsResponse.json();
        
        if (statsData.datos && statsData.totales) {
            const totales = statsData.totales;
            
            // Actualizar tarjetas
            document.getElementById('ingresos-hoy').textContent = formatCurrency(totales.total_ingresos);
            document.getElementById('ordenes-hoy').textContent = formatNumber(totales.total_ordenes);
            
            // Crear gráfica
            if (statsData.datos.length > 0) {
                createDashboardChart(statsData.datos);
            } else {
                document.getElementById('chart-dashboard').parentElement.innerHTML = 
                    '<p style="text-align: center; padding: 40px; color: #999;">No hay ventas registradas hoy</p>';
            }
        }
        
        // Cargar servicios activos
        const productosResponse = await fetch('../api/productos.php?action=read');
        const productos = await productosResponse.json();
        if (Array.isArray(productos)) {
            document.getElementById('servicios-activos').textContent = formatNumber(productos.length);
            
            // Contar stock bajo
            const stockBajo = productos.filter(p => p.stock < 50).length;
            document.getElementById('stock-bajo').textContent = formatNumber(stockBajo);
        }
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
    }
}

// Crear gráfica del dashboard
function createDashboardChart(datos) {
    const ctx = document.getElementById('chart-dashboard');
    if (!ctx) return;
    
    const labels = datos.map(d => d.producto);
    const ingresos = datos.map(d => parseFloat(d.total_ingresos));
    
    if (dashboardChart) {
        dashboardChart.destroy();
    }
    
    dashboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos ($)',
                data: ingresos,
                backgroundColor: '#FFC107',
                borderColor: '#FFB300',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Cargar últimas órdenes
async function loadUltimasOrdenes() {
    try {
        const response = await fetch('../api/ventas.php?action=read');
        const ordenes = await response.json();
        
        const tbody = document.getElementById('ultimas-ordenes-body');
        tbody.innerHTML = '';
        
        if (Array.isArray(ordenes) && ordenes.length > 0) {
            const ultimas5 = ordenes.slice(0, 5);
            ultimas5.forEach(orden => {
                const row = document.createElement('tr');
                const fecha = new Date(orden.fecha).toLocaleDateString('es-ES');
                row.innerHTML = `
                    <td>#${orden.id}</td>
                    <td>${orden.producto}</td>
                    <td>${formatNumber(orden.cantidad)}</td>
                    <td>${fecha}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay órdenes registradas</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar últimas órdenes:', error);
        document.getElementById('ultimas-ordenes-body').innerHTML = 
            '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #F44336;">Error al cargar órdenes</td></tr>';
    }
}

// Cargar alertas
async function loadAlertas() {
    try {
        const productosResponse = await fetch('../api/productos.php?action=read');
        const productos = await productosResponse.json();
        
        const alertasContainer = document.getElementById('alertas-container');
        alertasContainer.innerHTML = '';
        
        if (Array.isArray(productos)) {
            const stockBajo = productos.filter(p => p.stock < 50);
            const sinStock = productos.filter(p => p.stock === 0);
            
            if (stockBajo.length === 0 && sinStock.length === 0) {
                alertasContainer.innerHTML = '<div class="alerta-item success">✅ Todo en orden. No hay alertas.</div>';
            } else {
                if (sinStock.length > 0) {
                    sinStock.forEach(producto => {
                        const alerta = document.createElement('div');
                        alerta.className = 'alerta-item danger';
                        alerta.innerHTML = `
                            <strong>🔴 Sin Stock:</strong> ${producto.nombre} (Stock: ${producto.stock})
                        `;
                        alertasContainer.appendChild(alerta);
                    });
                }
                
                if (stockBajo.length > 0) {
                    stockBajo.forEach(producto => {
                        if (producto.stock > 0) {
                            const alerta = document.createElement('div');
                            alerta.className = 'alerta-item warning';
                            alerta.innerHTML = `
                                <strong>⚠️ Stock Bajo:</strong> ${producto.nombre} (Stock: ${producto.stock})
                            `;
                            alertasContainer.appendChild(alerta);
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar alertas:', error);
        document.getElementById('alertas-container').innerHTML = 
            '<div class="alerta-item danger">Error al cargar alertas</div>';
    }
}

// Funciones de formato
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-MX').format(value || 0);
}
```

### assets/js/estadisticas.js
*Nota: Este archivo contiene más de 360 líneas de código JavaScript para gestionar estadísticas y gráficas. El código completo está disponible en: `assets/js/estadisticas.js`*

### assets/js/navigation.js
```javascript
/**
 * Módulo de Navegación
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener('DOMContentLoaded', () => {
    // Marcar página activa en navegación
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });
});
```

### assets/js/productos.js
*Nota: Este archivo contiene más de 230 líneas de código JavaScript para gestionar servicios de impresión. El código completo está disponible en: `assets/js/productos.js`*

### assets/js/proveedores.js
*Nota: Este archivo contiene más de 130 líneas de código JavaScript para gestionar proveedores. El código completo está disponible en: `assets/js/proveedores.js`*

### assets/js/theme.js
```javascript
/**
 * Sistema de Modo Oscuro
 * PymeSmart - Sistema de Gestión para Imprentas
 */

(function() {
    'use strict';
    
    // Obtener tema guardado o usar el predeterminado
    const getStoredTheme = () => localStorage.getItem('theme') || 'light';
    const setStoredTheme = (theme) => localStorage.setItem('theme', theme);
    
    // Aplicar tema
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        setStoredTheme(theme);
        updateToggleIcon(theme);
    };
    
    // Actualizar icono del toggle
    const updateToggleIcon = (theme) => {
        const toggle = document.getElementById('theme-toggle');
        const loginToggle = document.getElementById('theme-toggle-login');
        
        if (toggle) {
            toggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            toggle.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        }
        
        if (loginToggle) {
            loginToggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
            loginToggle.title = theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        }
    };
    
    // Cambiar tema
    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };
    
    // Inicializar tema al cargar
    const initTheme = () => {
        const savedTheme = getStoredTheme();
        applyTheme(savedTheme);
        
        // Manejar toggle en la navegación (páginas con navbar)
        const navbar = document.querySelector('.top-navbar');
        if (navbar && !document.getElementById('theme-toggle')) {
            const toggle = document.createElement('button');
            toggle.id = 'theme-toggle';
            toggle.className = 'theme-toggle nav-item';
            toggle.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
            toggle.title = savedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
            toggle.addEventListener('click', toggleTheme);
            
            // Insertar antes del botón de logout
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.parentNode.insertBefore(toggle, logoutBtn);
            } else {
                navbar.appendChild(toggle);
            }
        } else if (document.getElementById('theme-toggle')) {
            document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
        }
        
        // Manejar toggle fijo para login/index (páginas sin navbar)
        const loginToggle = document.getElementById('theme-toggle-login');
        if (loginToggle) {
            loginToggle.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
            loginToggle.title = savedTheme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
            loginToggle.addEventListener('click', () => {
                toggleTheme();
                loginToggle.innerHTML = document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙';
                loginToggle.title = document.documentElement.getAttribute('data-theme') === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
            });
        }
    };
    
    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTheme);
    } else {
        initTheme();
    }
    
    // Exportar funciones globalmente
    window.toggleTheme = toggleTheme;
    window.applyTheme = applyTheme;
})();
```

### assets/js/usuarios.js
*Nota: Este archivo contiene más de 140 líneas de código JavaScript para gestionar usuarios/empleados. El código completo está disponible en: `assets/js/usuarios.js`*

### assets/js/utils.js
```javascript
/**
 * Utilidades Compartidas
 * PymeSmart - Sistema de Gestión para Imprentas
 */

// ===== Sistema de Notificaciones Toast =====
class ToastNotification {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${this.getIcon(type)}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        const container = this.getContainer();
        container.appendChild(toast);
        
        // Animación de entrada
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto-remover
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }
    
    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    static getContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }
    
    static success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    static error(message, duration) {
        this.show(message, 'error', duration);
    }
    
    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }
    
    static info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// ===== Confirmación de Eliminación =====
function confirmDelete(message = '¿Estás seguro de que deseas eliminar este registro?') {
    return confirm(message);
}

// ===== Formateo de Datos =====
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-MX').format(value || 0);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ===== Búsqueda en Tablas =====
function setupTableSearch(inputId, tableId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// ===== Indicador de Carga =====
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-spinner">Cargando...</div>';
    }
}

function hideLoading(elementId, content = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

// ===== Validación de Formularios =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

function validateNumber(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

// ===== Manejo de Errores de API =====
async function handleApiResponse(response, successCallback, errorCallback) {
    try {
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            if (successCallback) successCallback(data);
            return true;
        } else {
            const errorMsg = data.error || data.message || 'Error desconocido';
            ToastNotification.error(errorMsg);
            if (errorCallback) errorCallback(data);
            return false;
        }
    } catch (error) {
        ToastNotification.error('Error de conexión. Intenta nuevamente.');
        if (errorCallback) errorCallback(error);
        return false;
    }
}

// Exportar para uso global
window.ToastNotification = ToastNotification;
window.confirmDelete = confirmDelete;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.setupTableSearch = setupTableSearch;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.validateEmail = validateEmail;
window.validateRequired = validateRequired;
window.validateNumber = validateNumber;
window.handleApiResponse = handleApiResponse;
```

### assets/js/ventas.js
*Nota: Este archivo contiene más de 220 líneas de código JavaScript para gestionar órdenes de impresión. El código completo está disponible en: `assets/js/ventas.js`*

---

## 📁 ARCHIVOS HTML (PÁGINAS)

### pages/index.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PymeSmart - Sistema de Gestión para Imprentas</title>
    <link rel="stylesheet" href="../assets/css/main.css">
</head>
<body class="landing-page">
    <button id="theme-toggle-login" class="theme-toggle-fixed" title="Cambiar tema">🌙</button>
    <div class="hero-section">
        <div class="hero-content">
            <div class="logo-container">
                <h1 class="main-title">🎨 PymeSmart</h1>
                <p class="tagline">Sistema de Gestión para Imprentas</p>
            </div>
            <p class="description">
                Gestiona tus servicios de impresión, órdenes, proveedores y empleados de manera profesional y eficiente.
            </p>
        </div>
    </div>

    <div class="main-container">
        <nav class="main-nav">
            <a href="login.html" class="nav-button login-button">
                <span class="button-icon">🔐</span>
                <span class="button-text">Iniciar Sesión</span>
            </a>
        </nav>

        <div class="features-section">
            <h2>Características Principales</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">👥</div>
                    <h3>Gestión de Empleados</h3>
                    <p>Administra usuarios, roles y permisos del sistema</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📦</div>
                    <h3>Proveedores de Materiales</h3>
                    <p>Controla tus proveedores y sus contactos</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🖨️</div>
                    <h3>Servicios de Impresión</h3>
                    <p>Gestiona catálogo de servicios y stock</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📋</div>
                    <h3>Órdenes de Impresión</h3>
                    <p>Registra y gestiona órdenes de trabajo</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3>Estadísticas</h3>
                    <p>Visualiza reportes y métricas del negocio</p>
                </div>
            </div>
        </div>
    </div>

    <footer class="main-footer">
        <p>&copy; 2024 PymeSmart - Sistema de Gestión para Imprentas. Todos los derechos reservados.</p>
    </footer>
    <script src="../assets/js/theme.js"></script>
</body>
</html>
```

### pages/login.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PymeSmart - Inicio de Sesión</title>
    <link rel="stylesheet" href="../assets/css/main.css">
</head>
<body class="login-page">
    <button id="theme-toggle-login" class="theme-toggle-fixed" title="Cambiar tema">🌙</button>
    <div class="login-container">
        <div class="login-left">
            <h1>PymeSmart</h1>
            <p>® Sistema de Gestión para Imprentas</p>
        </div>
        <div class="login-right">
            <div class="form-container">
                <div class="user-icon">👤</div>
                <form id="login-form">
                    <div class="input-group">
                        <label for="username">👤</label>
                        <input type="text" id="username" name="username" placeholder="Usuario" required>
                    </div>
                    <div class="input-group">
                        <label for="password">🔒</label>
                        <input type="password" id="password" name="password" placeholder="Contraseña" required>
                    </div>
                    <div id="error-message" class="error-message"></div>
                    <button type="submit" class="login-btn">Iniciar Sesión</button>
                </form>
            </div>
        </div>
    </div>
    <script src="../assets/js/theme.js"></script>
    <script src="../assets/js/auth.js"></script>
</body>
</html>
```

### pages/dashboard.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PymeSmart - Dashboard</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
    <nav class="top-navbar">
        <a href="dashboard.html" class="nav-item active">
            <span class="nav-icon">🏠</span>
            <span>Inicio</span>
        </a>
        <a href="usuarios.html" class="nav-item">
            <span class="nav-icon">👥</span>
            <span>Empleados</span>
        </a>
        <a href="proveedores.html" class="nav-item">
            <span class="nav-icon">📦</span>
            <span>Proveedores</span>
        </a>
        <a href="productos.html" class="nav-item">
            <span class="nav-icon">🖨️</span>
            <span>Servicios</span>
        </a>
        <a href="ventas.html" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>Órdenes</span>
        </a>
        <a href="estadisticas.html" class="nav-item">
            <span class="nav-icon">📊</span>
            <span>Estadísticas</span>
        </a>
        <a href="#" id="logout-btn" class="nav-item logout">
            <span class="nav-icon">🚪</span>
            <span>Cerrar Sesión</span>
        </a>
    </nav>
    
    <div class="content">
        <div class="page-header">
            <div>
                <h1>🏠 Dashboard</h1>
                <p class="welcome-text">Bienvenido, <span id="user-name">Usuario</span></p>
            </div>
            <div class="header-actions">
                <a href="estadisticas.html" class="btn-primary">📊 Ver Estadísticas</a>
            </div>
        </div>

        <!-- Resumen Rápido -->
        <div class="stats-cards-container">
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <h3>Ingresos Hoy</h3>
                    <p class="stat-value" id="ingresos-hoy">$0.00</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-content">
                    <h3>Órdenes Hoy</h3>
                    <p class="stat-value" id="ordenes-hoy">0</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                    <h3>Servicios Activos</h3>
                    <p class="stat-value" id="servicios-activos">0</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚠️</div>
                <div class="stat-content">
                    <h3>Stock Bajo</h3>
                    <p class="stat-value" id="stock-bajo">0</p>
                </div>
            </div>
        </div>

        <!-- Gráfica Rápida y Alertas -->
        <div class="charts-container">
            <div class="chart-wrapper">
                <div class="chart-header">
                    <h2>📈 Ventas de Hoy</h2>
                </div>
                <canvas id="chart-dashboard"></canvas>
            </div>
            
            <div class="chart-wrapper">
                <div class="chart-header">
                    <h2>⚠️ Alertas y Notificaciones</h2>
                </div>
                <div id="alertas-container" class="alertas-container">
                    <div class="loading-spinner">Cargando alertas...</div>
                </div>
            </div>
        </div>

        <!-- Últimas Órdenes -->
        <div class="table-container">
            <div class="section-header">
                <h2 class="section-title">📋 Últimas Órdenes</h2>
                <a href="ventas.html" class="btn-link">Ver todas →</a>
            </div>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Servicio</th>
                        <th>Cantidad</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody id="ultimas-ordenes-body">
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 20px;">
                            Cargando...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Accesos Rápidos -->
        <div class="quick-actions">
            <h2 class="section-title">⚡ Accesos Rápidos</h2>
            <div class="quick-actions-grid">
                <a href="ventas.html" class="quick-action-card">
                    <div class="quick-action-icon">➕</div>
                    <h3>Nueva Orden</h3>
                    <p>Crear una nueva orden de impresión</p>
                </a>
                <a href="productos.html" class="quick-action-card">
                    <div class="quick-action-icon">🖨️</div>
                    <h3>Gestionar Servicios</h3>
                    <p>Ver y editar servicios de impresión</p>
                </a>
                <a href="proveedores.html" class="quick-action-card">
                    <div class="quick-action-icon">📦</div>
                    <h3>Proveedores</h3>
                    <p>Administrar proveedores</p>
                </a>
                <a href="estadisticas.html" class="quick-action-card">
                    <div class="quick-action-icon">📊</div>
                    <h3>Ver Reportes</h3>
                    <p>Estadísticas y análisis detallados</p>
                </a>
            </div>
        </div>
    </div>

    <script src="../assets/js/theme.js"></script>
    <script src="../assets/js/auth.js"></script>
    <script src="../assets/js/navigation.js"></script>
    <script src="../assets/js/dashboard.js"></script>
</body>
</html>
```

### pages/estadisticas.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estadísticas - PymeSmart</title>
    <link rel="stylesheet" href="../assets/css/main.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
</head>
<body>
    <nav class="top-navbar">
        <a href="dashboard.html" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span>Inicio</span>
        </a>
        <a href="usuarios.html" class="nav-item">
            <span class="nav-icon">👥</span>
            <span>Empleados</span>
        </a>
        <a href="proveedores.html" class="nav-item">
            <span class="nav-icon">📦</span>
            <span>Proveedores</span>
        </a>
        <a href="productos.html" class="nav-item">
            <span class="nav-icon">🖨️</span>
            <span>Servicios</span>
        </a>
        <a href="ventas.html" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>Órdenes</span>
        </a>
        <a href="estadisticas.html" class="nav-item active">
            <span class="nav-icon">📊</span>
            <span>Estadísticas</span>
        </a>
        <a href="#" id="logout-btn" class="nav-item logout">
            <span class="nav-icon">🚪</span>
            <span>Cerrar Sesión</span>
        </a>
    </nav>

    <div class="content">
        <div class="page-header">
            <h1>📊 Estadísticas y Reportes</h1>
            <div class="filter-buttons">
                <button class="btn-filter active" data-type="daily">📅 Hoy</button>
                <button class="btn-filter" data-type="monthly">📆 Este Mes</button>
                <button class="btn-filter" data-type="yearly">📅 Este Año</button>
            </div>
        </div>

        <!-- Tarjetas de Resumen -->
        <div class="stats-cards-container">
            <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                    <h3>Ingresos Totales</h3>
                    <p class="stat-value" id="total-ingresos">$0.00</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📦</div>
                <div class="stat-content">
                    <h3>Unidades Vendidas</h3>
                    <p class="stat-value" id="total-unidades">0</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📋</div>
                <div class="stat-content">
                    <h3>Total de Órdenes</h3>
                    <p class="stat-value" id="total-ordenes">0</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-content">
                    <h3>Promedio por Orden</h3>
                    <p class="stat-value" id="promedio-orden">$0.00</p>
                </div>
            </div>
        </div>

        <!-- Gráficas -->
        <div class="charts-container">
            <div class="chart-wrapper">
                <div class="chart-header">
                    <h2>📈 Ventas por Servicio (Ingresos)</h2>
                </div>
                <canvas id="chart-ingresos"></canvas>
            </div>
            
            <div class="chart-wrapper">
                <div class="chart-header">
                    <h2>🍰 Distribución de Ventas</h2>
                </div>
                <canvas id="chart-pastel"></canvas>
            </div>
        </div>

        <div class="charts-container">
            <div class="chart-wrapper">
                <div class="chart-header">
                    <h2>📊 Unidades Vendidas por Servicio</h2>
                </div>
                <canvas id="chart-unidades"></canvas>
            </div>
            
            <div class="chart-wrapper">
                <div class="chart-header">
                    <h2>📉 Comparativa de Rendimiento</h2>
                </div>
                <canvas id="chart-comparativa"></canvas>
            </div>
        </div>

        <!-- Tabla de Detalles -->
        <div class="table-container">
            <h2 class="section-title">📋 Detalle de Ventas</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Servicio</th>
                        <th>Unidades Vendidas</th>
                        <th>Ingresos</th>
                        <th>Órdenes</th>
                        <th>Promedio/Orden</th>
                    </tr>
                </thead>
                <tbody id="estadisticas-table-body">
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 20px;">
                            Cargando datos...
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <script src="../assets/js/theme.js"></script>
    <script src="../assets/js/auth.js"></script>
    <script src="../assets/js/estadisticas.js"></script>
</body>
</html>
```

### pages/productos.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Servicios - PymeSmart</title>
    <link rel="stylesheet" href="../assets/css/main.css">
</head>
<body>
    <nav class="top-navbar">
        <a href="dashboard.html" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span>Inicio</span>
        </a>
        <a href="usuarios.html" class="nav-item">
            <span class="nav-icon">👥</span>
            <span>Empleados</span>
        </a>
        <a href="proveedores.html" class="nav-item">
            <span class="nav-icon">📦</span>
            <span>Proveedores</span>
        </a>
        <a href="productos.html" class="nav-item active">
            <span class="nav-icon">🖨️</span>
            <span>Servicios</span>
        </a>
        <a href="ventas.html" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>Órdenes</span>
        </a>
        <a href="estadisticas.html" class="nav-item">
            <span class="nav-icon">📊</span>
            <span>Estadísticas</span>
        </a>
        <a href="#" id="logout-btn" class="nav-item logout">
            <span class="nav-icon">🚪</span>
            <span>Cerrar Sesión</span>
        </a>
    </nav>

    <div class="content">
        <div class="page-header">
            <h1>Gestión de Servicios de Impresión</h1>
            <button id="agregar-producto" class="btn-primary">+ Agregar Servicio</button>
        </div>
        
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Proveedor</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="productos-table-body">
                    <!-- Datos cargados dinámicamente -->
                </tbody>
            </table>
        </div>
    </div>

    <script src="../assets/js/theme.js"></script>
    <script src="../assets/js/auth.js"></script>
    <script src="../assets/js/utils.js"></script>
    <script src="../assets/js/productos.js"></script>
</body>
</html>
```

### pages/proveedores.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Proveedores - PymeSmart</title>
    <link rel="stylesheet" href="../assets/css/main.css">
</head>
<body>
    <nav class="top-navbar">
        <a href="dashboard.html" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span>Inicio</span>
        </a>
        <a href="usuarios.html" class="nav-item">
            <span class="nav-icon">👥</span>
            <span>Empleados</span>
        </a>
        <a href="proveedores.html" class="nav-item active">
            <span class="nav-icon">📦</span>
            <span>Proveedores</span>
        </a>
        <a href="productos.html" class="nav-item">
            <span class="nav-icon">🖨️</span>
            <span>Servicios</span>
        </a>
        <a href="ventas.html" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>Órdenes</span>
        </a>
        <a href="estadisticas.html" class="nav-item">
            <span class="nav-icon">📊</span>
            <span>Estadísticas</span>
        </a>
        <a href="#" id="logout-btn" class="nav-item logout">
            <span class="nav-icon">🚪</span>
            <span>Cerrar Sesión</span>
        </a>
    </nav>

    <div class="content">
        <div class="page-header">
            <h1>Gestión de Proveedores de Materiales</h1>
            <button id="agregar-proveedor" class="btn-primary">+ Agregar Proveedor</button>
        </div>
        
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Contacto</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="proveedores-table-body">
                    <!-- Datos cargados dinámicamente -->
                </tbody>
            </table>
        </div>
    </div>

    <script src="../assets/js/theme.js"></script>
    <script src="../assets/js/auth.js"></script>
    <script src="../assets/js/proveedores.js"></script>
</body>
</html>
```

### pages/usuarios.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Empleados - PymeSmart</title>
    <link rel="stylesheet" href="../assets/css/main.css">
</head>
<body>
    <nav class="top-navbar">
        <a href="dashboard.html" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span>Inicio</span>
        </a>
        <a href="usuarios.html" class="nav-item active">
            <span class="nav-icon">👥</span>
            <span>Empleados</span>
        </a>
        <a href="proveedores.html" class="nav-item">
            <span class="nav-icon">📦</span>
            <span>Proveedores</span>
        </a>
        <a href="productos.html" class="nav-item">
            <span class="nav-icon">🖨️</span>
            <span>Servicios</span>
        </a>
        <a href="ventas.html" class="nav-item">
            <span class="nav-icon">📋</span>
            <span>Órdenes</span>
        </a>
        <a href="estadisticas.html" class="nav-item">
            <span class="nav-icon">📊</span>
            <span>Estadísticas</span>
        </a>
        <a href="#" id="logout-btn" class="nav-item logout">
            <span class="nav-icon">🚪</span>
            <span>Cerrar Sesión</span>
        </a>
    </nav>

    <div class="content">
        <div class="page-header">
            <h1>Gestión de Empleados</h1>
            <button id="agregar-usuario" class="btn-primary">+ Agregar Empleado</button>
        </div>
        
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Correo</th>
                        <th>Rol</th>
                        <th>Usuario</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="usuarios-table-body">
                    <!-- Datos cargados dinámicamente -->
                </tbody>
            </table>
        </div>
    </div>

    <script src="../assets/js/theme.js"></script>
    <script src="../assets/js/auth.js"></script>
    <script src="../assets/js/usuarios.js"></script>
</body>
</html>
```

### pages/ventas.html
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestión de Órdenes - PymeSmart</title>
    <link rel="stylesheet" href="../assets/css/main.css">
</head>
<body>
    <nav class="top-navbar">
        <a href="dashboard.html" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span>Inicio</span>
        </a>
        <a href="usuarios.html" class="nav-item">
            <span class="nav-icon">👥</span>
            <span>Empleados</span>
        </a>
        <a href="proveedores.html" class="nav-item">
            <span class="nav-icon">📦</span>
            <span>Proveedores</span>
        </a>
        <a href="productos.html" class="nav-item">
            <span class="nav-icon">🖨️</span>
            <span>Servicios</span>
        </a>
        <a href="ventas.html" class="nav-item active">
            <span class="nav-icon">📋</span>
            <span>Órdenes</span>
        </a>
        <a href="estadisticas.html" class="nav-item">
            <span class="nav-icon">📊</span>
            <span>Estadísticas</span>
        </a>
        <a href="#" id="logout-btn" class="nav-item logout">
            <span class="nav-icon">🚪</span>
            <span>Cerrar Sesión</span>
        </a>
    </nav>

    <div class="content">
        <div class="page-header">
            <h1>Gestión de Órdenes de Impresión</h1>
            <button id="agregar-venta" class="btn-primary">+ Agregar Orden</button>
        </div>
        
        <!-- Búsqueda y Filtros -->
        <div class="search-container">
            <span class="search-icon">🔍</span>
            <input type="text" id="search-ventas" class="search-input" placeholder="Buscar por servicio, ID o cantidad...">
        </div>
        
        <div class="date-filters">
            <div class="date-filter-group">
                <label>Desde:</label>
                <input type="date" id="fecha-desde" class="date-filter-input">
            </div>
            <div class="date-filter-group">
                <label>Hasta:</label>
                <input type="date" id="fecha-hasta" class="date-filter-input">
            </div>
            <button id="aplicar-filtros" class="btn-primary">Aplicar Filtros</button>
            <button id="limpiar-filtros" class="btn-secondary">Limpiar</button>
        </div>
        
        <div class="table-container">
            <table class="data-table" id="ventas-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Servicio</th>
                        <th>Cantidad</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="ventas-table-body">
                    <!-- Datos cargados dinámicamente -->
                </tbody>
            </table>
        </div>
    </div>

    <script src="../assets/js/theme.js"></script>
    <script src="../assets/js/auth.js"></script>
    <script src="../assets/js/utils.js"></script>
    <script src="../assets/js/ventas.js"></script>
</body>
</html>
```

---

## 📝 NOTAS FINALES

Este README contiene todo el código fuente del proyecto PymeSmart. Los archivos más extensos (como `main.css` y algunos archivos JavaScript) están referenciados con notas indicando su ubicación en el proyecto, ya que superan las 1000 líneas de código.

**Estructura del Proyecto:**
- `api/` - APIs PHP del backend
- `assets/css/` - Hojas de estilo
- `assets/js/` - Scripts JavaScript
- `config/` - Archivos de configuración
- `pages/` - Páginas HTML
- `database.sql` - Script de base de datos

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

---

*Documento generado con todo el código del proyecto PymeSmart - Sistema de Gestión para Imprentas*

