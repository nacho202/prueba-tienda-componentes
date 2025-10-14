// Variables globales
let productos = [];
let productosFiltrados = [];
let carrito = [];
let categorias = [];

// URL de la API - ahora se define en config.js
// const API_URL = 'http://localhost:3000/api';

// ========== SISTEMA DE TRACKING UTM ==========

// Capturar parámetros UTM de la URL
function capturarUTMs() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const utmParams = {
        utm_source: urlParams.get('utm_source') || null,      // Ej: google, facebook, instagram
        utm_medium: urlParams.get('utm_medium') || null,      // Ej: cpc, email, social
        utm_campaign: urlParams.get('utm_campaign') || null,  // Ej: verano2024, blackfriday
        utm_term: urlParams.get('utm_term') || null,          // Ej: palabras clave
        utm_content: urlParams.get('utm_content') || null,    // Ej: banner_azul, link_texto
        referrer: document.referrer || null,                  // URL de referencia
        landing_page: window.location.href,                   // Página de aterrizaje
        timestamp: new Date().toISOString()                   // Momento de la visita
    };
    
    // Solo guardar si hay al menos un parámetro UTM
    if (utmParams.utm_source || utmParams.utm_medium || utmParams.utm_campaign) {
        localStorage.setItem('utmData', JSON.stringify(utmParams));
        console.log('✅ UTMs capturados:', utmParams);
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
        console.log('📊 Visita directa registrada');
    }
}

// Obtener datos UTM guardados
function obtenerUTMs() {
    const utmData = localStorage.getItem('utmData');
    return utmData ? JSON.parse(utmData) : null;
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

// Actualizar contador del carrito
function actualizarContadorCarrito() {
    const contador = document.getElementById('cart-count');
    if (contador) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        contador.textContent = totalItems;
        contador.style.display = 'flex'; // Siempre mostrar el contador
    }
}

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const noProducts = document.getElementById('noProducts');
const searchInput = document.getElementById('searchInput');
const priceRange = document.getElementById('priceRange');
const maxPrice = document.getElementById('maxPrice');
const sortSelect = document.getElementById('sortSelect');
const clearFiltersBtn = document.getElementById('clearFilters');
const cartCount = document.querySelector('.cart-count');
const productModal = document.getElementById('productModal');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalDescription = document.getElementById('modalDescription');
const modalPrice = document.getElementById('modalPrice');
const addToCartBtn = document.getElementById('addToCart');
const closeModal = document.querySelector('.close');

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    capturarUTMs(); // Capturar UTMs al cargar cualquier página
    inicializarCarrito();
    await cargarCategorias(); // Cargar categorías primero
    cargarProductos();
    inicializarEventListeners();
    inicializarNavegacion();
    cargarSeccionDesdeURL();
    inicializarMenuHamburguesa();
    inicializarFiltrosMovil();
});

// Cargar productos desde JSON
async function cargarProductos() {
    try {
        const response = await fetch('products.json');
        const data = await response.json();
        productos = data.productos;
        productosFiltrados = [...productos];
        mostrarProductos(productosFiltrados);
        // Cargar productos destacados después de cargar los productos
        cargarProductosDestacados();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarError('Error al cargar los productos');
    }
}

// Cargar categorías desde la API
async function cargarCategorias() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Error al cargar categorías');
        
        categorias = await response.json();
        console.log('✅ Categorías cargadas:', categorias.length);
        
        // Renderizar filtros de categorías
        renderizarFiltrosCategorias();
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        // Si falla, usar categorías por defecto
        categorias = [
            { id: 1, nombre: 'Procesadores', slug: 'procesadores' },
            { id: 2, nombre: 'Gabinetes', slug: 'gabinetes' },
            { id: 3, nombre: 'Placas de Video', slug: 'placas-video' },
            { id: 4, nombre: 'Memorias RAM', slug: 'memorias-ram' }
        ];
        renderizarFiltrosCategorias();
    }
}

