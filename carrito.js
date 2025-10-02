// Variables globales
let carrito = [];
let productos = [];
let cupones = [];
let cuponAplicado = null;

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
        console.log('✅ UTMs capturados en carrito:', utmParams);
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

// ========== FIN SISTEMA UTM ==========

// Elementos del DOM
const cartEmpty = document.getElementById('cartEmpty');
const cartContent = document.getElementById('cartContent');
const cartItemsList = document.getElementById('cartItemsList');
const cartCount = document.getElementById('cart-count');
const clearCartBtn = document.getElementById('clearCartBtn');
const subtotal = document.getElementById('subtotal');
const shipping = document.getElementById('shipping');
const discount = document.getElementById('discount');
const total = document.getElementById('total');
const checkoutBtn = document.getElementById('checkoutBtn');
const relatedGrid = document.getElementById('relatedGrid');

// Elementos del sistema de cupones
const couponCode = document.getElementById('couponCode');
const applyCouponBtn = document.getElementById('applyCouponBtn');
const couponMessage = document.getElementById('couponMessage');
const appliedCoupon = document.getElementById('appliedCoupon');
const appliedCouponText = document.getElementById('appliedCouponText');
const removeCouponBtn = document.getElementById('removeCouponBtn');
const couponLimitInfo = document.getElementById('couponLimitInfo');

// Elementos del carrusel
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const carouselWrapper = document.getElementById('carouselWrapper');

// Variables del carrusel
let currentSlide = 0;
let itemsPerSlide = 3; // Mostrar máximo 3 productos por vista
let autoScrollInterval = null;
let isAutoScrolling = true;
let scrollSpeed = 3000; // 3 segundos entre cada slide

// Modales
const confirmModal = document.getElementById('confirmModal');
const checkoutModal = document.getElementById('checkoutModal');
const checkoutForm = document.getElementById('checkoutForm');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando carrito...');
    console.log('relatedGrid element:', relatedGrid);
    console.log('prevBtn element:', prevBtn);
    console.log('nextBtn element:', nextBtn);
    
    capturarUTMs(); // Capturar UTMs al cargar la página del carrito
    inicializarCarrito();
    cargarProductos();
    cargarCupones();
    inicializarEventListeners();
    inicializarMenuHamburguesa();
});

// Event listeners de limpieza eliminados - ahora usamos animación CSS que se maneja automáticamente

// Inicializar carrito desde localStorage
function inicializarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
        actualizarContadorCarrito();
        mostrarCarrito();
    } else {
        mostrarCarritoVacio();
    }
}

// Guardar carrito en localStorage
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
    if (cartCount) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        cartCount.textContent = totalItems;
        cartCount.style.display = 'flex'; // Siempre mostrar el contador
    }
}

// Cargar productos desde JSON
async function cargarProductos() {
    try {
        console.log('Cargando productos desde la API...');
        const response = await fetch('http://localhost:3000/api/products');
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        productos = data.productos || data; // Acceder al array de productos
        console.log('Productos cargados:', productos.length);
        console.log('Productos destacados en la carga:', productos.filter(p => p.destacado === true).map(p => p.nombre));
        
        // Cargar productos relacionados después de cargar los productos
        setTimeout(() => {
            cargarProductosRelacionados();
        }, 500);
    } catch (error) {
        console.error('Error al cargar productos desde API, intentando desde JSON:', error);
        // Fallback: cargar desde JSON local
        try {
            const response = await fetch('products.json');
            const data = await response.json();
            productos = data.productos;
            console.log('Productos cargados desde JSON local:', productos.length);
            console.log('Productos destacados:', productos.filter(p => p.destacado === true).map(p => p.nombre));
            
            setTimeout(() => {
                cargarProductosRelacionados();
            }, 500);
        } catch (fallbackError) {
            console.error('Error al cargar productos desde JSON:', fallbackError);
        }
    }
}

// Cargar cupones desde JSON
async function cargarCupones() {
    try {
        console.log('Cargando cupones desde JSON...');
        const response = await fetch('cupon.json');
        const data = await response.json();
        cupones = data.cupones; // Acceder al array de cupones dentro del objeto JSON
        console.log('Cupones cargados:', cupones.length);
        console.log('Cupones disponibles:', cupones.map(c => c.codigo));
    } catch (error) {
        console.error('Error al cargar cupones:', error);
    }
}

