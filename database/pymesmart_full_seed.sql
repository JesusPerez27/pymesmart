-- PymeSmart - Script completo de esquema + datos de prueba (Railway / MySQL 8+)
-- Ejecutar en DBeaver con la base seleccionada (por ejemplo: railway)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `ordenes_impresion`;
DROP TABLE IF EXISTS `servicios_impresion`;
DROP TABLE IF EXISTS `proveedores`;
DROP TABLE IF EXISTS `usuarios`;

CREATE TABLE `usuarios` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `correo` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `rol` ENUM('Administrador','Vendedor') NOT NULL DEFAULT 'Vendedor',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_correo` (`correo`),
  UNIQUE KEY `uq_usuarios_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `proveedores` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `contacto` VARCHAR(100) DEFAULT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `servicios_impresion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  `precio` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `proveedor_id` INT DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_servicios_proveedor` (`proveedor_id`),
  CONSTRAINT `fk_servicios_proveedor`
    FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ordenes_impresion` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `servicio_id` INT NOT NULL,
  `cantidad` INT NOT NULL DEFAULT 1,
  `fecha` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ordenes_servicio` (`servicio_id`),
  KEY `idx_ordenes_fecha` (`fecha`),
  CONSTRAINT `fk_ordenes_servicio`
    FOREIGN KEY (`servicio_id`) REFERENCES `servicios_impresion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuarios (misma contraseña hash que usabas en local: admin123)
INSERT INTO `usuarios` (`nombre`, `correo`, `username`, `password`, `rol`) VALUES
('Administrador Principal', 'admin@pymesmart.com', 'admin', '$2y$10$nogy/yoL4nMMh574knMf1u.ltFuEZsguGjQR.TkQ3p3sPM6QvccVK', 'Administrador'),
('Vendedor Demo', 'vendedor@pymesmart.com', 'vendedor', '$2y$10$nogy/yoL4nMMh574knMf1u.ltFuEZsguGjQR.TkQ3p3sPM6QvccVK', 'Vendedor');

INSERT INTO `proveedores` (`nombre`, `contacto`, `telefono`, `email`) VALUES
('Papeles del Norte', 'Luis Martinez', '5512345678', 'ventas@papelesnorte.com'),
('Tintas Pro', 'Ana Gomez', '5598765432', 'contacto@tintaspro.com'),
('Empaques MX', 'Carlos Ruiz', '5544556677', 'info@empaquesmx.com'),
('Plotter Supply', 'Mariana Leon', '5533112299', 'soporte@plottersupply.com');

INSERT INTO `servicios_impresion` (`nombre`, `descripcion`, `precio`, `stock`, `proveedor_id`) VALUES
('Tarjetas de presentacion', 'Impresion full color en cartulina', 250.00, 200, 1),
('Volantes A5', 'Volantes promocionales a color', 180.00, 160, 1),
('Etiquetas adhesivas', 'Etiquetas para empaque', 95.00, 140, 2),
('Lona publicitaria 1x1', 'Lona en alta resolucion', 320.00, 100, 2),
('Cajas personalizadas', 'Caja microcorrugada impresa', 450.00, 90, 3),
('Catalogos grapados', 'Catalogo de 12 paginas', 520.00, 80, 4),
('Stickers troquelados', 'Impresion en vinil adhesivo', 130.00, 170, 2),
('Recetarios autocopiantes', 'Talonarios para negocios', 290.00, 110, 3);

-- Ordenes con fechas variadas (dias recientes, semanas y meses)
INSERT INTO `ordenes_impresion` (`servicio_id`, `cantidad`, `fecha`) VALUES
(1, 12, NOW() - INTERVAL 1 DAY),
(2, 18, NOW() - INTERVAL 2 DAY),
(3, 25, NOW() - INTERVAL 3 DAY),
(4, 7,  NOW() - INTERVAL 4 DAY),
(5, 6,  NOW() - INTERVAL 5 DAY),
(6, 4,  NOW() - INTERVAL 6 DAY),
(7, 20, NOW() - INTERVAL 7 DAY),
(8, 9,  NOW() - INTERVAL 8 DAY),
(1, 10, NOW() - INTERVAL 10 DAY),
(2, 14, NOW() - INTERVAL 12 DAY),
(3, 17, NOW() - INTERVAL 14 DAY),
(4, 5,  NOW() - INTERVAL 16 DAY),
(5, 8,  NOW() - INTERVAL 18 DAY),
(6, 3,  NOW() - INTERVAL 20 DAY),
(7, 22, NOW() - INTERVAL 22 DAY),
(8, 6,  NOW() - INTERVAL 24 DAY),
(1, 16, NOW() - INTERVAL 32 DAY),
(2, 19, NOW() - INTERVAL 37 DAY),
(3, 13, NOW() - INTERVAL 42 DAY),
(4, 9,  NOW() - INTERVAL 48 DAY),
(5, 4,  NOW() - INTERVAL 53 DAY),
(6, 7,  NOW() - INTERVAL 61 DAY),
(7, 28, NOW() - INTERVAL 74 DAY),
(8, 11, NOW() - INTERVAL 88 DAY),
(1, 21, NOW() - INTERVAL 102 DAY),
(2, 9,  NOW() - INTERVAL 121 DAY),
(3, 15, NOW() - INTERVAL 146 DAY),
(4, 6,  NOW() - INTERVAL 173 DAY),
(5, 10, NOW() - INTERVAL 201 DAY),
(6, 5,  NOW() - INTERVAL 236 DAY),
(7, 31, NOW() - INTERVAL 280 DAY),
(8, 12, NOW() - INTERVAL 320 DAY);

SET FOREIGN_KEY_CHECKS = 1;
