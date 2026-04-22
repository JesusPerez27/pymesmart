/**
 * Gestión de Proveedores
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = '../api/proveedores.php';
    
    const fetchProveedores = async () => {
        try {
            const response = await fetch(`${API_BASE}?action=read`);
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            const proveedores = await response.json();
            if (Array.isArray(proveedores)) {
                renderProveedores(proveedores);
            } else {
                console.error('Error: Los datos no son un array', proveedores);
                renderProveedores([]);
            }
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            alert('Error al cargar los proveedores. Verifica la consola para más detalles.');
        }
    };

    const renderProveedores = (proveedores) => {
        const tbody = document.getElementById("proveedores-table-body");
        tbody.innerHTML = "";
        proveedores.forEach(proveedor => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${proveedor.id}</td>
                <td>${proveedor.nombre}</td>
                <td>${proveedor.contacto || "N/A"}</td>
                <td>${proveedor.telefono || "N/A"}</td>
                <td>${proveedor.email || "N/A"}</td>
                <td>
                    <button class="btn-edit" data-id="${proveedor.id}">Editar</button>
                    <button class="btn-delete" data-id="${proveedor.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll(".btn-edit").forEach(button => {
            button.addEventListener("click", () => openEditProveedorModal(button.dataset.id));
        });

        document.querySelectorAll(".btn-delete").forEach(button => {
            button.addEventListener("click", () => deleteProveedor(button.dataset.id));
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

    const openAddProveedorModal = () => {
        const content = `
            <h2>Agregar Proveedor</h2>
            <form id="add-proveedor-form">
                <label>Nombre: <input type="text" name="nombre" required></label>
                <label>Contacto: <input type="text" name="contacto"></label>
                <label>Teléfono: <input type="text" name="telefono"></label>
                <label>Email: <input type="email" name="email"></label>
                <button type="submit" class="btn-primary">Guardar</button>
            </form>
        `;
        openModal(content);
        document.getElementById("add-proveedor-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await fetch(`${API_BASE}?action=create`, {
                method: "POST",
                body: formData
            });
            document.querySelector(".modal").remove();
            fetchProveedores();
        });
    };

    const openEditProveedorModal = (id) => {
        fetch(`${API_BASE}?action=read&id=${id}`)
            .then(response => response.json())
            .then(proveedor => {
                const content = `
                    <h2>Editar Proveedor</h2>
                    <form id="edit-proveedor-form">
                        <input type="hidden" name="id" value="${proveedor.id}">
                        <label>Nombre: <input type="text" name="nombre" value="${proveedor.nombre}" required></label>
                        <label>Contacto: <input type="text" name="contacto" value="${proveedor.contacto || ""}"></label>
                        <label>Teléfono: <input type="text" name="telefono" value="${proveedor.telefono || ""}"></label>
                        <label>Email: <input type="email" name="email" value="${proveedor.email || ""}"></label>
                        <button type="submit" class="btn-primary">Guardar Cambios</button>
                    </form>
                `;
                openModal(content);
                document.getElementById("edit-proveedor-form").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    await fetch(`${API_BASE}?action=update`, {
                        method: "POST",
                        body: formData
                    });
                    document.querySelector(".modal").remove();
                    fetchProveedores();
                });
            });
    };

    const deleteProveedor = async (id) => {
        if (confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
            await fetch(`${API_BASE}?action=delete`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `id=${id}`
            });
            fetchProveedores();
        }
    };

    document.getElementById("agregar-proveedor").addEventListener("click", openAddProveedorModal);
    fetchProveedores();
});