// Renderizar filtros de categorías dinámicamente
function renderizarFiltrosCategorias() {
    // Filtros desktop (sidebar)
    const desktopFilters = document.querySelector('.sidebar .category-filters');
    if (desktopFilters) {
        desktopFilters.innerHTML = categorias.map(cat => `
            <label class="filter-item">
                <input type="checkbox" value="${cat.slug}" checked>
                <span>${cat.nombre}</span>
            </label>
        `).join('');
    }
    
    // Filtros móviles
    const mobileFilters = document.querySelector('.mobile-filters-panel .category-filters');
    if (mobileFilters) {
        mobileFilters.innerHTML = categorias.map(cat => `
            <label class="filter-item">
                <input type="checkbox" value="${cat.slug}" checked>
                <span>${cat.nombre}</span>
            </label>
        `).join('');
    }
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Filtros de categoría - solo los del sidebar (desktop)
    const categoryFilters = document.querySelectorAll('.sidebar .category-filters input[type="checkbox"]');
    categoryFilters.forEach(filter => {
        filter.addEventListener('change', aplicarFiltros);
    });

    // Filtro de precio
    priceRange.addEventListener('input', function() {
        maxPrice.textContent = this.value;
        updateSliderBackground(this);
        aplicarFiltros();
    });

    // Inicializar el fondo del slider
    updateSliderBackground(priceRange);

    // Búsqueda
    searchInput.addEventListener('input', aplicarFiltros);

    // Ordenamiento
    sortSelect.addEventListener('change', aplicarFiltros);

    // Limpiar filtros
    clearFiltersBtn.addEventListener('click', limpiarFiltros);

    // Modal
    closeModal.addEventListener('click', cerrarModal);
    window.addEventListener('click', function(event) {
        if (event.target === productModal) {
            cerrarModal();
        }
    });

    // Agregar al carrito
    addToCartBtn.addEventListener('click', agregarAlCarrito);
}

// Inicializar navegación
function inicializarNavegacion() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            // Solo interceptar enlaces que empiecen con # (navegación interna)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                
                // Cambiar la URL sin recargar la página
                window.history.pushState({}, '', `#${targetId}`);
                
                // Mostrar la sección correspondiente
                mostrarSeccion(targetId);
            }
            // Los enlaces como /carrito, /producto, etc. se dejan pasar normalmente
        });
    });
}

// Mostrar sección específica
function mostrarSeccion(targetId) {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    // Validar que el targetId sea una sección válida
    const validSections = ['inicio', 'productos', 'contacto'];
    if (!validSections.includes(targetId)) {
        // Redirigir a página 404 si el hash no es válido
        window.location.href = '/404';
        return;
    }
    
    // Actualizar navegación activa (tanto desktop como móvil)
    navLinks.forEach(l => l.classList.remove('active'));
    const activeLinks = document.querySelectorAll(`[href="#${targetId}"]`);
    activeLinks.forEach(link => link.classList.add('active'));
    
    // Mostrar sección correspondiente
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
            section.classList.add('active');
        }
    });

    // Scroll suave al inicio de la página
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    // Si estamos en la sección de inicio, cargar productos destacados
    if (targetId === 'inicio') {
        cargarProductosDestacados();
    }
}

// Cargar sección desde URL al cargar la página
function cargarSeccionDesdeURL() {
    const hash = window.location.hash.substring(1);
    if (hash) {
        mostrarSeccion(hash);
    } else {
        // Si no hay hash, mostrar inicio por defecto
        mostrarSeccion('inicio');
    }
}

// Escuchar cambios en la URL (navegación del navegador)
window.addEventListener('hashchange', function() {
    const hash = window.location.hash.substring(1);
    mostrarSeccion(hash);
});

// Inicializar menú hamburguesa
function inicializarMenuHamburguesa() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-menu .nav-link');

    // Toggle del menú hamburguesa
    hamburgerBtn.addEventListener('click', function() {
        hamburgerBtn.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
    });

    // Cerrar menú al hacer clic en el overlay
    mobileOverlay.addEventListener('click', function() {
        cerrarMenuHamburguesa();
    });

    // Cerrar menú al hacer clic en un enlace
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            cerrarMenuHamburguesa();
        });
    });

    // Función para cerrar el menú
    function cerrarMenuHamburguesa() {
        hamburgerBtn.classList.remove('active');
        mobileMenu.classList.remove('active');
        mobileOverlay.classList.remove('active');
    }
}

