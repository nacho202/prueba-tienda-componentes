// Variables globales
let productos = [];
let ventas = [];
let categorias = [];
let cupones = [];
let isAuthenticated = false;
let currentUser = null;

// URL base de la API
const API_URL = 'http://localhost:3000/api';

// Verificar conexión con el servidor
async function verificarConexionServidor() {
    try {
        const response = await fetch(`${API_URL}/health`, { 
            method: 'GET',
            cache: 'no-cache'
        });
        if (!response.ok) throw new Error('Servidor no responde');
        const data = await response.json();
        console.log('✅ Conexión con servidor exitosa:', data.message);
        return true;
    } catch (error) {
        console.error('❌ No se puede conectar al servidor:', error);
        return false;
    }
}

// Obtener credenciales desde el servidor
async function getAdminCredentials() {
    try {
        const response = await fetch(`${API_URL}/credentials`);
        if (!response.ok) throw new Error('Error al obtener credenciales');
        return await response.json();
    } catch (error) {
        console.error('Error al obtener credenciales:', error);
        // Credenciales por defecto en caso de error
        return { username: 'admin', password: 'admin123' };
    }
}

// Guardar credenciales en el servidor
async function saveAdminCredentials(credentials) {
    try {
        const response = await fetch(`${API_URL}/credentials`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        
        if (!response.ok) throw new Error('Error al guardar credenciales');
        return await response.json();
    } catch (error) {
        console.error('Error al guardar credenciales:', error);
        throw error;
    }
}

// Captcha
let captchaAnswer = 0;

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin panel loaded');
    
    // Verificar conexión con el servidor
    const serverOnline = await verificarConexionServidor();
    if (!serverOnline) {
        mostrarAlertaServidor();
    }
    
    // Verificar si ya está autenticado
    checkAuthentication();
    
    // Inicializar captcha
    generateCaptcha();
    
    // Event listeners
    inicializarEventListeners();
});

