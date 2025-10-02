// Variables globales
let carrito = [];
let productos = [];
let cuponAplicado = null;

// URL base de la API - ahora se define en config.js
// const API_URL = 'http://localhost:3000/api';

// ========== SISTEMA DE TRACKING UTM ==========

// Capturar parámetros UTM de la URL
function capturarUTMs() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const utmParams = {
        utm_source: urlParams.get('utm_source') || null,
        utm_medium: urlParams.get('utm_medium') || null,
        utm_campaign: urlParams.get('utm_campaign') || null,
        utm_term: urlParams.get('utm_term') || null,
        utm_content: urlParams.get('utm_content') || null,
        referrer: document.referrer || null,
        landing_page: window.location.href,
        timestamp: new Date().toISOString()
    };
    
    // Solo guardar si hay al menos un parámetro UTM
    if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
        localStorage.setItem('utmData', JSON.stringify(utmParams));
        console.log('✅ UTMs capturados en checkout:', utmParams);
    } else if (!localStorage.getItem('utmData')) {
        // Si no hay UTMs pero tampoco hay datos guardados, guardar info básica
        localStorage.setItem('utmData', JSON.stringify({
            utm_source: 'directo',
            utm_medium: 'ninguno',
            utm_campaign: null,
            utm_term: null,
            utm_content: null,
            referrer: document.referrer || 'directo',
            landing_page: window.location.href,
            timestamp: new Date().toISOString()
        }));
    }
}

// Obtener datos UTM guardados
function obtenerUTMs() {
    const utmData = localStorage.getItem('utmData');
    return utmData ? JSON.parse(utmData) : null;
}

// ========== FIN SISTEMA UTM ==========

// Elementos del DOM
const checkoutForm = document.getElementById('checkoutForm');
const orderItems = document.getElementById('orderItems');
const orderSubtotal = document.getElementById('orderSubtotal');
const orderShipping = document.getElementById('orderShipping');
const orderDiscount = document.getElementById('orderDiscount');
const orderTotal = document.getElementById('orderTotal');
const cardDetails = document.getElementById('cardDetails');
const confirmModal = document.getElementById('confirmModal');
const closeModal = document.getElementById('closeModal');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando checkout...');
    
    // Capturar UTMs
    capturarUTMs();
    
    // Inicializar EmailJS
    inicializarEmailJS();
    
    inicializarCarrito();
    cargarProductos();
    inicializarEventListeners();
    inicializarMenuHamburguesa();
    mostrarResumenPedido();
});

// Inicializar carrito desde localStorage
function inicializarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    const cuponGuardado = localStorage.getItem('cuponAplicado');
    
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
        actualizarContadorCarrito();
    }
    
    if (cuponGuardado) {
        cuponAplicado = JSON.parse(cuponGuardado);
    }
    
    // Si no hay productos en el carrito, redirigir al carrito
    if (carrito.length === 0) {
        window.location.href = 'carrito.html';
    }
}

// Cargar productos desde JSON
async function cargarProductos() {
    try {
        console.log('Cargando productos desde JSON...');
        const response = await fetch('products.json');
        const data = await response.json();
        productos = data.productos;
        console.log('Productos cargados:', productos.length);
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        cartCount.textContent = totalItems;
    }
}

// Mostrar resumen del pedido
function mostrarResumenPedido() {
    if (carrito.length === 0) return;
    
    // Mostrar productos
    orderItems.innerHTML = carrito.map(item => `
        <div class="order-item">
            <div class="item-image">
                <i class="${item.imagen}"></i>
            </div>
            <div class="item-details">
                <h4>${item.nombre}</h4>
                <p class="item-category">${item.categoria.replace('-', ' ')}</p>
                <p class="item-quantity">Cantidad: ${item.cantidad}</p>
            </div>
            <div class="item-price">$${(item.precio * item.cantidad).toFixed(2)}</div>
        </div>
    `).join('');
    
    // Calcular totales
    actualizarTotales();
}

