/**
 * Gestión de Usuarios/Empleados
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = '../api/usuarios.php';
    
    const fetchUsuarios = async () => {
        try {
            const response = await fetch(`${API_BASE}?action=read`);
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            const usuarios = await response.json();
            if (Array.isArray(usuarios)) {
                renderUsuarios(usuarios);
            } else {
                console.error('Error: Los datos no son un array', usuarios);
                renderUsuarios([]);
            }
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            alert('Error al cargar los usuarios. Verifica la consola para más detalles.');
        }
    };

    const renderUsuarios = (usuarios) => {
        const tbody = document.getElementById("usuarios-table-body");
        tbody.innerHTML = "";
        usuarios.forEach(usuario => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${usuario.id}</td>
                <td>${usuario.nombre}</td>
                <td>${usuario.correo}</td>
                <td>${usuario.rol}</td>
                <td>${usuario.username || usuario.correo}</td>
                <td>
                    <button class="btn-edit" data-id="${usuario.id}">Editar</button>
                    <button class="btn-delete" data-id="${usuario.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        document.querySelectorAll(".btn-edit").forEach(button => {
            button.addEventListener("click", () => openEditUsuarioModal(button.dataset.id));
        });

        document.querySelectorAll(".btn-delete").forEach(button => {
            button.addEventListener("click", () => deleteUsuario(button.dataset.id));
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

    const openAddUsuarioModal = () => {
        const content = `
            <h2>Agregar Empleado</h2>
            <form id="add-usuario-form">
                <label>Nombre: <input type="text" name="nombre" required></label>
                <label>Correo: <input type="email" name="correo" required></label>
                <label>Rol:
                    <select name="rol">
                        <option value="Administrador">Administrador</option>
                        <option value="Vendedor" selected>Vendedor</option>
                    </select>
                </label>
                <label>Contraseña: <input type="password" name="password" required></label>
                <button type="submit" class="btn-primary">Guardar</button>
            </form>
        `;
        openModal(content);
        document.getElementById("add-usuario-form").addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await fetch(`${API_BASE}?action=create`, {
                method: "POST",
                body: formData
            });
            document.querySelector(".modal").remove();
            fetchUsuarios();
        });
    };

    const openEditUsuarioModal = (id) => {
        fetch(`${API_BASE}?action=read&id=${id}`)
            .then(response => response.json())
            .then(usuario => {
                const content = `
                    <h2>Editar Empleado</h2>
                    <form id="edit-usuario-form">
                        <input type="hidden" name="id" value="${usuario.id}">
                        <label>Nombre: <input type="text" name="nombre" value="${usuario.nombre}" required></label>
                        <label>Correo: <input type="email" name="correo" value="${usuario.correo}" required></label>
                        <label>Rol:
                            <select name="rol">
                                <option value="Administrador" ${usuario.rol === "Administrador" ? "selected" : ""}>Administrador</option>
                                <option value="Vendedor" ${usuario.rol === "Vendedor" ? "selected" : ""}>Vendedor</option>
                            </select>
                        </label>
                        <label>Contraseña: <input type="password" name="password" placeholder="Dejar en blanco para no cambiar"></label>
                        <button type="submit" class="btn-primary">Guardar Cambios</button>
                    </form>
                `;
                openModal(content);
                document.getElementById("edit-usuario-form").addEventListener("submit", async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    await fetch(`${API_BASE}?action=update`, {
                        method: "POST",
                        body: formData
                    });
                    document.querySelector(".modal").remove();
                    fetchUsuarios();
                });
            });
    };

    const deleteUsuario = async (id) => {
        if (confirm("¿Estás seguro de que deseas eliminar este empleado?")) {
            await fetch(`${API_BASE}?action=delete`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `id=${id}`
            });
            fetchUsuarios();
        }
    };

    document.getElementById("agregar-usuario").addEventListener("click", openAddUsuarioModal);
    fetchUsuarios();
});