// Mostrar alerta de servidor no disponible
function mostrarAlertaServidor() {
    const alerta = document.createElement('div');
    alerta.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #fee;
        border: 2px solid #f00;
        padding: 1.5rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        max-width: 500px;
        text-align: center;
    `;
    alerta.innerHTML = `
        <div style="color: #c00; font-size: 1.2rem; font-weight: bold; margin-bottom: 0.5rem;">
            ⚠️ SERVIDOR NO INICIADO
        </div>
        <p style="margin: 0.5rem 0; color: #666;">
            Ejecuta <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">npm start</code> 
            en la terminal para iniciar el servidor.
        </p>
        <button onclick="location.reload()" style="
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        ">
            Reintentar
        </button>
    `;
    document.body.appendChild(alerta);
}

// Verificar autenticación
async function checkAuthentication() {
    const session = localStorage.getItem('adminSession');
    if (session) {
        const sessionData = JSON.parse(session);
        const sessionTime = Date.now() - sessionData.timestamp;
        
        // Sesión válida por 4 horas
        if (sessionTime < 4 * 60 * 60 * 1000) {
            isAuthenticated = true;
            currentUser = sessionData.username;
            await showAdminPanel();
            return;
        }
    }
    
    showLoginScreen();
}

// Mostrar pantalla de login
function showLoginScreen() {
    document.getElementById('adminLogin').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

// Mostrar panel de administración
async function showAdminPanel() {
    document.getElementById('adminLogin').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'grid';
    document.getElementById('adminUsername').textContent = currentUser;
    
    // Cargar datos iniciales y esperar a que terminen
    await cargarDatos();
}

// Generar captcha simple
function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = num1 + num2;
    document.getElementById('captchaQuestion').textContent = `${num1} + ${num2}`;
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Navegación
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            showSection(section);
        });
    });
    
    // Botones de productos
    document.getElementById('addProductBtn')?.addEventListener('click', () => {
        window.location.href = 'edit-product.html';
    });
    document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
    document.getElementById('cancelProductBtn')?.addEventListener('click', closeProductModal);
    document.getElementById('closeProductModal')?.addEventListener('click', closeProductModal);
    
    // Botones de categorías
    document.getElementById('addCategoryBtn')?.addEventListener('click', () => openCategoryModal());
    document.getElementById('saveCategoryBtn')?.addEventListener('click', saveCategory);
    document.getElementById('cancelCategoryBtn')?.addEventListener('click', closeCategoryModal);
    document.getElementById('closeCategoryModal')?.addEventListener('click', closeCategoryModal);
    
    // Búsqueda de productos
    document.getElementById('productSearch')?.addEventListener('input', function() {
        filtrarProductos(this.value);
    });
    
    // Filtros de ventas
    document.getElementById('salesFilter')?.addEventListener('change', function() {
        filtrarVentas(this.value);
    });
    
    // Exportar ventas
    document.getElementById('exportSalesBtn')?.addEventListener('click', exportarVentas);
    
    // Configuración
    document.getElementById('changePasswordForm')?.addEventListener('submit', cambiarContrasena);
    document.getElementById('backupDataBtn')?.addEventListener('click', descargarBackup);
    document.getElementById('clearSalesBtn')?.addEventListener('click', limpiarHistorialVentas);
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const captcha = parseInt(document.getElementById('captcha').value);
    const errorDiv = document.getElementById('loginError');
    
    // Validar captcha
    if (captcha !== captchaAnswer) {
        errorDiv.textContent = 'Captcha incorrecto';
        errorDiv.style.display = 'block';
        generateCaptcha();
        document.getElementById('captcha').value = '';
        return;
    }
    
    // Verificar servidor
    const serverOnline = await verificarConexionServidor();
    if (!serverOnline) {
        errorDiv.textContent = 'No se puede conectar al servidor. Ejecuta "npm start"';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Validar credenciales desde el servidor
    const credentials = await getAdminCredentials();
    if (username === credentials.username && password === credentials.password) {
        isAuthenticated = true;
        currentUser = username;
        
        // Guardar sesión
        localStorage.setItem('adminSession', JSON.stringify({
            username: username,
            timestamp: Date.now()
        }));
        
        await showAdminPanel();
        mostrarNotificacion('Inicio de sesión exitoso', 'success');
    } else {
        errorDiv.textContent = 'Usuario o contraseña incorrectos';
        errorDiv.style.display = 'block';
        generateCaptcha();
        document.getElementById('captcha').value = '';
    }
}

// Manejar logout
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        isAuthenticated = false;
        currentUser = null;
        localStorage.removeItem('adminSession');
        showLoginScreen();
        mostrarNotificacion('Sesión cerrada exitosamente', 'success');
    }
}

// Mostrar sección
function showSection(section) {
    // Actualizar navegación
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    
    // Actualizar secciones
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${section}Section`).classList.add('active');
    
    // Actualizar título
    const titles = {
        dashboard: 'Dashboard',
        products: 'Gestión de Productos',
        sales: 'Historial de Ventas',
        categories: 'Categorías',
        coupons: 'Gestión de Cupones',
        settings: 'Configuración'
    };
    document.getElementById('sectionTitle').textContent = titles[section];
}

// Cargar datos iniciales
async function cargarDatos() {
    // Cargar todos los datos en paralelo
    await Promise.all([
        cargarProductos(),
        cargarVentas(),
        cargarCategorias(),
        cargarCupones()
    ]);
    
    // Una vez que todos los datos están cargados, actualizar el dashboard
    actualizarDashboard();
}

// Cargar productos desde la API
async function cargarProductos() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }
        productos = await response.json();
        console.log('✅ Productos cargados desde products.json:', productos.length, 'productos');
        mostrarProductos();
        actualizarSelectCategorias();
        
        if (productos.length === 0) {
            mostrarNotificacion('⚠️ No hay productos en products.json', 'info');
        }
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        mostrarNotificacion('❌ ERROR: No se puede conectar al servidor. Ejecuta "npm start" en la terminal.', 'error');
        
        // Mostrar mensaje en la tabla
        const tbody = document.getElementById('productsTable');
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <div style="color: #ef4444; font-size: 1.2rem; margin-bottom: 1rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                        <strong>Servidor no iniciado</strong>
                    </div>
                    <p style="color: #6b7280; margin-bottom: 1rem;">
                        Para cargar los productos, debes iniciar el servidor Node.js.
                    </p>
                    <div style="background: #f3f4f6; padding: 1rem; border-radius: 8px; text-align: left; max-width: 500px; margin: 0 auto;">
                        <strong>Pasos:</strong>
                        <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            <li>Abre la terminal en la carpeta del proyecto</li>
                            <li>Ejecuta: <code style="background: #e5e7eb; padding: 0.2rem 0.5rem; border-radius: 4px;">npm install</code></li>
                            <li>Ejecuta: <code style="background: #e5e7eb; padding: 0.2rem 0.5rem; border-radius: 4px;">npm start</code></li>
                            <li>Recarga esta página</li>
                        </ol>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Mostrar productos en tabla