// Actualizar totales
function actualizarTotales() {
    const subtotalValue = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const envioValue = subtotalValue > 100 ? 0 : 10;
    
    // Calcular descuento por cupón aplicado
    let descuentoValue = 0;
    if (cuponAplicado) {
        if (cuponAplicado.tipo === 'porcentaje') {
            descuentoValue = subtotalValue * (cuponAplicado.descuento / 100);
        } else if (cuponAplicado.tipo === 'fijo') {
            descuentoValue = cuponAplicado.descuento;
        }
    }
    
    const totalValue = subtotalValue + envioValue - descuentoValue;

    orderSubtotal.textContent = `$${subtotalValue.toFixed(2)}`;
    orderShipping.textContent = envioValue === 0 ? 'Gratis' : `$${envioValue.toFixed(2)}`;
    orderDiscount.textContent = `$${descuentoValue.toFixed(2)}`;
    orderTotal.textContent = `$${totalValue.toFixed(2)}`;
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Método de pago
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const transferDetails = document.getElementById('transferDetails');
    const receiptUpload = document.getElementById('receiptUpload');
    const submitBtn = document.getElementById('submitBtn');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            if (this.value === 'creditCard' || this.value === 'debitCard') {
                cardDetails.style.display = 'block';
                transferDetails.style.display = 'none';
                receiptUpload.style.display = 'none';
                updateSubmitButton('creditCard');
            } else if (this.value === 'bankTransfer') {
                cardDetails.style.display = 'none';
                transferDetails.style.display = 'block';
                receiptUpload.style.display = 'block';
                updateSubmitButton('bankTransfer');
                generateTransferData();
            } else {
                cardDetails.style.display = 'none';
                transferDetails.style.display = 'none';
                receiptUpload.style.display = 'none';
                updateSubmitButton('other');
            }
        });
    });
    
    // Formato automático del número de tarjeta
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
            e.target.value = formattedValue;
        });
    }
    
    // Formato automático de la fecha de vencimiento
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Formato automático del CVV (solo números)
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            if (e.target.value.length > 3) {
                e.target.value = e.target.value.substring(0, 3);
            }
        });
    }
    
    // Formulario de checkout
    checkoutForm.addEventListener('submit', procesarPago);
    
    // Cerrar modal
    closeModal.addEventListener('click', () => {
        // Vaciar el carrito y redirigir a inicio (mismo comportamiento que "Continuar Comprando")
        localStorage.removeItem('carrito');
        localStorage.removeItem('cuponAplicado');
        window.location.href = 'index.html';
    });
    
    // Botón de descargar comprobante
    const downloadReceiptBtn = document.getElementById('downloadReceiptBtn');
    if (downloadReceiptBtn) {
        downloadReceiptBtn.addEventListener('click', descargarComprobante);
    }
    
    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            // Vaciar el carrito y redirigir a inicio (mismo comportamiento que "Continuar Comprando")
            localStorage.removeItem('carrito');
            localStorage.removeItem('cuponAplicado');
            window.location.href = 'index.html';
        }
    });
}

// Validar formulario
async function validarFormulario() {
    const formData = new FormData(checkoutForm);
    const metodoPago = formData.get('paymentMethod');
    
    // Validar campos básicos
    const camposRequeridos = [
        'firstName', 'lastName', 'email', 'phone', 
        'address', 'city', 'postalCode', 'country'
    ];
    
    for (let campo of camposRequeridos) {
        if (!formData.get(campo)) {
            mostrarNotificacion(`Por favor completa el campo: ${campo}`, 'error');
            return false;
        }
    }
    
    // Validar email
    const email = formData.get('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarNotificacion('Por favor ingresa un email válido', 'error');
        return false;
    }
    
    // Validar método de pago
    if (!metodoPago) {
        mostrarNotificacion('Por favor selecciona un método de pago', 'error');
        return false;
    }
    
    // Validar campos de tarjeta si es necesario
    if (metodoPago === 'creditCard' || metodoPago === 'debitCard') {
        const cardNumber = formData.get('cardNumber');
        const expiryDate = formData.get('expiryDate');
        const cvv = formData.get('cvv');
        const cardName = formData.get('cardName');
        
        if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
            mostrarNotificacion('Por favor ingresa un número de tarjeta válido', 'error');
            return false;
        }
        
        if (!expiryDate || expiryDate.length < 5) {
            mostrarNotificacion('Por favor ingresa una fecha de vencimiento válida', 'error');
            return false;
        }
        
        if (!cvv || cvv.length < 3) {
            mostrarNotificacion('Por favor ingresa un CVV válido', 'error');
            return false;
        }
        
        if (!cardName) {
            mostrarNotificacion('Por favor ingresa el nombre en la tarjeta', 'error');
            return false;
        }
    } else if (metodoPago === 'bankTransfer') {
        return processTransferPayment();
    }
    
    return true;
}

