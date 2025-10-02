// Variables globales
let productos = [];
let productoActual = null;
let carrito = [];
let currentImageIndex = 0;
let productImages = [];

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
        console.log('✅ UTMs capturados en producto:', utmParams);
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
        console.log('📊 Visita directa registrada en producto');
    }
}

// ========== FIN SISTEMA UTM ==========

// Inicializar carrito desde localStorage
function inicializarCarrito() {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
        actualizarContadorCarrito();
    }
}

// Guardar carrito en localStorage
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

// Elementos del DOM
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const productDetail = document.getElementById('productDetail');
const breadcrumbProduct = document.getElementById('breadcrumbProduct');

// Elementos del producto
const productImageIcon = document.getElementById('productImageIcon');
const badgeDestacado = document.getElementById('badgeDestacado');
const badgeStock = document.getElementById('badgeStock');
const productName = document.getElementById('productName');
const productCategory = document.getElementById('productCategory');
const productBrand = document.getElementById('productBrand');
const productPrice = document.getElementById('productPrice');
const productDescription = document.getElementById('productDescription');
const specsGrid = document.getElementById('specsGrid');
const relatedGrid = document.getElementById('relatedGrid');

// Elementos de acciones
const quantityInput = document.getElementById('quantity');
const quantityMinus = document.getElementById('quantityMinus');
const quantityPlus = document.getElementById('quantityPlus');
const addToCartBtn = document.getElementById('addToCartBtn');
const buyNowBtn = document.getElementById('buyNowBtn');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    capturarUTMs(); // Capturar UTMs al cargar la página de producto
    inicializarCarrito();
    cargarProductos();
    inicializarEventListeners();
    inicializarMenuHamburguesa();
});

// Cargar productos desde JSON
async function cargarProductos() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        productos = data.productos;
        cargarProductoDesdeURL();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarError();
    }
}

// Cargar producto desde URL
function cargarProductoDesdeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    if (!productId) {
        mostrarError();
        return;
    }
    
    const producto = productos.find(p => p.id === productId);
    if (!producto) {
        mostrarError();
        return;
    }
    
    productoActual = producto;
    mostrarProducto(producto);
}

// Mostrar producto
function mostrarProducto(producto) {
    // Ocultar loading
    loading.style.display = 'none';
    
    // Mostrar detalles
    productDetail.style.display = 'block';
    
    // Actualizar breadcrumb
    breadcrumbProduct.textContent = producto.nombre;
    
    // Preparar imágenes
    productImages = [];
    if (producto.coverImage) {
        productImages.push(producto.coverImage);
    }
    if (producto.galleryImages && producto.galleryImages.length > 0) {
        productImages.push(...producto.galleryImages);
    }
    
    // Inicializar galería
    currentImageIndex = 0;
    if (productImages.length > 0) {
        renderGallery();
    } else {
        // Mostrar ícono si no hay imágenes
        const gallery = document.getElementById('productGallery');
        gallery.innerHTML = `<i class="${producto.imagen || 'fas fa-box'}"></i>`;
    }
    
    // Actualizar badges
    if (producto.destacado === true) {
        badgeDestacado.style.display = 'inline-block';
    } else {
        badgeDestacado.style.display = 'none';
    }
    
    // Actualizar badge de stock
    if (producto.stock === 0) {
        badgeStock.textContent = 'Sin Stock';
        badgeStock.classList.remove('badge-stock');
        badgeStock.classList.add('badge-no-stock');
    } else {
        badgeStock.textContent = 'En Stock';
        badgeStock.classList.remove('badge-no-stock');
        badgeStock.classList.add('badge-stock');
    }
    
    // Actualizar información básica
    productName.textContent = producto.nombre;
    productCategory.textContent = producto.categoria.replace('-', ' ');
    productBrand.textContent = producto.marca;
    productPrice.textContent = `$${producto.precio}`;
    productDescription.textContent = producto.descripcion;
    
    // Actualizar especificaciones
    mostrarEspecificaciones(producto);
    
    // Actualizar productos relacionados
    mostrarProductosRelacionados(producto);
    
    // Actualizar estado de los botones según stock
    if (producto.stock === 0) {
        quantityInput.disabled = true;
        quantityMinus.disabled = true;
        quantityPlus.disabled = true;
        addToCartBtn.disabled = true;
        buyNowBtn.disabled = true;
        addToCartBtn.textContent = 'No Disponible';
        buyNowBtn.textContent = 'No Disponible';
    } else {
        quantityInput.disabled = false;
        quantityMinus.disabled = false;
        quantityPlus.disabled = false;
        addToCartBtn.disabled = false;
        buyNowBtn.disabled = false;
        addToCartBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar al Carrito';
        buyNowBtn.innerHTML = '<i class="fas fa-bolt"></i> Comprar Ahora';
        // Actualizar estado de los botones de cantidad
        actualizarEstadoBotones();
    }
    
    // Actualizar título de la página
    document.title = `${producto.nombre} - TechStore`;
}