function mostrarProductos() {
    const tbody = document.getElementById('productsTable');
    
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay productos registrados</td></tr>';
        return;
    }
    
    tbody.innerHTML = productos.map(producto => {
        // Determinar si tiene imagen, video o usar ícono
        let mediaContent = '';
        if (producto.coverImage) {
            const isVideo = producto.coverImage.match(/\.(mp4|webm)$/i);
            if (isVideo) {
                mediaContent = `<video src="${producto.coverImage}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
            } else {
                mediaContent = `<img src="${producto.coverImage}" alt="${producto.nombre}" style="width: 100%; height: 100%; object-fit: cover;">`;
            }
        } else {
            mediaContent = `<i class="fas ${producto.imagen || 'fa-box'}"></i>`;
        }
        
        return `
        <tr>
            <td>${producto.id}</td>
            <td>
                <div class="product-image-cell">
                    ${mediaContent}
                </div>
            </td>
            <td><strong>${producto.nombre}</strong></td>
            <td>${producto.categoria.replace('-', ' ')}</td>
            <td><strong>$${producto.precio}</strong></td>
            <td>
                <span class="status-badge ${producto.stock < 10 ? 'low-stock' : 'active'}">
                    ${producto.stock} unidades
                </span>
            </td>
            <td>
                <span class="status-badge ${producto.destacado ? 'active' : 'inactive'}">
                    ${producto.destacado ? 'Destacado' : 'Normal'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editarProducto(${producto.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="eliminarProducto(${producto.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Filtrar productos
function filtrarProductos(termino) {
    const productosFiltrados = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        producto.categoria.toLowerCase().includes(termino.toLowerCase())
    );
    
    const tbody = document.getElementById('productsTable');
    
    if (productosFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No se encontraron productos</td></tr>';
        return;
    }
    
    tbody.innerHTML = productosFiltrados.map(producto => `
        <tr>
            <td>${producto.id}</td>
            <td>
                <div class="product-image-cell">
                    <i class="fas ${producto.imagen}"></i>
                </div>
            </td>
            <td><strong>${producto.nombre}</strong></td>
            <td>${producto.categoria.replace('-', ' ')}</td>
            <td><strong>$${producto.precio}</strong></td>
            <td>
                <span class="status-badge ${producto.stock < 10 ? 'low-stock' : 'active'}">
                    ${producto.stock} unidades
                </span>
            </td>
            <td>
                <span class="status-badge ${producto.destacado ? 'active' : 'inactive'}">
                    ${producto.destacado ? 'Destacado' : 'Normal'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editarProducto(${producto.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="eliminarProducto(${producto.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Abrir modal de producto
function openProductModal(productoId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    form.reset();
    
    if (productoId) {
        const producto = productos.find(p => p.id === productoId);
        if (producto) {
            document.getElementById('productModalTitle').textContent = 'Editar Producto';
            document.getElementById('productId').value = producto.id;
            document.getElementById('productName').value = producto.nombre;
            document.getElementById('productCategory').value = producto.categoria;
            document.getElementById('productPrice').value = producto.precio;
            document.getElementById('productStock').value = producto.stock;
            document.getElementById('productShortDesc').value = producto.descripcionCorta;
            document.getElementById('productDescription').value = producto.descripcion;
            document.getElementById('productIcon').value = producto.imagen;
            document.getElementById('productBrand').value = producto.marca || '';
            document.getElementById('productFeatured').checked = producto.destacado;
        }
    } else {
        document.getElementById('productModalTitle').textContent = 'Agregar Producto';
        document.getElementById('productId').value = '';
    }
    
    modal.style.display = 'block';
}

// Cerrar modal de producto
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Guardar producto
async function saveProduct() {
    const productId = document.getElementById('productId').value;
    const nombre = document.getElementById('productName').value;
    const categoria = document.getElementById('productCategory').value;
    const precio = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const descripcionCorta = document.getElementById('productShortDesc').value;
    const descripcion = document.getElementById('productDescription').value;
    const imagen = document.getElementById('productIcon').value;
    const marca = document.getElementById('productBrand').value;
    const destacado = document.getElementById('productFeatured').checked;
    
    if (!nombre || !categoria || !precio || !stock) {
        mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    try {
        if (productId) {
            // Editar producto existente
            const productoActualizado = {
                nombre,
                categoria,
                precio,
                stock,
                descripcionCorta,
                descripcion,
                imagen,
                marca,
                destacado
            };
            
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoActualizado)
            });
            
            if (!response.ok) throw new Error('Error al actualizar');
            
            mostrarNotificacion('✅ Producto actualizado en products.json', 'success');
        } else {
            // Agregar nuevo producto
            const nuevoProducto = {
                nombre,
                categoria,
                precio,
                stock,
                descripcionCorta,
                descripcion,
                imagen,
                marca,
                destacado,
                especificaciones: {}
            };
            
            const response = await fetch(`${API_URL}/products/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoProducto)
            });
            
            if (!response.ok) throw new Error('Error al agregar');
            
            mostrarNotificacion('✅ Producto agregado a products.json', 'success');
        }
        
        // Recargar productos desde el servidor
        await cargarProductos();
        closeProductModal();
        actualizarDashboard();
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        mostrarNotificacion('Error al guardar producto', 'error');
    }
}

// Editar producto - Redirigir a página de edición
function editarProducto(id) {
    window.location.href = `edit-product.html?id=${id}`;
}

// Eliminar producto
async function eliminarProducto(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar');
            
            mostrarNotificacion('✅ Producto eliminado de products.json', 'success');
            
            // Recargar productos
            await cargarProductos();
            actualizarDashboard();
            
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            mostrarNotificacion('Error al eliminar producto', 'error');
        }
    }
}

