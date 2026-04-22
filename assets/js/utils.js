/**
 * Utilidades Compartidas
 * PymeSmart - Sistema de Gestión para Imprentas
 */

// ===== Sistema de Notificaciones Toast =====
class ToastNotification {
    static show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${this.getIcon(type)}</div>
            <div class="toast-message">${message}</div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        const container = this.getContainer();
        container.appendChild(toast);
        
        // Animación de entrada
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto-remover
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }
    
    static getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    static getContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }
    
    static success(message, duration) {
        this.show(message, 'success', duration);
    }
    
    static error(message, duration) {
        this.show(message, 'error', duration);
    }
    
    static warning(message, duration) {
        this.show(message, 'warning', duration);
    }
    
    static info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// ===== Confirmación de Eliminación =====
function confirmDelete(message = '¿Estás seguro de que deseas eliminar este registro?') {
    return confirm(message);
}

// ===== Formateo de Datos =====
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-MX').format(value || 0);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ===== Búsqueda en Tablas =====
function setupTableSearch(inputId, tableId) {
    const searchInput = document.getElementById(inputId);
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// ===== Indicador de Carga =====
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading-spinner">Cargando...</div>';
    }
}

function hideLoading(elementId, content = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    }
}

// ===== Validación de Formularios =====
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateRequired(value) {
    return value && value.trim().length > 0;
}

function validateNumber(value, min = 0, max = Infinity) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
}

// ===== Manejo de Errores de API =====
async function handleApiResponse(response, successCallback, errorCallback) {
    try {
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            if (successCallback) successCallback(data);
            return true;
        } else {
            const errorMsg = data.error || data.message || 'Error desconocido';
            ToastNotification.error(errorMsg);
            if (errorCallback) errorCallback(data);
            return false;
        }
    } catch (error) {
        ToastNotification.error('Error de conexión. Intenta nuevamente.');
        if (errorCallback) errorCallback(error);
        return false;
    }
}

// Exportar para uso global
window.ToastNotification = ToastNotification;
window.confirmDelete = confirmDelete;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.setupTableSearch = setupTableSearch;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.validateEmail = validateEmail;
window.validateRequired = validateRequired;
window.validateNumber = validateNumber;
window.handleApiResponse = handleApiResponse;