// Renderizar galería de imágenes
function renderGallery() {
    const gallery = document.getElementById('productGallery');
    const prevBtn = document.getElementById('prevImage');
    const nextBtn = document.getElementById('nextImage');
    const counter = document.getElementById('galleryCounter');
    const thumbnails = document.getElementById('productThumbnails');
    
    // Mostrar imagen actual
    gallery.innerHTML = `<img src="${productImages[currentImageIndex]}" alt="Producto">`;
    
    // Actualizar contador
    if (productImages.length > 1) {
        document.getElementById('currentImage').textContent = currentImageIndex + 1;
        document.getElementById('totalImages').textContent = productImages.length;
        counter.style.display = 'block';
        
        // Mostrar botones de navegación
        prevBtn.style.display = 'flex';
        nextBtn.style.display = 'flex';
        
        // Habilitar/deshabilitar botones
        prevBtn.disabled = currentImageIndex === 0;
        nextBtn.disabled = currentImageIndex === productImages.length - 1;
        
        // Renderizar miniaturas
        thumbnails.style.display = 'grid';
        thumbnails.innerHTML = productImages.map((img, index) => `
            <div class="thumbnail ${index === currentImageIndex ? 'active' : ''}" onclick="goToImage(${index})">
                <img src="${img}" alt="Miniatura ${index + 1}">
            </div>
        `).join('');
    } else {
        counter.style.display = 'none';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        thumbnails.style.display = 'none';
    }
}

// Navegar a imagen específica
function goToImage(index) {
    currentImageIndex = index;
    renderGallery();
}

// Imagen anterior
function previousImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        renderGallery();
    }
}

// Imagen siguiente
function nextImage() {
    if (currentImageIndex < productImages.length - 1) {
        currentImageIndex++;
        renderGallery();
    }
}

// Mostrar especificaciones
function mostrarEspecificaciones(producto) {
    const especificaciones = obtenerEspecificaciones(producto);
    
    specsGrid.innerHTML = especificaciones.map(spec => `
        <div class="spec-item">
            <span class="spec-label">${spec.label}</span>
            <span class="spec-value">${spec.value}</span>
        </div>
    `).join('');
}

// Obtener especificaciones según el tipo de producto
function obtenerEspecificaciones(producto) {
    const specs = [];
    
    // Especificaciones comunes
    specs.push({ label: 'Marca', value: producto.marca });
    specs.push({ label: 'Categoría', value: producto.categoria.replace('-', ' ') });
    specs.push({ label: 'Stock Disponible', value: `${producto.stock} unidades` });
    specs.push({ label: 'Precio', value: `$${producto.precio}` });
    
    // Especificaciones específicas por categoría
    switch (producto.categoria) {
        case 'procesadores':
            specs.push({ label: 'Núcleos', value: producto.nucleos || 'No especificado' });
            specs.push({ label: 'Hilos', value: producto.hilos || 'No especificado' });
            specs.push({ label: 'Frecuencia Base', value: producto.frecuencia || 'No especificado' });
            specs.push({ label: 'Socket', value: producto.socket || 'No especificado' });
            break;
            
        case 'placas-video':
            specs.push({ label: 'Memoria VRAM', value: producto.vram || 'No especificado' });
            specs.push({ label: 'Tipo de Memoria', value: producto.tipoMemoria || 'No especificado' });
            specs.push({ label: 'Ancho de Banda', value: producto.anchoBanda || 'No especificado' });
            specs.push({ label: 'Interfaz', value: producto.interfaz || 'PCIe' });
            break;
            
        case 'memorias-ram':
            specs.push({ label: 'Capacidad Total', value: producto.capacidad || 'No especificado' });
            specs.push({ label: 'Tipo', value: producto.tipo || 'No especificado' });
            specs.push({ label: 'Velocidad', value: producto.velocidad || 'No especificado' });
            specs.push({ label: 'Latencia', value: producto.latencia || 'No especificado' });
            break;
            
        case 'gabinetes':
            specs.push({ label: 'Factor de Forma', value: producto.factorForma || 'ATX' });
            specs.push({ label: 'Material', value: producto.material || 'No especificado' });
            specs.push({ label: 'Ventiladores Incluidos', value: producto.ventiladores || 'No especificado' });
            specs.push({ label: 'Panel Lateral', value: producto.panelLateral || 'No especificado' });
            break;
    }
    
    return specs;
}