// Función para forzar la carga de productos destacados
function forzarCargaProductosDestacados() {
    console.log('Forzando carga de productos destacados...');
    if (productos.length > 0) {
        cargarProductosRelacionados();
    } else {
        console.log('No hay productos cargados aún');
    }
}

// Mostrar carrito vacío
function mostrarCarritoVacio() {
    cartEmpty.style.display = 'block';
    cartContent.style.display = 'none';
    // Cargar productos relacionados incluso cuando el carrito está vacío
    if (productos.length > 0) {
        cargarProductosRelacionados();
    }
}

// Mostrar carrito con productos
function mostrarCarrito() {
    if (carrito.length === 0) {
        mostrarCarritoVacio();
        return;
    }

    cartEmpty.style.display = 'none';
    cartContent.style.display = 'block';
    
    renderizarProductos();
    actualizarResumen();
}

// Renderizar productos en el carrito
function renderizarProductos() {
    cartItemsList.innerHTML = carrito.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <div class="item-image">
                <i class="${item.imagen}"></i>
            </div>
            <div class="item-details">
                <h4>${item.nombre}</h4>
                <p class="item-category">${item.categoria.replace('-', ' ')}</p>
                <p class="item-brand">${item.marca}</p>
                <div class="item-price">$${item.precio}</div>
            </div>
            <div class="item-quantity">
                <button class="quantity-btn" onclick="cambiarCantidad(${item.id}, -1)">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity">${item.cantidad}</span>
                <button class="quantity-btn" onclick="cambiarCantidad(${item.id}, 1)">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="item-total">
                <span>$${(item.precio * item.cantidad).toFixed(2)}</span>
            </div>
            <div class="item-actions">
                <button class="btn btn-outline btn-sm" onclick="eliminarProducto(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Cambiar cantidad de producto
function cambiarCantidad(productoId, cambio) {
    const item = carrito.find(item => item.id === productoId);
    if (!item) return;

    const nuevaCantidad = item.cantidad + cambio;
    
    if (nuevaCantidad <= 0) {
        eliminarProducto(productoId);
        return;
    }

    // Verificar stock
    const producto = productos.find(p => p.id === productoId);
    if (producto && nuevaCantidad > producto.stock) {
        mostrarNotificacion('No hay suficiente stock disponible', 'error');
        return;
    }

    item.cantidad = nuevaCantidad;
    guardarCarrito();
    mostrarCarrito();
}

// Eliminar producto del carrito
function eliminarProducto(productoId) {
    const item = carrito.find(item => item.id === productoId);
    if (!item) return;

    mostrarConfirmacion(
        'Eliminar Producto',
        `¿Estás seguro de que quieres eliminar "${item.nombre}" del carrito?`,
        () => {
            carrito = carrito.filter(item => item.id !== productoId);
            guardarCarrito();
            mostrarCarrito();
            mostrarNotificacion('Producto eliminado del carrito', 'success');
        }
    );
}

// Vaciar carrito
function vaciarCarrito() {
    mostrarConfirmacion(
        'Vaciar Carrito',
        '¿Estás seguro de que quieres vaciar todo el carrito?',
        () => {
            carrito = [];
            guardarCarrito();
            mostrarCarrito();
            mostrarNotificacion('Carrito vaciado', 'success');
        }
    );
}

// Actualizar resumen del pedido
function actualizarResumen() {
    const subtotalValue = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const envioValue = subtotalValue > 100 ? 0 : 10; // Envío gratis si el pedido es mayor a $100
    
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

    subtotal.textContent = `$${subtotalValue.toFixed(2)}`;
    shipping.textContent = envioValue === 0 ? 'Gratis' : `$${envioValue.toFixed(2)}`;
    discount.textContent = `$${descuentoValue.toFixed(2)}`;
    total.textContent = `$${totalValue.toFixed(2)}`;
}

// Cargar productos relacionados
function cargarProductosRelacionados() {
    console.log('Cargando productos relacionados...');
    console.log('Productos disponibles:', productos.length);
    
    if (productos.length === 0) {
        console.log('No hay productos cargados');
        return;
    }

    // Siempre mostrar productos destacados (solo boolean true)
    const productosDestacados = productos.filter(producto => 
        producto.destacado === true
    );
    console.log('Productos destacados encontrados:', productosDestacados.length);
    console.log('Productos destacados:', productosDestacados.map(p => p.nombre));
    
    if (productosDestacados.length === 0) {
        // Si no hay productos destacados, mostrar productos aleatorios
        const productosAleatorios = productos
            .sort(() => Math.random() - 0.5)
            .slice(0, 8); // Mostrar más productos para el carrusel
        console.log('Mostrando productos aleatorios:', productosAleatorios.length);
        mostrarProductosRelacionados(productosAleatorios);
    } else {
        // Si hay productos destacados, mostrar todos los destacados
        console.log('Mostrando productos destacados:', productosDestacados.length);
        mostrarProductosRelacionados(productosDestacados);
    }
}

// Mostrar productos relacionados
function mostrarProductosRelacionados(productos) {
    console.log('Mostrando productos:', productos);
    console.log('RelatedGrid element:', relatedGrid);
    
    if (!relatedGrid) {
        console.error('relatedGrid no encontrado');
        return;
    }
    
    // Limpiar contenido anterior
    relatedGrid.innerHTML = '';
    
    // Función auxiliar para formatear nombre de categoría
    const formatearCategoria = (categoria) => {
        const categorias = {
            'procesadores': 'Procesador',
            'placas-video': 'Placa de Video',
            'memorias-ram': 'Memoria RAM',
            'gabinetes': 'Gabinete',
            'motherboard': 'Motherboard',
            'discos': 'Almacenamiento'
        };
        return categorias[categoria] || categoria.replace('-', ' ');
    };
    
    // Crear función para generar una tarjeta
    const crearTarjeta = (producto) => {
        const productCard = document.createElement('div');
        productCard.className = 'cart-suggestion-card';
        productCard.onclick = () => window.location.href = `producto.html?id=${producto.id}`;
        
        // Determinar si mostrar imagen o ícono
        let imagenHTML;
        if (producto.coverImage) {
            imagenHTML = `<img src="${producto.coverImage}" alt="${producto.nombre}">`;
        } else if (producto.imagen && producto.imagen.startsWith('/uploads/')) {
            imagenHTML = `<img src="${producto.imagen}" alt="${producto.nombre}">`;
        } else {
            imagenHTML = `<i class="${producto.imagen || 'fas fa-box'}"></i>`;
        }
        
        productCard.innerHTML = `
            <div class="cart-suggestion-image">
                ${imagenHTML}
            </div>
            <div class="cart-suggestion-info">
                <h4>${producto.nombre}</h4>
                <p class="cart-suggestion-category">${formatearCategoria(producto.categoria)}</p>
                <div class="cart-suggestion-price">$${producto.precio}</div>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); agregarAlCarritoDesdeRelacionados(${producto.id})">
                    <i class="fas fa-cart-plus"></i> Agregar
                </button>
            </div>
        `;
        
        return productCard;
    };
    
    // Repetir productos 4 veces para crear efecto infinito fluido
    const productosRepetidos = [];
    for (let i = 0; i < 4; i++) {
        productosRepetidos.push(...productos);
    }
    
    // Generar HTML para cada producto (repetido 4 veces)
    productosRepetidos.forEach(producto => {
        const productCard = crearTarjeta(producto);
        relatedGrid.appendChild(productCard);
    });
    
    console.log(`HTML generado para ${productosRepetidos.length} productos (${productos.length} originales x4 repeticiones)`);
    
    // Inicializar carrusel después de cargar productos
    setTimeout(() => {
        console.log('Inicializando carrusel infinito después de cargar productos...');
        inicializarCarruselInfinito();
    }, 200);
}

// Inicializar carrusel infinito
function inicializarCarruselInfinito() {
    console.log('=== INICIALIZANDO CARRUSEL INFINITO ===');
    console.log('relatedGrid:', relatedGrid);
    console.log('carouselWrapper:', carouselWrapper);
    
    if (!relatedGrid || !carouselWrapper) {
        console.error('Elementos del carrusel no encontrados');
        return;
    }
    
    const totalItems = relatedGrid.children.length;
    console.log(`Carrusel infinito inicializado: ${totalItems} productos (duplicados)`);
    
    // Configurar eventos de hover para pausar/reanudar animación
    configurarEventosHoverInfinito();
    
    console.log('=== CARRUSEL INFINITO INICIALIZADO ===');
}

// Configurar eventos de hover para carrusel infinito
function configurarEventosHoverInfinito() {
    if (!carouselWrapper) return;
    
    // Remover event listeners existentes
    carouselWrapper.removeEventListener('mouseenter', pausarAnimacionInfinito);
    carouselWrapper.removeEventListener('mouseleave', reanudarAnimacionInfinito);
    
    // Agregar nuevos event listeners
    carouselWrapper.addEventListener('mouseenter', pausarAnimacionInfinito);
    carouselWrapper.addEventListener('mouseleave', reanudarAnimacionInfinito);
    
    console.log('Eventos de hover infinito configurados');
}

// Pausar animación infinita
function pausarAnimacionInfinito() {
    if (relatedGrid) {
        relatedGrid.style.animationPlayState = 'paused';
        console.log('Animación infinita pausada por hover');
    }
}

// Reanudar animación infinita
function reanudarAnimacionInfinito() {
    if (relatedGrid) {
        relatedGrid.style.animationPlayState = 'running';
        console.log('Animación infinita reanudada');
    }
}

// Funciones del carrusel anterior eliminadas - ahora usamos animación CSS infinita

// Funciones de navegación manual eliminadas - ahora usamos animación CSS infinita

// Aplicar cupón de descuento
function aplicarCupon() {
    const codigoIngresado = couponCode.value.trim().toUpperCase();
    
    if (!codigoIngresado) {
        mostrarMensajeCupon('Por favor ingresa un código de descuento', 'error');
        return;
    }
    
    if (carrito.length === 0) {
        mostrarMensajeCupon('Agrega productos al carrito para aplicar un cupón', 'error');
        return;
    }
    
    // Verificar si ya hay un cupón aplicado
    if (cuponAplicado) {
        mostrarMensajeCupon(`Ya tienes aplicado el cupón "${cuponAplicado.codigo}". Remuévelo para aplicar otro cupón.`, 'error');
        return;
    }
    
    // Buscar el cupón
    const cupon = cupones.find(c => c.codigo === codigoIngresado);
    
    if (!cupon) {
        mostrarMensajeCupon('Código de descuento no válido', 'error');
        return;
    }
    
    if (!cupon.activo) {
        mostrarMensajeCupon('Este cupón no está activo', 'error');
        return;
    }
    
    // Verificar fecha de expiración
    const fechaActual = new Date();
    const fechaExpiracion = new Date(cupon.fechaExpiracion);
    if (fechaActual > fechaExpiracion) {
        mostrarMensajeCupon('Este cupón ha expirado', 'error');
        return;
    }
    
    // Verificar uso máximo
    if (cupon.usoActual >= cupon.usoMaximo) {
        mostrarMensajeCupon('Este cupón ha alcanzado su límite de uso', 'error');
        return;
    }
    
    // Aplicar cupón
    cuponAplicado = cupon;
    mostrarMensajeCupon(`¡Cupón aplicado! ${cupon.descripcion}`, 'success');
    
    // Mostrar cupón aplicado
    mostrarCuponAplicado(cupon);
    
    // Limpiar campo de entrada
    couponCode.value = '';
    
    // Actualizar resumen
    actualizarResumen();
    
    console.log('Cupón aplicado:', cupon);
}

// Mostrar mensaje del cupón
function mostrarMensajeCupon(mensaje, tipo) {
    couponMessage.textContent = mensaje;
    couponMessage.className = `coupon-message ${tipo}`;
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
        couponMessage.textContent = '';
        couponMessage.className = 'coupon-message';
    }, 5000);
}

