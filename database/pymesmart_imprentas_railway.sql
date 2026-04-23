-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1:3307
-- Tiempo de generación: 23-04-2026 a las 02:33:57
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Importacion cloud (Railway): desactiva FKs durante recreacion de tablas
SET FOREIGN_KEY_CHECKS = 0;

/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pymesmart_imprentas`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ordenes_impresion`
--

CREATE TABLE `ordenes_impresion` (
  `id` int(11) NOT NULL,
  `servicio_id` int(11) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `ordenes_impresion`
--

INSERT INTO `ordenes_impresion` (`id`, `servicio_id`, `cantidad`, `fecha`) VALUES
(1, 1, 12, '2026-04-20 18:54:08'),
(2, 2, 18, '2026-04-19 18:54:08'),
(3, 3, 25, '2026-04-18 18:54:08'),
(4, 4, 7, '2026-04-17 18:54:08'),
(5, 5, 6, '2026-04-16 18:54:08'),
(6, 6, 4, '2026-04-15 18:54:08'),
(7, 7, 20, '2026-04-14 18:54:08'),
(8, 8, 9, '2026-04-13 18:54:08'),
(9, 1, 10, '2026-04-11 18:54:08'),
(10, 2, 14, '2026-04-09 18:54:08'),
(11, 3, 17, '2026-04-07 18:54:08'),
(12, 4, 5, '2026-04-05 18:54:08'),
(13, 5, 8, '2026-04-03 18:54:08'),
(14, 6, 3, '2026-04-01 18:54:08'),
(15, 7, 22, '2026-03-30 18:54:08'),
(16, 8, 6, '2026-03-28 18:54:08'),
(17, 1, 16, '2026-03-20 18:54:08'),
(18, 2, 19, '2026-03-15 18:54:08'),
(19, 3, 13, '2026-03-10 18:54:08'),
(20, 4, 9, '2026-03-04 18:54:08'),
(21, 5, 4, '2026-02-27 18:54:08'),
(22, 6, 7, '2026-02-19 18:54:08'),
(23, 7, 28, '2026-02-06 18:54:08'),
(24, 8, 11, '2026-01-23 18:54:08'),
(25, 1, 21, '2026-01-09 18:54:08'),
(26, 2, 9, '2025-12-21 18:54:08'),
(27, 3, 15, '2025-11-26 18:54:08'),
(28, 4, 6, '2025-10-30 18:54:08'),
(29, 5, 10, '2025-10-02 18:54:08'),
(30, 6, 5, '2025-08-28 18:54:08'),
(31, 7, 31, '2025-07-15 18:54:08'),
(32, 8, 12, '2025-06-05 18:54:08'),
(33, 5, 70, '2026-04-21 19:01:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `proveedores`
--

CREATE TABLE `proveedores` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `proveedores`
--

INSERT INTO `proveedores` (`id`, `nombre`, `contacto`, `telefono`, `email`) VALUES
(1, 'Papeles del Norte', 'Luis Martinez', '5512345678', 'ventas@papelesnorte.com'),
(2, 'Tintas Pro', 'Ana Gomez', '5598765432', 'contacto@tintaspro.com'),
(3, 'Empaques MX', 'Carlos Ruiz', '5544556677', 'info@empaquesmx.com'),
(4, 'Plotter Supply', 'Mariana Leon', '5533112299', 'soporte@plottersupply.com');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `servicios_impresion`
--

CREATE TABLE `servicios_impresion` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) NOT NULL DEFAULT 0,
  `proveedor_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `servicios_impresion`
--

INSERT INTO `servicios_impresion` (`id`, `nombre`, `descripcion`, `precio`, `stock`, `proveedor_id`) VALUES
(1, 'Tarjetas de presentacion', 'Impresion full color en cartulina', 250.00, 200, 1),
(2, 'Volantes A5', 'Volantes promocionales a color', 180.00, 160, 1),
(3, 'Etiquetas adhesivas', 'Etiquetas para empaque', 95.00, 140, 2),
(4, 'Lona publicitaria 1x1', 'Lona en alta resolucion', 320.00, 100, 2),
(5, 'Cajas personalizadas', 'Caja microcorrugada impresa', 450.00, 20, 3),
(6, 'Catalogos grapados', 'Catalogo de 12 paginas', 520.00, 80, 4),
(7, 'Stickers troquelados', 'Impresion en vinil adhesivo', 130.00, 170, 2),
(8, 'Recetarios autocopiantes', 'Talonarios para negocios', 290.00, 110, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('Administrador','Vendedor') NOT NULL DEFAULT 'Vendedor',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `correo`, `username`, `password`, `rol`, `created_at`) VALUES
(1, 'Administrador Principal', 'admin@pymesmart.com', 'admin', '$2y$10$nogy/yoL4nMMh574knMf1u.ltFuEZsguGjQR.TkQ3p3sPM6QvccVK', 'Administrador', '2026-04-21 18:54:08'),
(2, 'Jesús Pérez', 'vendedor@pymesmart.com', 'vendedor', '$2y$10$nogy/yoL4nMMh574knMf1u.ltFuEZsguGjQR.TkQ3p3sPM6QvccVK', 'Vendedor', '2026-04-21 18:54:08');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `ordenes_impresion`
--
ALTER TABLE `ordenes_impresion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `servicio_id` (`servicio_id`);

--
-- Indices de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `servicios_impresion`
--
ALTER TABLE `servicios_impresion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `proveedor_id` (`proveedor_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `correo` (`correo`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `ordenes_impresion`
--
ALTER TABLE `ordenes_impresion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT de la tabla `proveedores`
--
ALTER TABLE `proveedores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `servicios_impresion`
--
ALTER TABLE `servicios_impresion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `ordenes_impresion`
--
ALTER TABLE `ordenes_impresion`
  ADD CONSTRAINT `ordenes_impresion_ibfk_1` FOREIGN KEY (`servicio_id`) REFERENCES `servicios_impresion` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `servicios_impresion`
--
ALTER TABLE `servicios_impresion`
  ADD CONSTRAINT `servicios_impresion_ibfk_1` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores` (`id`) ON DELETE SET NULL;
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;