// Cargar ventas desde la API
async function cargarVentas() {
    try {
        const response = await fetch(`${API_URL}/sales`);
        if (!response.ok) {
            throw new Error('Error al cargar ventas');
        }
        ventas = await response.json();
        console.log('✅ Ventas cargadas desde sales.json:', ventas.length, 'ventas');
        mostrarVentas();
    } catch (error) {
        console.error('❌ Error al cargar ventas:', error);
        // No mostrar notificación aquí para evitar spam, ya se mostró en productos
    }
}

// Mostrar ventas
function mostrarVentas(ventasFiltradas = ventas) {
    const tbody = document.getElementById('salesTable');
    const recentTable = document.getElementById('recentSalesTable');
    
    if (ventasFiltradas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay ventas registradas con este filtro</td></tr>';
        return;
    }
    
    // Tabla completa de ventas (con filas clicables)
    tbody.innerHTML = ventasFiltradas.map((venta, index) => {
        // Encontrar el índice real en el array completo de ventas
        const indiceReal = ventas.findIndex(v => v.numeroPedido === venta.numeroPedido);
        return `
        <tr class="clickable-row" onclick="abrirDetalleVenta(${indiceReal})" style="cursor: pointer;">
            <td><strong>${venta.numeroPedido}</strong></td>
            <td>${venta.cliente}</td>
            <td>${venta.email}</td>
            <td>${venta.productos.length} productos</td>
            <td><strong>$${venta.total.toFixed(2)}</strong></td>
            <td>${venta.metodoPago}</td>
            <td>${new Date(venta.fecha).toLocaleString('es-ES')}</td>
            <td>
                <button class="btn-icon btn-view" onclick="event.stopPropagation(); verDetalleVenta(${indiceReal})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        </tr>
        `;
    }).join('');
    
    // Ventas recientes (últimas 5) - solo en dashboard
    if (recentTable) {
        const ventasRecientes = ventas.slice(-5).reverse();
        recentTable.innerHTML = ventasRecientes.map((venta) => `
            <tr>
                <td><strong>${venta.numeroPedido}</strong></td>
                <td>${venta.cliente}</td>
                <td>${new Date(venta.fecha).toLocaleDateString('es-ES')}</td>
                <td><strong>$${venta.total.toFixed(2)}</strong></td>
                <td>
                    <span class="status-badge active">Completado</span>
                </td>
            </tr>
        `).join('');
    }
}

