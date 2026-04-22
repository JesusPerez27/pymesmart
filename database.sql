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