// Mostrar cupón aplicado
function mostrarCuponAplicado(cupon) {
    if (appliedCoupon && appliedCouponText) {
        appliedCouponText.textContent = `${cupon.codigo} - ${cupon.descripcion}`;
        appliedCoupon.style.display = 'flex';
    }
    
    // Deshabilitar campo de entrada y mostrar mensaje de límite
    if (couponCode) {
        couponCode.disabled = true;
        couponCode.placeholder = 'Remueve el cupón actual para aplicar otro';
    }
    
    if (couponLimitInfo) {
        couponLimitInfo.style.display = 'flex';
    }
}

// Ocultar cupón aplicado
function ocultarCuponAplicado() {
    if (appliedCoupon) {
        appliedCoupon.style.display = 'none';
    }
    
    // Habilitar campo de entrada y ocultar mensaje de límite
    if (couponCode) {
        couponCode.disabled = false;
        couponCode.placeholder = 'Ingresa tu código de descuento';
        couponCode.value = '';
    }
    
    if (couponLimitInfo) {
        couponLimitInfo.style.display = 'none';
    }
}

// Remover cupón aplicado
function removerCupon() {
    cuponAplicado = null;
    ocultarCuponAplicado();
    mostrarMensajeCupon('Cupón removido', 'info');
    actualizarResumen();
}