// Filtrar ventas
function filtrarVentas(filtro) {
    const ahora = new Date();
    let ventasFiltradas = ventas;
    
    switch(filtro) {
        case 'today':
            ventasFiltradas = ventas.filter(venta => {
                const fechaVenta = new Date(venta.fecha);
                return fechaVenta.toDateString() === ahora.toDateString();
            });
            break;
            
        case 'week':
            const inicioSemana = new Date(ahora);
            inicioSemana.setDate(ahora.getDate() - 7);
            ventasFiltradas = ventas.filter(venta => {
                const fechaVenta = new Date(venta.fecha);
                return fechaVenta >= inicioSemana;
            });
            break;
            
        case 'month':
            const inicioMes = new Date(ahora);
            inicioMes.setMonth(ahora.getMonth() - 1);
            ventasFiltradas = ventas.filter(venta => {
                const fechaVenta = new Date(venta.fecha);
                return fechaVenta >= inicioMes;
            });
            break;
            
        case 'year':
            const inicioAno = new Date(ahora);
            inicioAno.setFullYear(ahora.getFullYear() - 1);
            ventasFiltradas = ventas.filter(venta => {
                const fechaVenta = new Date(venta.fecha);
                return fechaVenta >= inicioAno;
            });
            break;
            
        case 'all':
        default:
            ventasFiltradas = ventas;
            break;
    }
    
    mostrarVentas(ventasFiltradas);
}

// Ver detalle de venta (alert rápido)
function verDetalleVenta(index) {
    const venta = ventas[index];
    const detalles = `
Pedido: ${venta.numeroPedido}
Cliente: ${venta.cliente}
Email: ${venta.email}
Teléfono: ${venta.telefono}
Dirección: ${venta.direccion}
Método de Pago: ${venta.metodoPago}
Total: $${venta.total.toFixed(2)}
Fecha: ${new Date(venta.fecha).toLocaleString('es-ES')}

Productos:
${venta.productos.map(p => `- ${p.nombre} x${p.cantidad}: $${(p.precio * p.cantidad).toFixed(2)}`).join('\n')}
    `;
    
    alert(detalles);
}

// Abrir página de detalle de venta
function abrirDetalleVenta(index) {
    // Guardar el índice de la venta en localStorage
    localStorage.setItem('ventaDetalleIndex', index);
    // Abrir la página de detalle
    window.open('venta-detalle.html', '_blank');
}

// Exportar ventas
function exportarVentas() {
    if (ventas.length === 0) {
        mostrarNotificacion('No hay ventas para exportar', 'error');
        return;
    }
    
    const csv = [
        ['Pedido', 'Cliente', 'Email', 'Total', 'Método Pago', 'Fecha'].join(','),
        ...ventas.map(v => [
            v.numeroPedido,
            v.cliente,
            v.email,
            v.total.toFixed(2),
            v.metodoPago,
            new Date(v.fecha).toLocaleDateString('es-ES')
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    mostrarNotificacion('Ventas exportadas exitosamente', 'success');
}

// Cargar categorías
async function cargarCategorias() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) {
            throw new Error('Error al cargar categorías');
        }
        categorias = await response.json();
        console.log('✅ Categorías cargadas desde categorias.json:', categorias.length, 'categorías');
        mostrarCategorias();
        actualizarSelectCategorias();
    } catch (error) {
        console.error('❌ Error al cargar categorías:', error);
        mostrarNotificacion('Error al cargar categorías', 'error');
    }
}

