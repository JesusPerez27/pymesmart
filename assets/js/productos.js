/**
 * Gestión de Servicios de Impresión
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = '../api/productos.php';
    
    const fetchProductos = async () => {
        try {
            showLoading('productos-table-body');
            const response = await fetch(`${API_BASE}?action=read`);
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            const servicios = await response.json();
            if (Array.isArray(servicios)) {
                renderProductos(servicios);
                checkStockAlerts(servicios);
            } else {
                console.error('Error: Los datos no son un array', servicios);
                renderProductos([]);
            }
        } catch (error) {
            console.error('Error al cargar servicios:', error);
            ToastNotification.error('Error al cargar los servicios de impresión.');
            renderProductos([]);
        }
    };

    const getStockClass = (stock) => {
        if (stock === 0) return 'stock-zero';
        if (stock < 50) return 'stock-low';
        return 'stock-ok';
    };

    const getStockIcon = (stock) => {
        if (stock === 0) return '🔴';
        if (stock < 50) return '⚠️';
        return '✅';
    };

    const renderProductos = (servicios) => {
        const tbody = document.getElementById("productos-table-body");
        tbody.innerHTML = "";
        
        if (servicios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay servicios registrados</td></tr>';
            return;
        }
        
        servicios.forEach(servicio => {
            const row = document.createElement("tr");
            const stockClass = getStockClass(servicio.stock);
            const stockIcon = getStockIcon(servicio.stock);
            
            row.className = stockClass;
            row.innerHTML = `
                <td>${servicio.id}</td>
                <td>${servicio.nombre}</td>
                <td>${servicio.descripcion || "N/A"}</td>
                <td>${formatCurrency(servicio.precio)}</td>
                <td class="stock-cell ${stockClass}">
                    <span class="stock-icon">${stockIcon}</span>
                    <span class="stock-value">${formatNumber(servicio.stock)}</span>
                    ${servicio.stock < 50 ? '<span class="stock-alert">Stock bajo</span>' : ''}
                </td>
                <td>${servicio.proveedor || "N/A"}</td>
                <td class="table-actions">
                    <button class="btn-edit" data-id="${servicio.id}">Editar</button>
                    <button class="btn-delete" data-id="${servicio.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll(".btn-edit").forEach(button => {
            button.addEventListener("click", () => openEditProductoModal(button.dataset.id));
        });

        document.querySelectorAll(".btn-delete").forEach(button => {
            button.addEventListener("click", () => deleteProducto(button.dataset.id));
        });
    };

    const openModal = (content) => {
        const modal = document.createElement("div");
        modal.classList.add("modal");
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                ${content}
                <button class="modal-close">×</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
        modal.querySelector(".modal-overlay").addEventListener("click", () => modal.remove());
    };

    const fetchProveedores = async (selectedId = null) => {
        const response = await fetch(`${API_BASE}?action=fetch_providers`);
        const proveedores = await response.json();
        const select = document.querySelector("select[name='proveedor_id']");
        if (select) {
            select.innerHTML = proveedores.map(proveedor => `
                <option value="${proveedor.id}" ${selectedId == proveedor.id ? "selected" : ""}>
                    ${proveedor.nombre}
                </option>
            `).join("");
        }
    };

    const openAddProductoModal = () => {
        const content = `
            <h2>Agregar Servicio de Impresión</h2>
            <form id="add-producto-form">
                <label>Nombre: <input type="text" name="nombre" required></label>
                <label>Descripción: <textarea name="descripcion"></textarea></label>
                <label>Precio: <input type="number" step="0.01" name="precio" required></label>
                <label>Stock: <input type="number" name="stock" required></label>
                <label>Proveedor:
                    <select name="proveedor_id" required>
                        <!-- Opciones cargadas dinámicamente -->
                    </select>
                </label>
                <button type="submit" class="btn-primary">Guardar</button>
            </form>
        `;
        openModal(content);
        fetchProveedores();
        document.getElementById("add-producto-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const response = await fetch(`${API_BASE}?action=create`, {
                method: "POST",
                body: formData
            });
            
            const success = await handleApiResponse(
                response,
                () => {
                    document.querySelector(".modal").remove();
                    ToastNotification.success('Servicio creado correctamente');
                    fetchProductos();
                },
                () => {}
            );
        });
    };

    const openEditProductoModal = (id) => {
        fetch(`${API_BASE}?action=read&id=${id}`)
            .then(response => response.json())
            .then(producto => {
                const content = `
                    <h2>Editar Servicio de Impresión</h2>
                    <form id="edit-producto-form">
                        <input type="hidden" name="id" value="${producto.id}">
                        <label>Nombre: <input type="text" name="nombre" value="${producto.nombre}" required></label>
                        <label>Descripción: <textarea name="descripcion">${producto.descripcion || ""}</textarea></label>
                        <label>Precio: <input type="number" step="0.01" name="precio" value="${producto.precio}" required></label>
                        <label>Stock: <input type="number" name="stock" value="${producto.stock}" required></label>
                        <label>Proveedor:
                            <select name="proveedor_id" required>
                                <!-- Opciones cargadas dinámicamente -->
                            </select>
                        </label>
                        <button type="submit" class="btn-primary">Guardar Cambios</button>
                    </form>
                `;
                openModal(content);
                fetchProveedores(producto.proveedor_id);
                document.getElementById("edit-producto-form").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const response = await fetch(`${API_BASE}?action=update`, {
                        method: "POST",
                        body: formData
                    });
                    
                    const success = await handleApiResponse(
                        response,
                        () => {
                            document.querySelector(".modal").remove();
                            ToastNotification.success('Servicio actualizado correctamente');
                            fetchProductos();
                        },
                        () => {}
                    );
                });
            });
    };

    const checkStockAlerts = (servicios) => {
        const sinStock = servicios.filter(s => s.stock === 0);
        const stockBajo = servicios.filter(s => s.stock > 0 && s.stock < 50);
        
        if (sinStock.length > 0) {
            ToastNotification.error(
                `⚠️ ${sinStock.length} producto(s) sin stock: ${sinStock.map(s => s.nombre).join(', ')}`,
                6000
            );
        } else if (stockBajo.length > 0) {
            ToastNotification.warning(
                `⚠️ ${stockBajo.length} producto(s) con stock bajo (< 50 unidades)`,
                5000
            );
        }
    };

    const deleteProducto = async (id) => {
        if (confirmDelete("¿Estás seguro de que deseas eliminar este servicio de impresión?")) {
            const formData = new FormData();
            formData.append('id', id);
            
            const response = await fetch(`${API_BASE}?action=delete`, {
                method: "POST",
                body: formData
            });
            
            const success = await handleApiResponse(
                response,
                () => {
                    ToastNotification.success('Servicio eliminado correctamente');
                    fetchProductos();
                },
                () => {}
            );
        }
    };


    document.getElementById("agregar-producto").addEventListener("click", openAddProductoModal);
    fetchProductos();
});

