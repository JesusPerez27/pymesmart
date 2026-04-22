/**
 * Gestión de Órdenes de Impresión
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = '../api/ventas.php';
    let allVentas = []; // Guardar todas las ventas para búsqueda
    
    const fetchVentas = async (fechaDesde = null, fechaHasta = null) => {
        try {
            showLoading('ventas-table-body');
            let url = `${API_BASE}?action=read`;
            if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
            if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            const ventas = await response.json();
            if (Array.isArray(ventas)) {
                allVentas = ventas;
                renderVentas(ventas);
            } else {
                console.error('Error: Los datos no son un array', ventas);
                renderVentas([]);
            }
        } catch (error) {
            console.error('Error al cargar órdenes:', error);
            ToastNotification.error('Error al cargar las órdenes de impresión.');
            renderVentas([]);
        }
    };

    const renderVentas = (ventas) => {
        const tbody = document.getElementById("ventas-table-body");
        tbody.innerHTML = "";
        ventas.forEach(venta => {
            const row = document.createElement("tr");
            const fecha = new Date(venta.fecha);
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            row.innerHTML = `
                <td>${venta.id}</td>
                <td>${venta.producto || 'N/A'}</td>
                <td>${formatNumber(venta.cantidad)}</td>
                <td>${formatDate(venta.fecha)}</td>
                <td class="table-actions">
                    <button class="btn-edit" data-id="${venta.id}">Editar</button>
                    <button class="btn-delete" data-id="${venta.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll(".btn-edit").forEach(button => {
            button.addEventListener("click", () => openEditVentaModal(button.dataset.id));
        });

        document.querySelectorAll(".btn-delete").forEach(button => {
            button.addEventListener("click", () => deleteVenta(button.dataset.id));
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

    const fetchProductos = async (selectedId = null) => {
        const response = await fetch(`${API_BASE}?action=fetch_products`);
        const servicios = await response.json();
        const select = document.querySelector("select[name='servicio_id']");
        if (select) {
            select.innerHTML = servicios.map(servicio => `
                <option value="${servicio.id}" ${selectedId == servicio.id ? "selected" : ""}>
                    ${servicio.nombre}
                </option>
            `).join("");
        }
    };

    const openAddVentaModal = () => {
        const content = `
            <h2>Agregar Orden de Impresión</h2>
            <form id="add-venta-form">
                <label>Servicio de Impresión:
                    <select name="servicio_id" required>
                        <!-- Opciones cargadas dinámicamente -->
                    </select>
                </label>
                <label>Cantidad: <input type="number" name="cantidad" required></label>
                <button type="submit" class="btn-primary">Guardar</button>
            </form>
        `;
        openModal(content);
        fetchProductos();
        document.getElementById("add-venta-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const response = await fetch(`${API_BASE}?action=create`, {
                method: "POST",
                body: formData
            });
            const success = await handleApiResponse(
                response,
                (data) => {
                    document.querySelector(".modal").remove();
                    ToastNotification.success('Orden creada correctamente');
                    fetchVentas();
                    checkLowStock(data.lowStockProduct);
                },
                () => {}
            );
        });
    };

    const openEditVentaModal = (id) => {
        fetch(`${API_BASE}?action=read&id=${id}`)
            .then(response => response.json())
            .then(venta => {
                const content = `
                    <h2>Editar Orden de Impresión</h2>
                    <form id="edit-venta-form">
                        <input type="hidden" name="id" value="${venta.id}">
                        <label>Servicio de Impresión:
                            <select name="servicio_id" required>
                                <!-- Opciones cargadas dinámicamente -->
                            </select>
                        </label>
                        <label>Cantidad: <input type="number" name="cantidad" value="${venta.cantidad}" required></label>
                        <button type="submit" class="btn-primary">Guardar Cambios</button>
                    </form>
                `;
                openModal(content);
                fetchProductos(venta.servicio_id);
                document.getElementById("edit-venta-form").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const response = await fetch(`${API_BASE}?action=update`, {
                        method: "POST",
                        body: formData
                    });
                    const success = await handleApiResponse(
                        response,
                        (data) => {
                            document.querySelector(".modal").remove();
                            ToastNotification.success('Orden actualizada correctamente');
                            fetchVentas();
                            checkLowStock(data.lowStockProduct);
                        },
                        () => {}
                    );
                });
            });
    };

    const deleteVenta = async (id) => {
        if (confirmDelete("¿Estás seguro de que deseas eliminar esta orden de impresión?")) {
            const formData = new FormData();
            formData.append('id', id);
            
            const response = await fetch(`${API_BASE}?action=delete`, {
                method: "POST",
                body: formData
            });
            
            const success = await handleApiResponse(
                response,
                () => {
                    ToastNotification.success('Orden eliminada correctamente');
                    fetchVentas();
                },
                () => {}
            );
        }
    };

    const checkLowStock = (lowStockProduct) => {
        if (lowStockProduct) {
            ToastNotification.warning(
                `Stock bajo: "${lowStockProduct.nombre}" tiene ${lowStockProduct.stock} unidades. ¡Considera reabastecer!`,
                5000
            );
        }
    };

    // Búsqueda en tiempo real
    setupTableSearch('search-ventas', 'ventas-table');

    // Filtros de fecha
    document.getElementById('aplicar-filtros')?.addEventListener('click', () => {
        const fechaDesde = document.getElementById('fecha-desde').value;
        const fechaHasta = document.getElementById('fecha-hasta').value;
        fetchVentas(fechaDesde || null, fechaHasta || null);
    });

    document.getElementById('limpiar-filtros')?.addEventListener('click', () => {
        document.getElementById('fecha-desde').value = '';
        document.getElementById('fecha-hasta').value = '';
        document.getElementById('search-ventas').value = '';
        fetchVentas();
    });

    document.getElementById("agregar-venta").addEventListener("click", openAddVentaModal);
    fetchVentas();
});

