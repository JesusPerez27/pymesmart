/**
 * Gestión de Estadísticas Mejorada con Gráficas
 * PymeSmart - Sistema de Gestión para Imprentas
 */

document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = '../api/estadisticas.php';
    let currentType = 'daily';
    
    // Referencias a los gráficos
    let chartIngresos = null;
    let chartPastel = null;
    let chartUnidades = null;
    let chartComparativa = null;

    // Colores para las gráficas
    const colors = {
        primary: '#FFC107',
        secondary: '#FF8A65',
        success: '#4CAF50',
        info: '#2196F3',
        warning: '#FF9800',
        danger: '#F44336',
        light: '#FFE082',
        dark: '#5D4037'
    };

    // Generar colores dinámicos
    function generateColors(count) {
        const colorPalette = [
            '#FFC107', '#FF8A65', '#4CAF50', '#2196F3', 
            '#FF9800', '#F44336', '#9C27B0', '#00BCD4',
            '#8BC34A', '#FF5722', '#3F51B5', '#E91E63'
        ];
        return Array.from({ length: count }, (_, i) => colorPalette[i % colorPalette.length]);
    }

    // Formatear moneda
    function formatCurrency(value) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(value || 0);
    }

    // Formatear número
    function formatNumber(value) {
        return new Intl.NumberFormat('es-MX').format(value || 0);
    }

    // Cargar estadísticas
    const fetchEstadisticas = async (type = 'daily') => {
        try {
            const response = await fetch(`${API_BASE}?type=${type}`);
            if (!response.ok) throw new Error('Error en la respuesta del servidor');
            
            const data = await response.json();
            
            if (data.error) {
                console.error('Error:', data.error);
                renderEstadisticas([], { total_unidades: 0, total_ingresos: 0, total_ordenes: 0 }, type);
                return;
            }

            const estadisticas = data.datos || [];
            const totales = data.totales || { total_unidades: 0, total_ingresos: 0, total_ordenes: 0 };
            
            renderEstadisticas(estadisticas, totales, type);
            updateSummaryCards(totales);
        } catch (error) {
            console.error('Error al cargar estadísticas:', error);
            renderEstadisticas([], { total_unidades: 0, total_ingresos: 0, total_ordenes: 0 }, type);
            updateSummaryCards({ total_unidades: 0, total_ingresos: 0, total_ordenes: 0 });
        }
    };

    // Actualizar tarjetas de resumen
    function updateSummaryCards(totales) {
        document.getElementById('total-ingresos').textContent = formatCurrency(totales.total_ingresos);
        document.getElementById('total-unidades').textContent = formatNumber(totales.total_unidades);
        document.getElementById('total-ordenes').textContent = formatNumber(totales.total_ordenes);
        
        const promedio = totales.total_ordenes > 0 
            ? totales.total_ingresos / totales.total_ordenes 
            : 0;
        document.getElementById('promedio-orden').textContent = formatCurrency(promedio);
    }

    // Renderizar estadísticas y gráficas
    function renderEstadisticas(estadisticas, totales, type) {
        const tbody = document.getElementById("estadisticas-table-body");
        tbody.innerHTML = "";
        
        if (estadisticas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay datos disponibles para este período</td></tr>';
            destroyCharts();
            return;
        }
        
        // Renderizar tabla
        estadisticas.forEach(stat => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><strong>${stat.producto}</strong></td>
                <td>${formatNumber(stat.total_vendido)}</td>
                <td>${formatCurrency(stat.total_ingresos)}</td>
                <td>${formatNumber(stat.num_ordenes)}</td>
                <td>${formatCurrency(stat.promedio_orden)}</td>
            `;
            tbody.appendChild(row);
        });

        // Crear gráficas
        createCharts(estadisticas);
    }

    // Crear todas las gráficas
    function createCharts(estadisticas) {
        const labels = estadisticas.map(s => s.producto);
        const ingresosData = estadisticas.map(s => parseFloat(s.total_ingresos));
        const unidadesData = estadisticas.map(s => parseInt(s.total_vendido));
        const chartColors = generateColors(estadisticas.length);

        // Destruir gráficas anteriores
        destroyCharts();

        // Gráfica de Ingresos (Barras)
        const ctxIngresos = document.getElementById('chart-ingresos');
        if (ctxIngresos) {
            chartIngresos = new Chart(ctxIngresos, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Ingresos ($)',
                        data: ingresosData,
                        backgroundColor: chartColors.map(c => c + 'CC'),
                        borderColor: chartColors,
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

        // Gráfica de Pastel (Distribución)
        const ctxPastel = document.getElementById('chart-pastel');
        if (ctxPastel) {
            chartPastel = new Chart(ctxPastel, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: ingresosData,
                        backgroundColor: chartColors,
                        borderWidth: 2,
                        borderColor: '#FFF'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 15,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Gráfica de Unidades (Barras horizontales)
        const ctxUnidades = document.getElementById('chart-unidades');
        if (ctxUnidades) {
            chartUnidades = new Chart(ctxUnidades, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Unidades Vendidas',
                        data: unidadesData,
                        backgroundColor: chartColors.map(c => c + 'AA'),
                        borderColor: chartColors,
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${formatNumber(context.parsed.x)} unidades`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return formatNumber(value);
                                }
                            }
                        }
                    }
                }
            });
        }

        // Gráfica Comparativa (Líneas)
        const ctxComparativa = document.getElementById('chart-comparativa');
        if (ctxComparativa) {
            // Normalizar datos para comparación
            const maxIngresos = Math.max(...ingresosData);
            const maxUnidades = Math.max(...unidadesData);
            const ingresosNormalizados = ingresosData.map(v => (v / maxIngresos) * 100);
            const unidadesNormalizadas = unidadesData.map(v => (v / maxUnidades) * 100);

            chartComparativa = new Chart(ctxComparativa, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ingresos (normalizado %)',
                            data: ingresosNormalizados,
                            borderColor: colors.primary,
                            backgroundColor: colors.primary + '33',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        },
                        {
                            label: 'Unidades (normalizado %)',
                            data: unidadesNormalizadas,
                            borderColor: colors.secondary,
                            backgroundColor: colors.secondary + '33',
                            borderWidth: 3,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const index = context.dataIndex;
                                    if (context.datasetIndex === 0) {
                                        return `Ingresos: ${formatCurrency(ingresosData[index])}`;
                                    } else {
                                        return `Unidades: ${formatNumber(unidadesData[index])}`;
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    // Destruir gráficas anteriores
    function destroyCharts() {
        if (chartIngresos) {
            chartIngresos.destroy();
            chartIngresos = null;
        }
        if (chartPastel) {
            chartPastel.destroy();
            chartPastel = null;
        }
        if (chartUnidades) {
            chartUnidades.destroy();
            chartUnidades = null;
        }
        if (chartComparativa) {
            chartComparativa.destroy();
            chartComparativa = null;
        }
    }

    // Manejar botones de filtro
    document.querySelectorAll('.btn-filter').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentType = button.dataset.type;
            fetchEstadisticas(currentType);
        });
    });

    // Cargar estadísticas iniciales
    fetchEstadisticas(currentType);
});