// Inicializar filtros móviles
function inicializarFiltrosMovil() {
    const filtersToggleBtn = document.getElementById('filtersToggleBtn');
    const mobileFiltersPanel = document.getElementById('mobileFiltersPanel');
    
    // Elementos de filtros móviles
    const priceRangeMobile = document.getElementById('priceRangeMobile');
    const maxPriceMobile = document.getElementById('maxPriceMobile');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const clearFiltersMobile = document.getElementById('clearFiltersMobile');
    const categoryFiltersMobile = document.querySelectorAll('.mobile-filters-panel .category-filters input[type="checkbox"]');

    // Toggle del panel de filtros
    filtersToggleBtn.addEventListener('click', function() {
        filtersToggleBtn.classList.toggle('active');
        mobileFiltersPanel.classList.toggle('active');
    });

    // Sincronizar filtros móviles con los de desktop
    function sincronizarFiltrosMovil() {
        // Sincronizar categorías
        const desktopCategoryFilters = document.querySelectorAll('.sidebar .category-filters input[type="checkbox"]');
        desktopCategoryFilters.forEach((desktopFilter, index) => {
            const mobileFilter = categoryFiltersMobile[index];
            if (mobileFilter) {
                mobileFilter.checked = desktopFilter.checked;
            }
        });

        // Sincronizar precio
        const desktopPriceRange = document.getElementById('priceRange');
        if (priceRangeMobile && desktopPriceRange) {
            priceRangeMobile.value = desktopPriceRange.value;
            maxPriceMobile.textContent = desktopPriceRange.value;
        }

        // Sincronizar búsqueda
        const desktopSearchInput = document.getElementById('searchInput');
        if (searchInputMobile && desktopSearchInput) {
            searchInputMobile.value = desktopSearchInput.value;
        }
    }

    // Event listeners para filtros móviles
    categoryFiltersMobile.forEach(filter => {
        filter.addEventListener('change', function() {
            // Sincronizar con filtros de desktop
            const desktopFilters = document.querySelectorAll('.sidebar .category-filters input[type="checkbox"]');
            const index = Array.from(categoryFiltersMobile).indexOf(this);
            if (desktopFilters[index]) {
                desktopFilters[index].checked = this.checked;
            }
            aplicarFiltros();
        });
    });

    if (priceRangeMobile) {
        priceRangeMobile.addEventListener('input', function() {
            maxPriceMobile.textContent = this.value;
            updateSliderBackground(this);
            // Sincronizar con filtros de desktop
            const desktopPriceRange = document.getElementById('priceRange');
            if (desktopPriceRange) {
                desktopPriceRange.value = this.value;
                updateSliderBackground(desktopPriceRange);
            }
            aplicarFiltros();
        });

        // Inicializar el fondo del slider móvil
        updateSliderBackground(priceRangeMobile);
    }

    if (searchInputMobile) {
        searchInputMobile.addEventListener('input', function() {
            // Sincronizar con filtros de desktop
            const desktopSearchInput = document.getElementById('searchInput');
            if (desktopSearchInput) {
                desktopSearchInput.value = this.value;
            }
            aplicarFiltros();
        });
    }

    if (clearFiltersMobile) {
        clearFiltersMobile.addEventListener('click', function() {
            limpiarFiltros();
            sincronizarFiltrosMovil();
        });
    }

    // Sincronizar al cargar la página
    sincronizarFiltrosMovil();
}

// Cargar productos destacados
function cargarProductosDestacados() {
    // Esperar un poco para asegurar que el DOM esté listo
    setTimeout(() => {
        const featuredGrid = document.getElementById('featuredGrid');
        if (!featuredGrid) {
            return;
        }

        // Filtrar productos destacados (solo boolean true)
        const productosDestacados = productos.filter(producto => 
            producto.destacado === true
        );
        
        if (productosDestacados.length === 0) {
            featuredGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); grid-column: 1 / -1;">No hay productos destacados disponibles</p>';
            return;
        }

        // Mostrar máximo 4 productos destacados
        const productosAMostrar = productosDestacados.slice(0, 4);
        
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

    featuredGrid.innerHTML = productosAMostrar.map(producto => `
        <div class="featured-card" onclick="window.location.href='/producto?id=${producto.id}'">
            <div class="featured-badge">Destacado</div>
            <div class="featured-image">
                ${producto.coverImage 
                    ? `<img src="${producto.coverImage}" alt="${producto.nombre}" loading="lazy">` 
                    : producto.imagen && producto.imagen.startsWith('/uploads/')
                        ? `<img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">`
                        : `<i class="${producto.imagen || 'fas fa-box'}"></i>`
                }
            </div>
            <div class="featured-info">
                <h3>${producto.nombre}</h3>
                <p class="featured-type">${formatearCategoria(producto.categoria)}</p>
                <p class="featured-description">${producto.descripcionCorta || ''}</p>
                <div class="featured-price">$${producto.precio}</div>
                <p class="featured-stock">Stock: ${producto.stock} unidades</p>
                <div class="featured-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); agregarAlCarritoDesdeCard(${producto.id})">
                        <i class="fas fa-cart-plus"></i> Agregar
                    </button>
                    <button class="btn btn-outline" onclick="event.stopPropagation(); window.location.href='/producto?id=${producto.id}'">
                        <i class="fas fa-info-circle"></i> Ver más
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    }, 100); // Esperar 100ms para asegurar que el DOM esté listo
}