// Agregar producto al carrito desde productos relacionados
function agregarAlCarritoDesdeRelacionados(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        if (itemExistente.cantidad < producto.stock) {
            itemExistente.cantidad++;
        } else {
            mostrarNotificacion('No hay suficiente stock disponible', 'error');
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            stock: producto.stock,
            imagen: producto.imagen,
            categoria: producto.categoria,
            marca: producto.marca
        });
    }

    guardarCarrito();
    mostrarCarrito();
    cargarProductosRelacionados();
    mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
}

// Mostrar confirmación
function mostrarConfirmacion(titulo, mensaje, callback) {
    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalMessage').textContent = mensaje;
    
    confirmModal.style.display = 'block';
    
    document.getElementById('confirmBtn').onclick = () => {
        confirmModal.style.display = 'none';
        callback();
    };
    
    document.getElementById('cancelBtn').onclick = () => {
        confirmModal.style.display = 'none';
    };
}

// Mostrar modal de checkout
function mostrarCheckout() {
    // Guardar cupón aplicado en localStorage para la página de checkout
    if (cuponAplicado) {
        localStorage.setItem('cuponAplicado', JSON.stringify(cuponAplicado));
    }
    
    // Redirigir a la página de checkout
    window.location.href = 'checkout.html';
}

// Cerrar modal de checkout
function cerrarCheckout() {
    checkoutModal.style.display = 'none';
    checkoutForm.reset();
    document.getElementById('cardDetails').style.display = 'none';
}