// Procesar pago
function procesarPago(e) {
    e.preventDefault();
    
    // Validar formulario antes de procesar
    if (!validarFormulario()) {
        return;
    }
    
    const formData = new FormData(checkoutForm);
    const datosPago = {
        nombre: `${formData.get('firstName')} ${formData.get('lastName')}`,
        email: formData.get('email'),
        telefono: formData.get('phone'),
        direccion: {
            calle: formData.get('address'),
            ciudad: formData.get('city'),
            codigoPostal: formData.get('postalCode'),
            pais: formData.get('country')
        },
        metodoPago: formData.get('paymentMethod'),
        productos: carrito,
        cupon: cuponAplicado,
        total: carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
    };
    
    console.log('Datos del pago:', datosPago);
    
    // Simular procesamiento de pago
    mostrarNotificacion('Procesando pago...', 'info');
    
    setTimeout(() => {
        // Simular éxito del pago
        mostrarNotificacion('¡Pago procesado exitosamente!', 'success');
        
        // Registrar venta en el sistema y obtener el número de pedido
        const numeroPedido = await registrarVenta(datosPago);
        
        // Enviar email de confirmación con el número de pedido
        enviarEmailConfirmacion(datosPago, numeroPedido);
        
        // Limpiar carrito y cupón
        carrito = [];
        cuponAplicado = null;
        localStorage.removeItem('carrito');
        localStorage.removeItem('cuponAplicado');
        
        // Mostrar modal de confirmación
        mostrarModalConfirmacion();
        
    }, 2000);
}

// Mostrar modal de confirmación
function mostrarModalConfirmacion() {
    // Establecer fecha actual
    const fechaActual = new Date();
    const fechaFormateada = fechaActual.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const orderDateElement = document.getElementById('orderDate');
    if (orderDateElement) {
        orderDateElement.textContent = fechaFormateada;
    }
    
    confirmModal.style.display = 'block';
}

// Descargar comprobante (simulado)
function descargarComprobante() {
    mostrarNotificacion('Generando comprobante...', 'info');
    
    setTimeout(() => {
        // Simular descarga
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,Comprobante de compra TechStore%0A%0ANúmero de pedido: TS-2024-001%0AFecha: ' + new Date().toLocaleDateString('es-ES') + '%0A%0A¡Gracias por tu compra!';
        link.download = 'comprobante-techstore.txt';
        link.click();
        
        mostrarNotificacion('Comprobante descargado exitosamente', 'success');
    }, 1000);
}