// Mostrar productos
function mostrarProductos(productos) {
    if (productos.length === 0) {
        productsGrid.style.display = 'none';
        noProducts.style.display = 'block';
        return;
    }

    productsGrid.style.display = 'grid';
    noProducts.style.display = 'none';

    productsGrid.innerHTML = productos.map(producto => {
        const sinStock = producto.stock === 0;
        return `
        <div class="product-card ${sinStock ? 'out-of-stock' : ''}" onclick="abrirModal(${producto.id})">
            <div class="product-image">
                ${producto.coverImage 
                    ? `<img src="${producto.coverImage}" alt="${producto.nombre}" loading="lazy">` 
                    : `<i class="${producto.imagen || 'fas fa-box'}"></i>`
                }
                ${sinStock ? '<div class="out-of-stock-overlay"><span>SIN STOCK</span></div>' : ''}
            </div>
            <div class="product-info">
                <h3>${producto.nombre}</h3>
                <p class="product-category">${producto.categoria.replace('-', ' ')}</p>
                <p class="product-description">${producto.descripcionCorta}</p>
                <div class="product-price">$${producto.precio}</div>
                <p class="product-stock">Stock: ${producto.stock} unidades</p>
                <div class="product-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); agregarAlCarritoDesdeCard(${producto.id})" ${sinStock ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> ${sinStock ? 'No Disponible' : 'Agregar'}
                    </button>
                    <button class="btn btn-outline" onclick="event.stopPropagation(); window.location.href='/producto?id=${producto.id}'">
                        <i class="fas fa-info-circle"></i> Ver más
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// Aplicar filtros
function aplicarFiltros() {
    // Usar específicamente los filtros del sidebar (desktop)
    const categoriaFiltros = Array.from(document.querySelectorAll('.sidebar .category-filters input[type="checkbox"]:checked'))
        .map(input => input.value);
    
    const precioMaximo = parseInt(priceRange.value);
    const terminoBusqueda = searchInput.value.toLowerCase();
    const ordenamiento = sortSelect.value;

    // Empezar con todos los productos
    let filtrados = [...productos];

    // Filtrar por categoría - si no hay categorías seleccionadas, no mostrar ningún producto
    if (categoriaFiltros.length === 0) {
        filtrados = []; // No mostrar productos si no hay categorías seleccionadas
    } else {
        filtrados = filtrados.filter(producto => 
            categoriaFiltros.includes(producto.categoria)
        );
    }

    // Filtrar por precio
    filtrados = filtrados.filter(producto => 
        producto.precio <= precioMaximo
    );

    // Filtrar por búsqueda
    if (terminoBusqueda) {
        filtrados = filtrados.filter(producto => 
            producto.nombre.toLowerCase().includes(terminoBusqueda) ||
            producto.descripcion.toLowerCase().includes(terminoBusqueda) ||
            producto.marca.toLowerCase().includes(terminoBusqueda)
        );
    }

    // Ordenar
    switch (ordenamiento) {
        case 'price-low':
            filtrados.sort((a, b) => a.precio - b.precio);
            break;
        case 'price-high':
            filtrados.sort((a, b) => b.precio - a.precio);
            break;
        case 'name':
            filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        default:
            // Mantener orden original
            break;
    }

    productosFiltrados = filtrados;
    mostrarProductos(productosFiltrados);
}

// Limpiar filtros
function limpiarFiltros() {
    // Resetear checkboxes de categoría (tanto desktop como móvil)
    document.querySelectorAll('.category-filters input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
    });

    // Resetear precio
    priceRange.value = 2000;
    maxPrice.textContent = '2000';
    updateSliderBackground(priceRange);

    // Resetear búsqueda
    searchInput.value = '';

    // Resetear ordenamiento
    sortSelect.value = 'default';

    // Mostrar todos los productos
    productosFiltrados = [...productos];
    mostrarProductos(productosFiltrados);
}

// Abrir modal de producto
function abrirModal(productoId) {
    // Redirigir a la página de detalles del producto
    window.location.href = `/producto?id=${productoId}`;
}

// Cerrar modal
function cerrarModal() {
    productModal.style.display = 'none';
}

// Agregar al carrito desde modal
function agregarAlCarrito() {
    const productoId = parseInt(addToCartBtn.getAttribute('data-product-id'));
    agregarAlCarritoDesdeCard(productoId);
    cerrarModal();
}

// Agregar al carrito desde tarjeta
function agregarAlCarritoDesdeCard(productoId) {
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
            coverImage: producto.coverImage,
            categoria: producto.categoria,
            marca: producto.marca
        });
    }

    guardarCarrito();
    mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
}

// Actualizar contador del carrito
function actualizarCarrito() {
    const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
    cartCount.textContent = totalItems;
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;

    // Estilos para la notificación
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

    // Agregar estilos de animación
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notificacion);

    // Remover después de 3 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    }, 3000);
}

// Mostrar error
function mostrarError(mensaje) {
    mostrarNotificacion(mensaje, 'error');
}

// Función para obtener estadísticas de productos (útil para futuras funcionalidades)
function obtenerEstadisticas() {
    const estadisticas = {
        totalProductos: productos.length,
        porCategoria: {},
        precioPromedio: 0,
        stockTotal: 0
    };

    productos.forEach(producto => {
        // Contar por categoría
        if (!estadisticas.porCategoria[producto.categoria]) {
            estadisticas.porCategoria[producto.categoria] = 0;
        }
        estadisticas.porCategoria[producto.categoria]++;

        // Sumar precios y stock
        estadisticas.precioPromedio += producto.precio;
        estadisticas.stockTotal += producto.stock;
    });

    estadisticas.precioPromedio = Math.round(estadisticas.precioPromedio / productos.length);

    return estadisticas;
}

// Función para buscar productos por múltiples criterios
function buscarProductos(criterios) {
    return productos.filter(producto => {
        return Object.keys(criterios).every(criterio => {
            const valor = criterios[criterio];
            if (!valor) return true;

            switch (criterio) {
                case 'nombre':
                    return producto.nombre.toLowerCase().includes(valor.toLowerCase());
                case 'categoria':
                    return producto.categoria === valor;
                case 'precioMax':
                    return producto.precio <= valor;
                case 'precioMin':
                    return producto.precio >= valor;
                case 'marca':
                    return producto.marca.toLowerCase().includes(valor.toLowerCase());
                default:
                    return true;
            }
        });
    });
}

// Función para obtener productos relacionados (misma categoría)
function obtenerProductosRelacionados(productoId, limite = 4) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return [];

    return productos
        .filter(p => p.id !== productoId && p.categoria === producto.categoria)
        .slice(0, limite);
}

// Función para ordenar productos por diferentes criterios
function ordenarProductos(productos, criterio, direccion = 'asc') {
    const productosOrdenados = [...productos];
    
    productosOrdenados.sort((a, b) => {
        let valorA, valorB;
        
        switch (criterio) {
            case 'precio':
                valorA = a.precio;
                valorB = b.precio;
                break;
            case 'nombre':
                valorA = a.nombre.toLowerCase();
                valorB = b.nombre.toLowerCase();
                break;
            case 'stock':
                valorA = a.stock;
                valorB = b.stock;
                break;
            default:
                return 0;
        }
        
        if (direccion === 'desc') {
            return valorB > valorA ? 1 : valorB < valorA ? -1 : 0;
        } else {
            return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
        }
    });
    
    return productosOrdenados;
}

// Función para actualizar el fondo del slider basado en su valor
function updateSliderBackground(slider) {
    const min = parseInt(slider.min) || 0;
    const max = parseInt(slider.max) || 2000;
    const value = parseInt(slider.value);
    
    // Calcular el porcentaje
    const percentage = ((value - min) / (max - min)) * 100;
    
    // Aplicar el gradiente con color gris real para la parte no seleccionada
    slider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percentage}%, #d1d5db ${percentage}%, #d1d5db 100%)`;
}

// Exportar funciones para uso global
window.abrirModal = abrirModal;
window.agregarAlCarritoDesdeCard = agregarAlCarritoDesdeCard;
