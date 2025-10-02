// Variables globales
const API_URL = 'http://localhost:3000/api';
let originalCodigo = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    checkAuthentication();
    
    // Obtener código del cupón desde URL
    const urlParams = new URLSearchParams(window.location.search);
    const codigo = urlParams.get('codigo');
    
    if (codigo) {
        // Modo edición
        document.getElementById('titleText').textContent = 'Editar Cupón';
        originalCodigo = decodeURIComponent(codigo);
        await cargarCupon(originalCodigo);
    } else {
        // Modo creación
        document.getElementById('titleText').textContent = 'Agregar Cupón';
        document.getElementById('pageTitle').innerHTML = '<i class="fas fa-plus"></i> <span id="titleText">Agregar Cupón</span>';
        // Establecer fecha mínima y por defecto
        setDefaultDate();
    }
    
    // Event listeners
    document.getElementById('editCouponForm').addEventListener('submit', handleSubmit);
    
    // Preview en tiempo real
    document.getElementById('couponCode').addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase().replace(/\s/g, '');
        updatePreview();
    });
    document.getElementById('couponDiscount').addEventListener('input', updatePreview);
    document.getElementById('couponDescription').addEventListener('input', updatePreview);
    document.getElementById('couponExpiration').addEventListener('change', updatePreview);
    document.getElementById('couponMaxUse').addEventListener('input', updatePreview);
    document.getElementById('couponCurrentUse').addEventListener('input', updatePreview);
    document.getElementById('couponActive').addEventListener('change', updatePreview);
});

// Verificar autenticación
function checkAuthentication() {
    const session = localStorage.getItem('adminSession');
    if (!session) {
        window.location.href = 'admin.html';
        return;
    }
}

// Establecer fecha por defecto (hoy + 1 año)
function setDefaultDate() {
    const today = new Date();
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    document.getElementById('couponExpiration').value = nextYear.toISOString().split('T')[0];
    document.getElementById('couponExpiration').min = today.toISOString().split('T')[0];
    updatePreview();
}

// Cargar cupón existente
async function cargarCupon(codigo) {
    try {
        const response = await fetch(`${API_URL}/coupons`);
        if (!response.ok) throw new Error('Error al cargar cupones');
        
        const cupones = await response.json();
        const cupon = cupones.find(c => c.codigo.toUpperCase() === codigo.toUpperCase());
        
        if (!cupon) {
            mostrarNotificacion('Cupón no encontrado', 'error');
            setTimeout(() => window.location.href = 'admin.html', 2000);
            return;
        }
        
        // Llenar formulario
        document.getElementById('couponOriginalCode').value = cupon.codigo;
        document.getElementById('couponCode').value = cupon.codigo;
        document.getElementById('couponDiscount').value = cupon.descuento || 10;
        document.getElementById('couponDescription').value = cupon.descripcion || '';
        document.getElementById('couponExpiration').value = cupon.fechaExpiracion || '';
        document.getElementById('couponMaxUse').value = cupon.usoMaximo || 100;
        document.getElementById('couponCurrentUse').value = cupon.usoActual || 0;
        document.getElementById('couponActive').checked = cupon.activo === true || cupon.activo === 'true';
        
        // Establecer fecha mínima
        const today = new Date();
        document.getElementById('couponExpiration').min = today.toISOString().split('T')[0];
        
        // Actualizar preview
        updatePreview();
        
        console.log('✅ Cupón cargado:', cupon.codigo);
    } catch (error) {
        console.error('Error al cargar cupón:', error);
        mostrarNotificacion('Error al cargar el cupón', 'error');
    }
}

// Actualizar preview
function updatePreview() {
    const code = document.getElementById('couponCode').value || 'PROMO20';
    const discount = document.getElementById('couponDiscount').value || 20;
    const description = document.getElementById('couponDescription').value || 'Descripción del cupón';
    const expiration = document.getElementById('couponExpiration').value || '-';
    const maxUse = document.getElementById('couponMaxUse').value || 100;
    const currentUse = document.getElementById('couponCurrentUse').value || 0;
    const active = document.getElementById('couponActive').checked;
    
    document.getElementById('previewCode').textContent = code;
    document.getElementById('previewDiscount').textContent = discount;
    document.getElementById('previewDescription').textContent = description;
    document.getElementById('previewExpiration').textContent = expiration;
    document.getElementById('previewUseMax').textContent = maxUse;
    document.getElementById('previewUseCurrent').textContent = currentUse;
    document.getElementById('previewStatus').textContent = active ? 'Activo' : 'Inactivo';
    document.getElementById('previewStatus').style.color = active ? '#10b981' : '#ef4444';
}

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();
    
    const originalCode = document.getElementById('couponOriginalCode').value;
    const codigo = document.getElementById('couponCode').value.toUpperCase().trim();
    const descuento = parseInt(document.getElementById('couponDiscount').value);
    const descripcion = document.getElementById('couponDescription').value;
    const fechaExpiracion = document.getElementById('couponExpiration').value;
    const usoMaximo = parseInt(document.getElementById('couponMaxUse').value);
    const usoActual = parseInt(document.getElementById('couponCurrentUse').value);
    const activo = document.getElementById('couponActive').checked;
    
    // Validaciones
    if (!codigo || !descuento || !fechaExpiracion) {
        mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    if (descuento < 1 || descuento > 100) {
        mostrarNotificacion('El descuento debe estar entre 1% y 100%', 'error');
        return;
    }
    
    if (!/^[A-Z0-9]+$/.test(codigo)) {
        mostrarNotificacion('El código solo puede contener letras mayúsculas y números', 'error');
        return;
    }
    
    const cuponData = {
        codigo: codigo,
        descuento: descuento,
        tipo: 'porcentaje',
        activo: activo,
        descripcion: descripcion,
        fechaExpiracion: fechaExpiracion,
        usoMaximo: usoMaximo,
        usoActual: usoActual
    };
    
    try {
        let response;
        
        if (originalCode) {
            // Actualizar cupón existente
            response = await fetch(`${API_URL}/coupons/${encodeURIComponent(originalCode)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuponData)
            });
        } else {
            // Crear nuevo cupón
            response = await fetch(`${API_URL}/coupons/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuponData)
            });
        }
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al guardar');
        }
        
        mostrarNotificacion(
            originalCode ? '✅ Cupón actualizado exitosamente' : '✅ Cupón agregado exitosamente',
            'success'
        );
        
        // Redirigir al panel después de 1 segundo
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error al guardar cupón:', error);
        mostrarNotificacion(error.message || 'Error al guardar el cupón', 'error');
    }
}

// Manejar logout
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        localStorage.removeItem('adminSession');
        window.location.href = 'admin.html';
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notification notification-${tipo}`;
    notificacion.textContent = mensaje;
    
    const container = document.getElementById('notifications');
    container.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notificacion.classList.remove('show');
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 3000);
}