// Mostrar categorías
function mostrarCategorias() {
    const grid = document.getElementById('categoriesGrid');
    
    if (categorias.length === 0) {
        grid.innerHTML = '<div class="empty-state">No hay categorías registradas</div>';
        return;
    }
    
    grid.innerHTML = categorias.map(cat => `
        <div class="category-card">
            <div class="category-icon">
                <i class="fas ${cat.icon}"></i>
            </div>
            <div class="category-info">
                <h3>${cat.nombre}</h3>
                <p>${cat.slug}</p>
            </div>
            <div class="category-actions">
                <button class="btn-icon btn-edit" onclick="editarCategoria(${cat.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="eliminarCategoria(${cat.id})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Actualizar select de categorías
function actualizarSelectCategorias() {
    const select = document.getElementById('productCategory');
    if (select) {
        select.innerHTML = '<option value="">Seleccionar categoría</option>' +
            categorias.map(cat => `<option value="${cat.slug}">${cat.nombre}</option>`).join('');
    }
}

// Abrir modal de categoría
function openCategoryModal(categoriaId = null) {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    form.reset();
    
    if (categoriaId) {
        const categoria = categorias.find(c => c.id === categoriaId);
        if (categoria) {
            document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
            document.getElementById('categoryId').value = categoria.id;
            document.getElementById('categoryName').value = categoria.nombre;
            document.getElementById('categorySlug').value = categoria.slug;
            document.getElementById('categoryIcon').value = categoria.icon;
            document.getElementById('categoryDescription').value = categoria.descripcion || '';
        }
    } else {
        document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
        document.getElementById('categoryId').value = '';
    }
    
    modal.style.display = 'block';
}

// Cerrar modal de categoría
function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

// Guardar categoría
async function saveCategory() {
    const categoryId = document.getElementById('categoryId').value;
    const nombre = document.getElementById('categoryName').value;
    const slug = document.getElementById('categorySlug').value;
    const icon = document.getElementById('categoryIcon').value;
    const descripcion = document.getElementById('categoryDescription')?.value || '';
    
    if (!nombre || !icon) {
        mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    const categoriaData = {
        nombre,
        slug: slug || nombre.toLowerCase().replace(/\s+/g, '-'),
        icon,
        descripcion
    };
    
    try {
        let response;
        
        if (categoryId) {
            // Editar categoría existente
            response = await fetch(`${API_URL}/categories/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoriaData)
            });
            
            if (!response.ok) throw new Error('Error al actualizar');
            
            mostrarNotificacion('✅ Categoría actualizada en categorias.json', 'success');
        } else {
            // Agregar nueva categoría
            response = await fetch(`${API_URL}/categories/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoriaData)
            });
            
            if (!response.ok) throw new Error('Error al agregar');
            
            mostrarNotificacion('✅ Categoría agregada a categorias.json', 'success');
        }
        
        // Recargar categorías
        await cargarCategorias();
        closeCategoryModal();
        
    } catch (error) {
        console.error('Error al guardar categoría:', error);
        mostrarNotificacion('Error al guardar categoría', 'error');
    }
}

// Editar categoría
function editarCategoria(id) {
    openCategoryModal(id);
}

// Eliminar categoría
async function eliminarCategoria(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
        try {
            const response = await fetch(`${API_URL}/categories/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar');
            
            mostrarNotificacion('✅ Categoría eliminada de categorias.json', 'success');
            
            // Recargar categorías
            await cargarCategorias();
            
        } catch (error) {
            console.error('Error al eliminar categoría:', error);
            mostrarNotificacion('Error al eliminar categoría', 'error');
        }
    }
}

// Actualizar dashboard
function actualizarDashboard() {
    // Total de stock (suma de todos los stocks)
    const totalStock = productos.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
    document.getElementById('totalProducts').textContent = totalStock;
    
    // Stock bajo (cantidad de productos con stock menor a 10)
    const stockBajo = productos.filter(p => parseInt(p.stock) < 10).length;
    document.getElementById('lowStock').textContent = stockBajo;
    
    // Ventas totales
    const totalVentas = ventas.reduce((sum, v) => sum + (parseFloat(v.total) || 0), 0);
    document.getElementById('totalSales').textContent = `$${totalVentas.toFixed(2)}`;
    
    // Total de pedidos
    document.getElementById('totalOrders').textContent = ventas.length;
    
    console.log('📊 Dashboard actualizado:', {
        totalStock,
        stockBajo,
        totalVentas: totalVentas.toFixed(2),
        totalPedidos: ventas.length
    });
}