// Procesar pago
function procesarPago() {
    const formData = new FormData(checkoutForm);
    const datosPago = {
        nombre: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('phone').value,
        direccion: document.getElementById('address').value,
        metodoPago: document.getElementById('paymentMethod').value,
        productos: carrito,
        total: carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
    };

    // Simular procesamiento de pago
    mostrarNotificacion('Procesando pago...', 'info');
    
    setTimeout(() => {
        // Simular éxito del pago
        mostrarNotificacion('¡Pago procesado exitosamente!', 'success');
        
        // Limpiar carrito
        carrito = [];
        guardarCarrito();
        mostrarCarrito();
        
        cerrarCheckout();
        
        // Mostrar mensaje de confirmación
        setTimeout(() => {
            alert('¡Gracias por tu compra! Te hemos enviado un email de confirmación.');
        }, 1000);
    }, 2000);
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Botón vaciar carrito
    clearCartBtn.addEventListener('click', vaciarCarrito);
    
    // Botón checkout
    checkoutBtn.addEventListener('click', mostrarCheckout);
    
    // Botones del carrusel eliminados - ahora usamos animación CSS infinita
    
    // Sistema de cupones
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', aplicarCupon);
    }
    
    if (couponCode) {
        couponCode.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                aplicarCupon();
            }
        });
    }
    
    if (removeCouponBtn) {
        removeCouponBtn.addEventListener('click', removerCupon);
    }
    
    // Método de pago
    document.getElementById('paymentMethod').addEventListener('change', function() {
        const cardDetails = document.getElementById('cardDetails');
        if (this.value === 'credit' || this.value === 'debit') {
            cardDetails.style.display = 'block';
        } else {
            cardDetails.style.display = 'none';
        }
    });
    
    // Cerrar modales
    document.getElementById('closeModal').addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });
    
    document.getElementById('closeCheckoutModal').addEventListener('click', cerrarCheckout);
    document.getElementById('cancelCheckoutBtn').addEventListener('click', cerrarCheckout);
    
    // Procesar pago
    document.getElementById('processPaymentBtn').addEventListener('click', procesarPago);
    
    // Cerrar modales al hacer click fuera
    window.addEventListener('click', function(event) {
        if (event.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
        if (event.target === checkoutModal) {
            cerrarCheckout();
        }
    });
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

// Hacer funciones globales
window.cambiarCantidad = cambiarCantidad;
window.eliminarProducto = eliminarProducto;
window.agregarAlCarritoDesdeRelacionados = agregarAlCarritoDesdeRelacionados;
window.slidePrev = slidePrev;
window.slideNext = slideNext;
window.forzarCargaProductosDestacados = forzarCargaProductosDestacados;