// Inicializar menú hamburguesa
function inicializarMenuHamburguesa() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');

    if (hamburgerBtn && mobileMenu && mobileOverlay) {
        hamburgerBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            mobileOverlay.classList.toggle('active');
        });

        mobileOverlay.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            mobileOverlay.classList.remove('active');
        });
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notification notification-${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    // Agregar al body
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => {
        notificacion.classList.add('show');
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}

// Función para actualizar el texto del botón según el método de pago
function updateSubmitButton(paymentMethod) {
    const submitBtn = document.getElementById('submitBtn');
    
    // Mantener siempre el texto "Proceder al Pago" independientemente del método
    submitBtn.innerHTML = '<i class="fas fa-lock"></i> Proceder al Pago';
}

// Función para generar datos aleatorios de transferencia
function generateTransferData() {
    // Generar CBU aleatorio (22 dígitos)
    const cbu = '0070' + Math.floor(Math.random() * 10000000000000000000).toString().padStart(18, '0');
    document.getElementById('transferCBU').textContent = cbu;
    
    // Generar alias aleatorio (3 palabras separadas por puntos)
    const palabras = ['gustavo', 'tech', 'store', 'alvarez', 'campos', 'galicia', 'banco', 'transfer'];
    const alias = [palabras[Math.floor(Math.random() * palabras.length)], 
                   palabras[Math.floor(Math.random() * palabras.length)], 
                   palabras[Math.floor(Math.random() * palabras.length)]].join('.');
    document.getElementById('transferAlias').textContent = alias;
    
    // Generar CUIT aleatorio
    const cuit = '20-' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0') + '-' + Math.floor(Math.random() * 10);
    document.getElementById('transferCUIT').textContent = cuit;
    
    // Generar número de cuenta aleatorio (13 dígitos)
    const cuenta = Math.floor(Math.random() * 10000000000000).toString().padStart(13, '0');
    document.getElementById('transferAccount').textContent = cuenta;
}

// Función para manejar la subida del comprobante
function handleReceiptUpload(input) {
    const file = input.files[0];
    const fileInfo = document.getElementById('fileInfo');
    const receiptStatus = document.getElementById('receiptStatus');
    const fileLabel = document.querySelector('.file-input-label');
    
    if (file) {
        // Actualizar el botón para mostrar que se seleccionó un archivo
        fileLabel.classList.add('has-file');
        fileLabel.innerHTML = '<i class="fas fa-check-circle"></i><span>Archivo Seleccionado</span>';
        
        fileInfo.innerHTML = `
            <i class="fas fa-file"></i> 
            <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)
        `;
        
        // Simular verificación del comprobante
        receiptStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando comprobante...';
        receiptStatus.className = 'receipt-status pending';
        
        // Cambiar el botón a estado de carga
        fileLabel.classList.add('loading');
        fileLabel.innerHTML = '<i class="fas fa-spinner"></i><span>Verificando...</span>';
        
        // Simular proceso de verificación (2-3 segundos)
        setTimeout(() => {
            const isValid = validateReceipt(file);
            fileLabel.classList.remove('loading');
            
            if (isValid) {
                receiptStatus.innerHTML = '<i class="fas fa-check-circle"></i> Comprobante verificado correctamente. ¡Puedes proceder con el pago!';
                receiptStatus.className = 'receipt-status success';
                fileLabel.innerHTML = '<i class="fas fa-check-circle"></i><span>Comprobante Válido</span>';
                fileLabel.classList.add('has-file');
                // Habilitar el botón de pago
                document.getElementById('submitBtn').disabled = false;
            } else {
                receiptStatus.innerHTML = '<i class="fas fa-times-circle"></i> Comprobante rechazado. Por favor, sube un comprobante válido.';
                receiptStatus.className = 'receipt-status error';
                fileLabel.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Archivo Rechazado</span>';
                fileLabel.classList.remove('has-file');
                // Deshabilitar el botón de pago
                document.getElementById('submitBtn').disabled = true;
            }
        }, 2500);
    } else {
        // Resetear el botón
        fileLabel.classList.remove('has-file', 'loading');
        fileLabel.innerHTML = '<i class="fas fa-cloud-upload-alt"></i><span>Seleccionar Comprobante</span>';
        fileInfo.innerHTML = '';
        receiptStatus.innerHTML = '';
        receiptStatus.className = '';
    }
}

// Función para validar el comprobante (simulada)
function validateReceipt(file) {
    // Simular validación del comprobante
    // En una implementación real, esto se enviaría al servidor para verificación
    
    // Criterios de validación simulados:
    // 1. El archivo debe ser una imagen o PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
        return false;
    }
    
    // 2. El archivo no debe ser muy grande (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
        return false;
    }
    
    // 3. Simular verificación de contenido (70% de probabilidad de éxito)
    return Math.random() > 0.3;
}

