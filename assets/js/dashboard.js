/**
 * Dashboard Mejorado
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener("DOMContentLoaded", () => {
    let dashboardChart = null;
    
    // Cargar nombre de usuario
    loadUserInfo();
    
    // Cargar datos del dashboard
    loadDashboardData();
    
    // Cargar últimas órdenes
    loadUltimasOrdenes();
    
    // Cargar alertas
    loadAlertas();
});

// Cargar información del usuario
async function loadUserInfo() {
    try {
        const response = await fetch('../api/auth.php?action=check');
        const data = await response.json();
        if (data.authenticated && data.usuario) {
            document.getElementById('user-name').textContent = data.usuario;
        }
    } catch (error) {
        console.error('Error al cargar información del usuario:', error);
    }
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Cargar estadísticas de hoy
        const statsResponse = await fetch('../api/estadisticas.php?type=daily');
        const statsData = await statsResponse.json();
        
        if (statsData.datos && statsData.totales) {
            const totales = statsData.totales;
            
            // Actualizar tarjetas
            document.getElementById('ingresos-hoy').textContent = formatCurrency(totales.total_ingresos);
            document.getElementById('ordenes-hoy').textContent = formatNumber(totales.total_ordenes);
            
            // Crear gráfica
            if (statsData.datos.length > 0) {
                createDashboardChart(statsData.datos);
            } else {
                document.getElementById('chart-dashboard').parentElement.innerHTML = 
                    '<p style="text-align: center; padding: 40px; color: #999;">No hay ventas registradas hoy</p>';
            }
        }
        
        // Cargar servicios activos
        const productosResponse = await fetch('../api/productos.php?action=read');
        const productos = await productosResponse.json();
        if (Array.isArray(productos)) {
            document.getElementById('servicios-activos').textContent = formatNumber(productos.length);
            
            // Contar stock bajo
            const stockBajo = productos.filter(p => p.stock < 50).length;
            document.getElementById('stock-bajo').textContent = formatNumber(stockBajo);
        }
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
    }
}

// Crear gráfica del dashboard
function createDashboardChart(datos) {
    const ctx = document.getElementById('chart-dashboard');
    if (!ctx) return;
    
    const labels = datos.map(d => d.producto);
    const ingresos = datos.map(d => parseFloat(d.total_ingresos));
    
    if (dashboardChart) {
        dashboardChart.destroy();
    }
    
    dashboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos ($)',
                data: ingresos,
                backgroundColor: '#FFC107',
                borderColor: '#FFB300',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Cargar últimas órdenes
async function loadUltimasOrdenes() {
    try {
        const response = await fetch('../api/ventas.php?action=read');
        const ordenes = await response.json();
        
        const tbody = document.getElementById('ultimas-ordenes-body');
        tbody.innerHTML = '';
        
        if (Array.isArray(ordenes) && ordenes.length > 0) {
            const ultimas5 = ordenes.slice(0, 5);
            ultimas5.forEach(orden => {
                const row = document.createElement('tr');
                const fecha = new Date(orden.fecha).toLocaleDateString('es-ES');
                row.innerHTML = `
                    <td>#${orden.id}</td>
                    <td>${orden.producto}</td>
                    <td>${formatNumber(orden.cantidad)}</td>
                    <td>${fecha}</td>
                `;
                tbody.appendChild(row);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay órdenes registradas</td></tr>';
        }
    } catch (error) {
        console.error('Error al cargar últimas órdenes:', error);
        document.getElementById('ultimas-ordenes-body').innerHTML = 
            '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #F44336;">Error al cargar órdenes</td></tr>';
    }
}

// Cargar alertas
async function loadAlertas() {
    try {
        const productosResponse = await fetch('../api/productos.php?action=read');
        const productos = await productosResponse.json();
        
        const alertasContainer = document.getElementById('alertas-container');
        alertasContainer.innerHTML = '';
        
        if (Array.isArray(productos)) {
            const stockBajo = productos.filter(p => p.stock < 50);
            const sinStock = productos.filter(p => p.stock === 0);
            
            if (stockBajo.length === 0 && sinStock.length === 0) {
                alertasContainer.innerHTML = '<div class="alerta-item success">✅ Todo en orden. No hay alertas.</div>';
            } else {
                if (sinStock.length > 0) {
                    sinStock.forEach(producto => {
                        const alerta = document.createElement('div');
                        alerta.className = 'alerta-item danger';
                        alerta.innerHTML = `
                            <strong>🔴 Sin Stock:</strong> ${producto.nombre} (Stock: ${producto.stock})
                        `;
                        alertasContainer.appendChild(alerta);
                    });
                }
                
                if (stockBajo.length > 0) {
                    stockBajo.forEach(producto => {
                        if (producto.stock > 0) {
                            const alerta = document.createElement('div');
                            alerta.className = 'alerta-item warning';
                            alerta.innerHTML = `
                                <strong>⚠️ Stock Bajo:</strong> ${producto.nombre} (Stock: ${producto.stock})
                            `;
                            alertasContainer.appendChild(alerta);
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar alertas:', error);
        document.getElementById('alertas-container').innerHTML = 
            '<div class="alerta-item danger">Error al cargar alertas</div>';
    }
}

// Funciones de formato
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-MX').format(value || 0);
}



