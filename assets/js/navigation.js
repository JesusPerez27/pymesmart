/**
 * Módulo de Navegación
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener('DOMContentLoaded', () => {
    // Marcar página activa en navegación
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });
});