// Función para procesar pago con transferencia
function processTransferPayment() {
    const receiptFile = document.getElementById('receiptFile').files[0];
    
    if (!receiptFile) {
        mostrarNotificacion('Por favor, sube el comprobante de transferencia', 'error');
        return false;
    }
    
    const receiptStatus = document.getElementById('receiptStatus');
    if (!receiptStatus.classList.contains('success')) {
        mostrarNotificacion('El comprobante debe ser verificado antes de proceder', 'error');
        return false;
    }
    
    // Llamar directamente a procesarCompra sin mostrar notificación duplicada
    procesarCompra();
    return true;
}

// Inicializar EmailJS
function inicializarEmailJS() {
    // Inicializar EmailJS con tu Public Key
    // NOTA: Debes reemplazar 'YOUR_PUBLIC_KEY' con tu clave pública de EmailJS
    // Para obtener tu clave: https://dashboard.emailjs.com/admin/account
    emailjs.init('IKGhYu9027KVkb8wT');
}

// Función para enviar email de confirmación
function enviarEmailConfirmacion(datosPago, numeroPedido) {
    // El número de pedido se recibe como parámetro desde registrarVenta
    
    // Calcular totales
    const subtotal = datosPago.productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const descuento = datosPago.cupon ? (subtotal * datosPago.cupon.descuento / 100) : 0;
    const envio = subtotal >= 500 ? 0 : 50;
    const total = subtotal - descuento + envio;
    
    // Crear lista de productos
    let productosHTML = '';
    datosPago.productos.forEach(producto => {
        productosHTML += `
            • ${producto.nombre}
              Cantidad: ${producto.cantidad}
              Precio unitario: $${producto.precio}
              Subtotal: $${(producto.precio * producto.cantidad).toFixed(2)}
            
        `;
    });
    
    // Crear detalles del cupón si existe
    let cuponInfo = '';
    if (datosPago.cupon) {
        cuponInfo = `
Cupón aplicado: ${datosPago.cupon.codigo}
Descuento: ${datosPago.cupon.descuento}% (-$${descuento.toFixed(2)})
        `;
    }
    
    // Método de pago traducido
    const metodosPago = {
        'creditCard': 'Tarjeta de Crédito',
        'debitCard': 'Tarjeta de Débito',
        'paypal': 'PayPal',
        'bankTransfer': 'Transferencia Bancaria'
    };
    
    // Parámetros del email
    const templateParams = {
        to_email: datosPago.email,
        to_name: datosPago.nombre,
        order_number: numeroPedido,
        order_date: new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        customer_name: datosPago.nombre,
        customer_email: datosPago.email,
        customer_phone: datosPago.telefono,
        customer_address: `${datosPago.direccion.calle}, ${datosPago.direccion.ciudad}, ${datosPago.direccion.pais} - CP: ${datosPago.direccion.codigoPostal}`,
        payment_method: metodosPago[datosPago.metodoPago] || datosPago.metodoPago,
        products_list: productosHTML,
        subtotal: subtotal.toFixed(2),
        shipping: envio === 0 ? 'Gratis' : `$${envio.toFixed(2)}`,
        discount: descuento > 0 ? `-$${descuento.toFixed(2)}` : '$0.00',
        coupon_info: cuponInfo,
        total: total.toFixed(2)
    };
    
    // Enviar email usando EmailJS
    // NOTA: Debes reemplazar 'YOUR_SERVICE_ID' y 'YOUR_TEMPLATE_ID' con tus IDs de EmailJS
    // Para obtener estos IDs: https://dashboard.emailjs.com/admin
    emailjs.send('service_s5lkmdh', 'template_wu8tip8', templateParams)
        .then(function(response) {
            console.log('Email enviado exitosamente!', response.status, response.text);
            mostrarNotificacion('Email de confirmación enviado', 'success');
        }, function(error) {
            console.error('Error al enviar email:', error);
            mostrarNotificacion('No se pudo enviar el email de confirmación', 'error');
        });
}