// Mostrar productos relacionados
function mostrarProductosRelacionados(producto) {
    const productosRelacionados = productos
        .filter(p => p.id !== producto.id && p.categoria === producto.categoria)
        .slice(0, 4);
    
    if (productosRelacionados.length === 0) {
        relatedGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">No hay productos relacionados disponibles</p>';
        return;
    }
    
    relatedGrid.innerHTML = productosRelacionados.map(relacionado => {
        // Determinar si mostrar imagen o ícono
        let imagenHTML;
        if (relacionado.coverImage) {
            imagenHTML = `<img src="${relacionado.coverImage}" alt="${relacionado.nombre}">`;
        } else if (relacionado.imagen && relacionado.imagen.startsWith('/uploads/')) {
            imagenHTML = `<img src="${relacionado.imagen}" alt="${relacionado.nombre}">`;
        } else {
            imagenHTML = `<i class="${relacionado.imagen || 'fas fa-box'}"></i>`;
        }
        
        return `
            <div class="related-card" onclick="window.location.href='/producto?id=${relacionado.id}'">
                <div class="related-card-image">
                    ${imagenHTML}
                </div>
                <div class="related-card-info">
                    <h3>${relacionado.nombre}</h3>
                    <div class="price">$${relacionado.precio}</div>
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); window.location.href='/producto?id=${relacionado.id}'">
                        <i class="fas fa-info-circle"></i> Ver más
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Mostrar error
function mostrarError() {
    loading.style.display = 'none';
    error.style.display = 'block';
}

// Actualizar estado de los botones de cantidad
function actualizarEstadoBotones() {
    if (!productoActual) return;
    
    const currentValue = parseInt(quantityInput.value);
    const maxValue = Math.min(productoActual.stock, 10);
    
    // Deshabilitar botón menos si está en 1
    quantityMinus.disabled = currentValue <= 1;
    
    // Deshabilitar botón más si está en el máximo
    quantityPlus.disabled = currentValue >= maxValue;
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Controles de galería
    document.getElementById('prevImage').addEventListener('click', previousImage);
    document.getElementById('nextImage').addEventListener('click', nextImage);
    
    // Controles de cantidad
    quantityMinus.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            actualizarEstadoBotones();
        }
    });
    
    quantityPlus.addEventListener('click', function() {
        const currentValue = parseInt(quantityInput.value);
        const maxValue = Math.min(productoActual.stock, 10);
        if (currentValue < maxValue) {
            quantityInput.value = currentValue + 1;
            actualizarEstadoBotones();
        }
    });
    
    // Validar cantidad manual
    quantityInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        const maxValue = Math.min(productoActual.stock, 10);
        
        if (value < 1) {
            this.value = 1;
        } else if (value > maxValue) {
            this.value = maxValue;
        }
        actualizarEstadoBotones();
    });
    
    // Agregar al carrito
    addToCartBtn.addEventListener('click', function() {
        if (!productoActual) return;
        
        const cantidad = parseInt(quantityInput.value);
        
        // Verificar stock
        if (cantidad > productoActual.stock) {
            mostrarNotificacion('No hay suficiente stock disponible', 'error');
            return;
        }
        
        // Agregar al carrito
        const itemExistente = carrito.find(item => item.id === productoActual.id);
        
        if (itemExistente) {
            itemExistente.cantidad += cantidad;
        } else {
        carrito.push({
            id: productoActual.id,
            nombre: productoActual.nombre,
            precio: productoActual.precio,
            cantidad: cantidad,
            stock: productoActual.stock,
            imagen: productoActual.imagen,
            categoria: productoActual.categoria,
            marca: productoActual.marca
        });
        }
        
        guardarCarrito();
        mostrarNotificacion(`${productoActual.nombre} agregado al carrito`, 'success');
    });
    
    // Comprar ahora
    buyNowBtn.addEventListener('click', function() {
        if (!productoActual) return;
        
        const cantidad = parseInt(quantityInput.value);
        
        // Verificar stock
        if (cantidad > productoActual.stock) {
            mostrarNotificacion('No hay suficiente stock disponible', 'error');
            return;
        }
        
        // Agregar al carrito
        const itemExistente = carrito.find(item => item.id === productoActual.id);
        
        if (itemExistente) {
            itemExistente.cantidad += cantidad;
        } else {
            carrito.push({
                id: productoActual.id,
                nombre: productoActual.nombre,
                precio: productoActual.precio,
                cantidad: cantidad,
                stock: productoActual.stock,
                imagen: productoActual.imagen,
                categoria: productoActual.categoria,
                marca: productoActual.marca
            });
        }
        
        guardarCarrito();
        mostrarNotificacion(`${productoActual.nombre} agregado al carrito`, 'success');
        
        // Redirigir al carrito
        setTimeout(() => {
            window.location.href = '/carrito';
        }, 500);
    });
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
        cartCount.style.display = 'flex'; // Siempre mostrar el contador
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;

    notificacion.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notificacion);

    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    }, 3000);
}

// Inicializar menú hamburguesa (reutilizado del script principal)
function inicializarMenuHamburguesa() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-menu .nav-link');

    if (!hamburgerBtn) return;

    hamburgerBtn.addEventListener('click', function() {
        hamburgerBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    });

    mobileOverlay.addEventListener('click', function() {
        cerrarMenuHamburguesa();
    });

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            cerrarMenuHamburguesa();
        });
    });

    function cerrarMenuHamburguesa() {
        hamburgerBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileOverlay.classList.remove('active');
    }
}