// Cambiar contraseña
async function cambiarContrasena(e) {
    e.preventDefault();
    
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    // Obtener credenciales actuales desde el servidor
    const credentials = await getAdminCredentials();
    
    if (current !== credentials.password) {
        mostrarNotificacion('Contraseña actual incorrecta', 'error');
        return;
    }
    
    if (newPass !== confirm) {
        mostrarNotificacion('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPass.length < 6) {
        mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        // Actualizar contraseña en el servidor
        credentials.password = newPass;
        await saveAdminCredentials(credentials);
        
        mostrarNotificacion('✅ Contraseña actualizada en admin_credentials.json', 'success');
        document.getElementById('changePasswordForm').reset();
    } catch (error) {
        mostrarNotificacion('Error al actualizar la contraseña', 'error');
    }
}

// Descargar backup
function descargarBackup() {
    const backup = {
        productos: productos,
        ventas: ventas,
        categorias: categorias,
        fecha: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-techstore-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    mostrarNotificacion('Backup descargado exitosamente', 'success');
}

// Limpiar historial de ventas
async function limpiarHistorialVentas() {
    if (confirm('¿Estás seguro de que deseas eliminar todo el historial de ventas? Esta acción no se puede deshacer.')) {
        try {
            const response = await fetch(`${API_URL}/sales`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al limpiar ventas');
            
            ventas = [];
            mostrarVentas();
            actualizarDashboard();
            mostrarNotificacion('✅ Historial de ventas limpiado de sales.json', 'success');
            
        } catch (error) {
            console.error('Error al limpiar ventas:', error);
            mostrarNotificacion('Error al limpiar historial', 'error');
        }
    }
}

// ===== CUPONES =====

// Cargar cupones desde la API
async function cargarCupones() {
    try {
        const response = await fetch(`${API_URL}/coupons`);
        if (!response.ok) {
            throw new Error('Error al cargar cupones');
        }
        cupones = await response.json();
        console.log('✅ Cupones cargados desde cupon.json:', cupones.length, 'cupones');
        mostrarCupones();
    } catch (error) {
        console.error('❌ Error al cargar cupones:', error);
    }
}

// Mostrar cupones en tabla
function mostrarCupones() {
    const tbody = document.getElementById('couponsTable');
    
    if (!cupones || cupones.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-ticket-alt" style="font-size: 3rem; color: #d1d5db; margin-bottom: 1rem;"></i>
                    <p>No hay cupones registrados</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = cupones.map(cupon => {
        const activo = cupon.activo === true || cupon.activo === 'true';
        const estadoBadge = activo 
            ? '<span class="badge badge-success">Activo</span>'
            : '<span class="badge badge-error">Inactivo</span>';
        
        const usoActual = cupon.usoActual || 0;
        const usoMaximo = cupon.usoMaximo || 0;
        const porcentajeUso = usoMaximo > 0 ? ((usoActual / usoMaximo) * 100).toFixed(0) : 0;
        
        const fechaExp = new Date(cupon.fechaExpiracion);
        const hoy = new Date();
        const expirado = fechaExp < hoy;
        
        return `
            <tr>
                <td>
                    <strong style="color: var(--primary-color); font-family: monospace;">
                        ${cupon.codigo}
                    </strong>
                </td>
                <td>
                    <span style="font-weight: bold; color: #10b981;">
                        ${cupon.descuento}%
                    </span>
                </td>
                <td style="max-width: 200px;">
                    ${cupon.descripcion || '-'}
                </td>
                <td>
                    ${cupon.fechaExpiracion}
                    ${expirado ? '<br><span class="badge badge-error">Expirado</span>' : ''}
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="flex: 1; background: #f3f4f6; height: 20px; border-radius: 10px; overflow: hidden;">
                            <div style="width: ${porcentajeUso}%; height: 100%; background: var(--primary-color); transition: width 0.3s;"></div>
                        </div>
                        <span style="font-size: 0.875rem; color: #6b7280;">${usoActual}/${usoMaximo}</span>
                    </div>
                </td>
                <td>${estadoBadge}</td>
                <td class="action-buttons">
                    <button class="btn-icon btn-primary" onclick="editarCupon('${cupon.codigo}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="eliminarCupon('${cupon.codigo}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Editar cupón - Redirigir a página de edición
function editarCupon(codigo) {
    window.location.href = `edit-coupon.html?codigo=${encodeURIComponent(codigo)}`;
}

// Eliminar cupón
async function eliminarCupon(codigo) {
    if (confirm(`¿Estás seguro de que deseas eliminar el cupón "${codigo}"?`)) {
        try {
            const response = await fetch(`${API_URL}/coupons/${encodeURIComponent(codigo)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar');
            
            mostrarNotificacion(`✅ Cupón "${codigo}" eliminado de cupon.json`, 'success');
            
            // Recargar cupones
            await cargarCupones();
            
        } catch (error) {
            console.error('Error al eliminar cupón:', error);
            mostrarNotificacion('Error al eliminar cupón', 'error');
        }
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notification notification-${tipo}`;
    notificacion.innerHTML = `
        <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${mensaje}</span>
    `;
    
    notificacion.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        background: ${tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
