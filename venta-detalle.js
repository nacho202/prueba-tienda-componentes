// API URL - ahora se define en config.js
// const API_URL = 'http://localhost:3000/api';

// Variables globales
let venta = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    await cargarDetalleVenta();
});

// Cargar detalle de venta
async function cargarDetalleVenta() {
    try {
        // Obtener el índice desde localStorage
        const ventaIndex = localStorage.getItem('ventaDetalleIndex');
        
        if (ventaIndex === null) {
            mostrarError('No se encontró información de la venta');
            return;
        }

        // Cargar todas las ventas desde la API
        const response = await fetch(`${API_URL}/sales`);
        if (!response.ok) throw new Error('Error al cargar ventas');
        
        const ventas = await response.json();
        venta = ventas[parseInt(ventaIndex)];
        
        if (!venta) {
            mostrarError('Venta no encontrada');
            return;
        }

        // Renderizar el detalle
        renderizarDetalle();
        
    } catch (error) {
        console.error('Error al cargar detalle:', error);
        mostrarError('Error al cargar el detalle de la venta');
    }
}

// Renderizar detalle de venta
function renderizarDetalle() {
    const content = document.getElementById('saleDetailContent');
    
    // Calcular subtotal
    const subtotal = venta.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const descuento = venta.descuento || 0;
    const envio = venta.envio || 0;
    
    content.innerHTML = `
        <!-- Información del pedido -->
        <div class="detail-card">
            <div class="detail-card-header">
                <h2><i class="fas fa-receipt"></i> Información del Pedido</h2>
                <span class="status-badge active">Completado</span>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Número de Pedido</span>
                    <span class="detail-value"><strong>${venta.numeroPedido}</strong></span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Fecha</span>
                    <span class="detail-value">${new Date(venta.fecha).toLocaleString('es-ES', { 
                        day: '2-digit', 
                        month: 'long', 
                        year: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    })}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Método de Pago</span>
                    <span class="detail-value">${formatearMetodoPago(venta.metodoPago)}</span>
                </div>
            </div>
        </div>

        <!-- Información del cliente -->
        <div class="detail-card">
            <div class="detail-card-header">
                <h2><i class="fas fa-user"></i> Información del Cliente</h2>
            </div>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Nombre Completo</span>
                    <span class="detail-value">${venta.cliente}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">
                        <a href="mailto:${venta.email}">${venta.email}</a>
                    </span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Teléfono</span>
                    <span class="detail-value">
                        <a href="tel:${venta.telefono}">${venta.telefono}</a>
                    </span>
                </div>
                <div class="detail-item full-width">
                    <span class="detail-label">Dirección de Entrega</span>
                    <span class="detail-value">${venta.direccion}</span>
                </div>
            </div>
        </div>

        <!-- Productos -->
        <div class="detail-card">
            <div class="detail-card-header">
                <h2><i class="fas fa-shopping-cart"></i> Productos (${venta.productos.length})</h2>
            </div>
            <div class="products-table">
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Precio Unit.</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${venta.productos.map(producto => `
                            <tr>
                                <td><strong>${producto.nombre}</strong></td>
                                <td><span class="category-tag">${producto.categoria?.replace('-', ' ') || 'N/A'}</span></td>
                                <td>$${producto.precio.toFixed(2)}</td>
                                <td>${producto.cantidad}</td>
                                <td><strong>$${(producto.precio * producto.cantidad).toFixed(2)}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Resumen de pago -->
        <div class="detail-card">
            <div class="detail-card-header">
                <h2><i class="fas fa-file-invoice-dollar"></i> Resumen de Pago</h2>
            </div>
            <div class="payment-summary">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                ${descuento > 0 ? `
                <div class="summary-row discount">
                    <span>Descuento ${venta.codigoCupon ? `(${venta.codigoCupon})` : ''}</span>
                    <span>-$${descuento.toFixed(2)}</span>
                </div>
                ` : ''}
                ${envio > 0 ? `
                <div class="summary-row">
                    <span>Envío</span>
                    <span>$${envio.toFixed(2)}</span>
                </div>
                ` : ''}
                <div class="summary-row total">
                    <span><strong>Total</strong></span>
                    <span><strong>$${venta.total.toFixed(2)}</strong></span>
                </div>
            </div>
        </div>

        ${venta.utm ? renderizarUTM(venta.utm) : ''}
    `;
}

// Renderizar información UTM
function renderizarUTM(utm) {
    if (!utm) return '';
    
    return `
        <!-- Información de Marketing (UTM) -->
        <div class="detail-card utm-card">
            <div class="detail-card-header">
                <h2><i class="fas fa-chart-line"></i> Información de Marketing</h2>
                <span class="utm-badge">
                    <i class="fas fa-bullseye"></i> Tracking
                </span>
            </div>
            <div class="detail-grid">
                ${utm.utm_source ? `
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-external-link-alt"></i> Fuente (Source)</span>
                    <span class="detail-value utm-value">${utm.utm_source}</span>
                </div>
                ` : ''}
                
                ${utm.utm_medium ? `
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-broadcast-tower"></i> Medio (Medium)</span>
                    <span class="detail-value utm-value">${utm.utm_medium}</span>
                </div>
                ` : ''}
                
                ${utm.utm_campaign ? `
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-bullhorn"></i> Campaña</span>
                    <span class="detail-value utm-value">${utm.utm_campaign}</span>
                </div>
                ` : ''}
                
                ${utm.utm_term ? `
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-search"></i> Término</span>
                    <span class="detail-value utm-value">${utm.utm_term}</span>
                </div>
                ` : ''}
                
                ${utm.utm_content ? `
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-file-alt"></i> Contenido</span>
                    <span class="detail-value utm-value">${utm.utm_content}</span>
                </div>
                ` : ''}
                
                ${utm.referrer && utm.referrer !== 'directo' ? `
                <div class="detail-item full-width">
                    <span class="detail-label"><i class="fas fa-link"></i> URL de Referencia</span>
                    <span class="detail-value utm-value">${utm.referrer}</span>
                </div>
                ` : ''}
                
                ${utm.landing_page ? `
                <div class="detail-item full-width">
                    <span class="detail-label"><i class="fas fa-plane-arrival"></i> Página de Aterrizaje</span>
                    <span class="detail-value utm-value">${utm.landing_page}</span>
                </div>
                ` : ''}
                
                ${utm.timestamp ? `
                <div class="detail-item">
                    <span class="detail-label"><i class="fas fa-clock"></i> Primera Visita</span>
                    <span class="detail-value">${new Date(utm.timestamp).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                </div>
                ` : ''}
            </div>
            
            ${renderizarResumenUTM(utm)}
        </div>
    `;
}

// Renderizar resumen UTM
function renderizarResumenUTM(utm) {
    let origen = 'Tráfico directo';
    let iconoOrigen = 'fa-user';
    let colorOrigen = '#6c757d';
    
    if (utm.utm_source && utm.utm_source !== 'directo') {
        const fuente = utm.utm_source.toLowerCase();
        
        if (fuente.includes('google')) {
            origen = 'Google';
            iconoOrigen = 'fa-google';
            colorOrigen = '#4285F4';
        } else if (fuente.includes('facebook')) {
            origen = 'Facebook';
            iconoOrigen = 'fa-facebook';
            colorOrigen = '#1877F2';
        } else if (fuente.includes('instagram')) {
            origen = 'Instagram';
            iconoOrigen = 'fa-instagram';
            colorOrigen = '#E4405F';
        } else if (fuente.includes('twitter')) {
            origen = 'Twitter / X';
            iconoOrigen = 'fa-twitter';
            colorOrigen = '#1DA1F2';
        } else if (fuente.includes('youtube')) {
            origen = 'YouTube';
            iconoOrigen = 'fa-youtube';
            colorOrigen = '#FF0000';
        } else if (fuente.includes('tiktok')) {
            origen = 'TikTok';
            iconoOrigen = 'fa-tiktok';
            colorOrigen = '#000000';
        } else if (fuente.includes('linkedin')) {
            origen = 'LinkedIn';
            iconoOrigen = 'fa-linkedin';
            colorOrigen = '#0A66C2';
        } else if (fuente.includes('email') || fuente.includes('newsletter')) {
            origen = 'Email Marketing';
            iconoOrigen = 'fa-envelope';
            colorOrigen = '#28a745';
        } else {
            origen = utm.utm_source;
            iconoOrigen = 'fa-globe';
            colorOrigen = '#6f66e6';
        }
    }
    
    return `
        <div class="utm-summary">
            <div class="utm-origin" style="border-left-color: ${colorOrigen};">
                <i class="fab ${iconoOrigen}" style="color: ${colorOrigen};"></i>
                <div>
                    <strong>Origen de la Venta</strong>
                    <p>${origen}${utm.utm_campaign ? ` - Campaña: ${utm.utm_campaign}` : ''}</p>
                </div>
            </div>
        </div>
    `;
}

// Formatear método de pago
function formatearMetodoPago(metodo) {
    const metodos = {
        'card': '<i class="fas fa-credit-card"></i> Tarjeta de Crédito/Débito',
        'transfer': '<i class="fas fa-money-check-alt"></i> Transferencia Bancaria',
        'cash': '<i class="fas fa-money-bill-wave"></i> Efectivo'
    };
    return metodos[metodo] || metodo;
}

// Mostrar error
function mostrarError(mensaje) {
    const content = document.getElementById('saleDetailContent');
    content.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-circle"></i>
            <h2>Error</h2>
            <p>${mensaje}</p>
            <button class="btn btn-primary" onclick="window.close()">
                <i class="fas fa-arrow-left"></i> Volver
            </button>
        </div>
    `;
}

// Imprimir venta
function imprimirVenta() {
    window.print();
}

