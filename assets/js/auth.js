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

