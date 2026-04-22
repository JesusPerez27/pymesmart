USE pymesmart_imprentas;

-- Proveedores
INSERT INTO proveedores (nombre, contacto, telefono, email) VALUES
('Papeles del Norte', 'Luis Martinez', '5512345678', 'ventas@papelesnorte.com'),
('Tintas Pro', 'Ana Gomez', '5598765432', 'contacto@tintaspro.com'),
('Empaques MX', 'Carlos Ruiz', '5544556677', 'info@empaquesmx.com');

-- Servicios / productos
INSERT INTO servicios_impresion (nombre, descripcion, precio, stock, proveedor_id) VALUES
('Tarjetas de presentacion', 'Impresion full color en cartulina', 250.00, 120, 1),
('Volantes A5', 'Volantes promocionales a color', 180.00, 80, 1),
('Etiquetas adhesivas', 'Etiquetas para empaque', 95.00, 40, 2),
('Lona publicitaria 1x1', 'Lona en alta resolucion', 320.00, 20, 2),
('Cajas personalizadas', 'Caja microcorrugada impresa', 450.00, 10, 3);

-- Ordenes de prueba
INSERT INTO ordenes_impresion (servicio_id, cantidad, fecha) VALUES
(1, 15, NOW() - INTERVAL 10 DAY),
(2, 12, NOW() - INTERVAL 8 DAY),
(3, 18, NOW() - INTERVAL 6 DAY),
(1, 20, NOW() - INTERVAL 4 DAY),
(4, 5,  NOW() - INTERVAL 3 DAY),
(2, 25, NOW() - INTERVAL 2 DAY),
(5, 4,  NOW() - INTERVAL 1 DAY),
(3, 10, NOW());