// Función para generar número de pedido único
async function generarNumeroPedidoUnico() {
    const año = new Date().getFullYear();
    const mes = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Formato: TS-AÑO-MES-TIMESTAMP-RANDOM
    // Ejemplo: TS-2025-10-845621-347
    let numeroPedido = `TS-${año}-${mes}-${timestamp}-${random}`;
    
    try {
        // Verificar si el número ya existe en el servidor
        const response = await fetch(`${API_URL}/sales`);
        if (response.ok) {
            const ventas = await response.json();
            
            // Si el número existe, generar uno nuevo recursivamente
            if (ventas.some(venta => venta.numeroPedido === numeroPedido)) {
                console.log('⚠️ Número de pedido duplicado, generando uno nuevo...');
                return await generarNumeroPedidoUnico(); // Recursión hasta encontrar uno único
            }
        }
    } catch (error) {
        console.error('Error al verificar número de pedido:', error);
        // Si hay error en la verificación, agregar más aleatoriedad
        numeroPedido += '-' + Math.floor(Math.random() * 10000);
    }
    
    console.log('✅ Número de pedido único generado:', numeroPedido);
    return numeroPedido;
}

// Función para registrar venta
async function registrarVenta(datosPago) {
    // Generar número de pedido único
    const numeroPedido = await generarNumeroPedidoUnico();
    
    // Calcular totales
    const subtotal = datosPago.productos.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const descuento = datosPago.cupon ? (subtotal * datosPago.cupon.descuento / 100) : 0;
    const envio = subtotal >= 500 ? 0 : 50;
    const total = subtotal - descuento + envio;
    
    // Obtener datos UTM guardados
    const utmData = obtenerUTMs();
    
    // Crear objeto de venta
    const venta = {
        numeroPedido: numeroPedido,
        cliente: datosPago.nombre,
        email: datosPago.email,
        telefono: datosPago.telefono,
        direccion: `${datosPago.direccion.calle}, ${datosPago.direccion.ciudad}, ${datosPago.direccion.pais} - CP: ${datosPago.direccion.codigoPostal}`,
        metodoPago: traducirMetodoPago(datosPago.metodoPago),
        productos: datosPago.productos.map(p => ({
            id: p.id,
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: p.precio,
            categoria: p.categoria
        })),
        subtotal: subtotal,
        descuento: descuento,
        envio: envio,
        total: total,
        cupon: datosPago.cupon,
        utm: utmData, // Agregar datos UTM
        fecha: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    try {
        // Guardar venta en el servidor (sales.json)
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venta)
        });
        
        if (response.ok) {
            console.log('✅ Venta registrada en sales.json:', numeroPedido);
        } else {
            console.error('Error al guardar venta en el servidor');
        }
        
        // Actualizar stock de productos vendidos
        await actualizarStockProductos(datosPago.productos);
        
    } catch (error) {
        console.error('Error al registrar venta:', error);
    }
    
    // Retornar el número de pedido generado
    return numeroPedido;
}

// Función para traducir método de pago
function traducirMetodoPago(metodo) {
    const traducciones = {
        'creditCard': 'Tarjeta de Crédito',
        'debitCard': 'Tarjeta de Débito',
        'paypal': 'PayPal',
        'bankTransfer': 'Transferencia Bancaria'
    };
    return traducciones[metodo] || metodo;
}

// Función para actualizar stock después de una venta
async function actualizarStockProductos(productosVendidos) {
    try {
        // Obtener productos actuales del servidor
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) return;
        
        const productos = await response.json();
        
        // Actualizar stock de cada producto vendido
        for (const productoVendido of productosVendidos) {
            const producto = productos.find(p => p.id === productoVendido.id);
            if (producto) {
                const nuevoStock = Math.max(0, producto.stock - productoVendido.cantidad);
                
                // Actualizar en el servidor
                await fetch(`${API_URL}/products/${producto.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ stock: nuevoStock })
                });
                
                console.log(`✅ Stock actualizado: ${producto.nombre} - Nuevo stock: ${nuevoStock}`);
            }
        }
        
    } catch (error) {
        console.error('Error al actualizar stock:', error);
    }
}
