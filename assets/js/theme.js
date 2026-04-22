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

