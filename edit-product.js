// Variables globales
// const API_URL = 'http://localhost:3000/api'; // Ahora se define en config.js
let productId = null;
let categorias = [];
let coverImageFile = null;
let galleryFiles = [];
let existingCoverImage = null;
let existingGalleryImages = [];
let cropper = null;
let currentCropTarget = null; // 'cover' o 'gallery'
let tempCroppedFile = null;
let urlModalTarget = null; // 'cover' o 'gallery'

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    // Verificar autenticación
    checkAuthentication();
    
    // Cargar categorías primero
    await cargarCategorias();
    
    // Obtener ID del producto desde URL
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('id');
    
    if (productId) {
        // Modo edición
        document.getElementById('titleText').textContent = 'Editar Producto';
        await cargarProducto(productId);
    } else {
        // Modo creación
        document.getElementById('titleText').textContent = 'Agregar Producto';
        document.getElementById('pageTitle').innerHTML = '<i class="fas fa-plus"></i> <span id="titleText">Agregar Producto</span>';
    }
    
    // Event listeners
    document.getElementById('editProductForm').addEventListener('submit', handleSubmit);
    
    // Event listeners para imágenes
    document.getElementById('productCoverImage').addEventListener('change', handleCoverImageChange);
    document.getElementById('productImages').addEventListener('change', handleGalleryImagesChange);
    
    // Inicializar Drag & Drop
    initializeDragAndDrop();
    
    // Preview en tiempo real
    document.getElementById('productName').addEventListener('input', updatePreview);
    document.getElementById('productCategory').addEventListener('change', updatePreview);
    document.getElementById('productPrice').addEventListener('input', updatePreview);
    document.getElementById('productStock').addEventListener('input', updatePreview);
});

// Verificar autenticación
function checkAuthentication() {
    const session = localStorage.getItem('adminSession');
    if (!session) {
        window.location.href = 'admin.html';
        return;
    }
}

// Cargar categorías desde la API
async function cargarCategorias() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Error al cargar categorías');
        
        categorias = await response.json();
        console.log('✅ Categorías cargadas:', categorias.length);
        
        // Renderizar select de categorías
        const select = document.getElementById('productCategory');
        select.innerHTML = '<option value="">Seleccionar categoría</option>' +
            categorias.map(cat => `<option value="${cat.slug}">${cat.nombre}</option>`).join('');
            
    } catch (error) {
        console.error('Error al cargar categorías:', error);
        // Si falla, usar categorías por defecto
        const select = document.getElementById('productCategory');
        select.innerHTML = `
            <option value="">Seleccionar categoría</option>
            <option value="procesadores">Procesadores</option>
            <option value="gabinetes">Gabinetes</option>
            <option value="placas-video">Placas de Video</option>
            <option value="memorias-ram">Memorias RAM</option>
        `;
    }
}

// Inicializar Drag & Drop
function initializeDragAndDrop() {
    const coverDropZone = document.getElementById('coverDropZone');
    const galleryDropZone = document.getElementById('galleryDropZone');
    const coverInput = document.getElementById('productCoverImage');
    const galleryInput = document.getElementById('productImages');
    
    // Drop zone de portada
    setupDropZone(coverDropZone, coverInput, handleCoverImageChange);
    
    // Drop zone de galería
    setupDropZone(galleryDropZone, galleryInput, handleGalleryImagesChange);
    
    // Click en drop zone abre selector de archivos
    coverDropZone.addEventListener('click', () => coverInput.click());
    galleryDropZone.addEventListener('click', () => galleryInput.click());
}

function setupDropZone(dropZone, input, changeHandler) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });
    
    dropZone.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        // Simular evento de cambio
        Object.defineProperty(input, 'files', {
            value: files,
            writable: false
        });
        
        changeHandler({ target: input });
    }, false);
}

// Verificar si es imagen
function isImage(file) {
    return file.type.startsWith('image/');
}

// Verificar si es video
function isVideo(file) {
    return file.type.startsWith('video/');
}

// Abrir cropper para recortar imagen
function openCropper(file, target) {
    if (!isImage(file)) {
        // Si es video, no recortar
        if (target === 'cover') {
            processCoverFile(file);
        } else {
            galleryFiles.push(file);
            renderGalleryPreviews();
        }
        return;
    }
    
    currentCropTarget = target;
    tempCroppedFile = file;
    
    const modal = document.getElementById('cropperModal');
    const img = document.getElementById('cropperImage');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
        modal.style.display = 'flex';
        
        // Destruir cropper anterior si existe
        if (cropper) {
            cropper.destroy();
        }
        
        // Inicializar cropper con aspecto cuadrado
        cropper = new Cropper(img, {
            aspectRatio: 1,
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            background: false,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });
    };
    reader.readAsDataURL(file);
}

// Cerrar cropper modal
function closeCropperModal() {
    const modal = document.getElementById('cropperModal');
    modal.style.display = 'none';
    
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    
    currentCropTarget = null;
    tempCroppedFile = null;
}

// Aplicar recorte
async function applyCrop() {
    if (!cropper) return;
    
    const canvas = cropper.getCroppedCanvas({
        width: 800,
        height: 800,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });
    
    canvas.toBlob(async (blob) => {
        const fileName = tempCroppedFile.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg';
        const croppedFile = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now()
        });
        
        if (currentCropTarget === 'cover') {
            processCoverFile(croppedFile);
        } else {
            galleryFiles.push(croppedFile);
            renderGalleryPreviews();
        }
        
        closeCropperModal();
    }, 'image/jpeg', 0.9);
}

// Procesar archivo de portada
function processCoverFile(file) {
    coverImageFile = file;
    const coverPreview = document.getElementById('coverPreview');
    const img = coverPreview.querySelector('img');
    const video = coverPreview.querySelector('video');
    
    if (isImage(file)) {
        const reader = new FileReader();
        reader.onload = function(event) {
            img.src = event.target.result;
            img.style.display = 'block';
            video.style.display = 'none';
            coverPreview.style.display = 'block';
            
            // Actualizar vista previa
            updatePreviewMedia();
        };
        reader.readAsDataURL(file);
    } else if (isVideo(file)) {
        const reader = new FileReader();
        reader.onload = function(event) {
            video.src = event.target.result;
            video.style.display = 'block';
            img.style.display = 'none';
            coverPreview.style.display = 'block';
            
            // Actualizar vista previa
            updatePreviewMedia();
        };
        reader.readAsDataURL(file);
    }
}

// Manejar cambio de imagen de portada
function handleCoverImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Abrir cropper para imágenes, procesar directamente videos
    openCropper(file, 'cover');
}

// Remover imagen de portada
function removeCoverImage() {
    coverImageFile = null;
    existingCoverImage = null;
    document.getElementById('productCoverImage').value = '';
    document.getElementById('coverPreview').style.display = 'none';
}

// Manejar cambio de imágenes de galería
function handleGalleryImagesChange(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    files.forEach(file => {
        if (galleryFiles.length + existingGalleryImages.length < 10) {
            // Abrir cropper para cada imagen
            openCropper(file, 'gallery');
        }
    });
}

// Renderizar previews de galería
function renderGalleryPreviews() {
    const container = document.getElementById('imagesPreview');
    container.innerHTML = '';
    
    // Mostrar archivos existentes
    existingGalleryImages.forEach((url, index) => {
        const div = document.createElement('div');
        const isVideoUrl = url.match(/\.(mp4|webm)$/i);
        div.className = 'image-preview-item' + (isVideoUrl ? ' is-video' : '');
        
        if (isVideoUrl) {
            div.innerHTML = `
                <video src="${url}"></video>
                <button type="button" class="remove-image" onclick="removeExistingGalleryImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else {
            div.innerHTML = `
                <img src="${url}" alt="Archivo ${index + 1}">
                <button type="button" class="remove-image" onclick="removeExistingGalleryImage(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        container.appendChild(div);
    });
    
    // Mostrar archivos nuevos
    galleryFiles.forEach((file, index) => {
        const div = document.createElement('div');
        const isVideoFile = isVideo(file);
        div.className = 'image-preview-item' + (isVideoFile ? ' is-video' : '');
        
        const reader = new FileReader();
        reader.onload = function(event) {
            if (isVideoFile) {
                div.innerHTML = `
                    <video src="${event.target.result}"></video>
                    <button type="button" class="remove-image" onclick="removeGalleryImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else {
                div.innerHTML = `
                    <img src="${event.target.result}" alt="Archivo ${index + 1}">
                    <button type="button" class="remove-image" onclick="removeGalleryImage(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
        };
        reader.readAsDataURL(file);
        
        container.appendChild(div);
    });
}

// Remover imagen existente de galería
function removeExistingGalleryImage(index) {
    existingGalleryImages.splice(index, 1);
    renderGalleryPreviews();
}

// Remover imagen nueva de galería
function removeGalleryImage(index) {
    galleryFiles.splice(index, 1);
    renderGalleryPreviews();
}

// Subir imágenes al servidor
async function uploadImages() {
    const uploadedImages = {
        coverImage: existingCoverImage,
        galleryImages: [...existingGalleryImages]
    };
    
    try {
        // Subir imagen de portada si hay una nueva
        if (coverImageFile) {
            const formData = new FormData();
            formData.append('images', coverImageFile);
            
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Error al subir imagen de portada');
            
            const data = await response.json();
            uploadedImages.coverImage = data.images[0];
        }
        
        // Subir imágenes de galería si hay nuevas
        if (galleryFiles.length > 0) {
            const formData = new FormData();
            galleryFiles.forEach(file => {
                formData.append('images', file);
            });
            
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) throw new Error('Error al subir imágenes de galería');
            
            const data = await response.json();
            uploadedImages.galleryImages.push(...data.images);
        }
        
        return uploadedImages;
    } catch (error) {
        console.error('Error al subir imágenes:', error);
        throw error;
    }
}

// Abrir modal de URL
function openUrlModal(target) {
    urlModalTarget = target;
    const modal = document.getElementById('urlModal');
    const input = document.getElementById('mediaUrl');
    const preview = document.getElementById('urlPreview');
    
    input.value = '';
    preview.style.display = 'none';
    modal.style.display = 'flex';
}

// Cerrar modal de URL
function closeUrlModal() {
    const modal = document.getElementById('urlModal');
    modal.style.display = 'none';
    urlModalTarget = null;
}

// Cargar desde URL
async function loadFromUrl() {
    const input = document.getElementById('mediaUrl');
    const url = input.value.trim();
    
    if (!url) {
        mostrarNotificacion('Por favor ingresa una URL', 'error');
        return;
    }
    
    try {
        mostrarNotificacion('Descargando archivo...', 'info');
        
        // Descargar archivo desde URL
        const response = await fetch(`${API_URL}/download-from-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al descargar archivo');
        }
        
        const data = await response.json();
        
        // Agregar a portada o galería según corresponda
        if (urlModalTarget === 'cover') {
            existingCoverImage = data.path;
            const coverPreview = document.getElementById('coverPreview');
            const img = coverPreview.querySelector('img');
            const video = coverPreview.querySelector('video');
            
            if (data.type === 'video') {
                video.src = data.path;
                video.style.display = 'block';
                img.style.display = 'none';
            } else {
                img.src = data.path;
                img.style.display = 'block';
                video.style.display = 'none';
            }
            coverPreview.style.display = 'block';
            
            // Actualizar vista previa
            updatePreviewMedia();
        } else {
            existingGalleryImages.push(data.path);
            renderGalleryPreviews();
        }
        
        mostrarNotificacion('✅ Archivo cargado exitosamente', 'success');
        closeUrlModal();
    } catch (error) {
        console.error('Error al cargar desde URL:', error);
        mostrarNotificacion('Error: ' + error.message, 'error');
    }
}

// Cargar producto existente
async function cargarProducto(id) {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Error al cargar productos');
        
        const productos = await response.json();
        const producto = productos.find(p => p.id === parseInt(id));
        
        if (!producto) {
            mostrarNotificacion('Producto no encontrado', 'error');
            setTimeout(() => window.location.href = 'admin.html', 2000);
            return;
        }
        
        // Llenar formulario
        document.getElementById('productId').value = producto.id;
        document.getElementById('productName').value = producto.nombre || '';
        document.getElementById('productCategory').value = producto.categoria || '';
        document.getElementById('productPrice').value = producto.precio || 0;
        document.getElementById('productStock').value = producto.stock || 0;
        document.getElementById('productBrand').value = producto.marca || '';
        document.getElementById('productShortDesc').value = producto.descripcionCorta || '';
        document.getElementById('productDescription').value = producto.descripcion || '';
        document.getElementById('productFeatured').checked = producto.destacado === true;
        
        // Cargar imágenes existentes
        if (producto.coverImage) {
            existingCoverImage = producto.coverImage;
            const coverPreview = document.getElementById('coverPreview');
            const img = coverPreview.querySelector('img');
            const video = coverPreview.querySelector('video');
            
            // Detectar si es video
            if (producto.coverImage.match(/\.(mp4|webm)$/i)) {
                video.src = producto.coverImage;
                video.style.display = 'block';
                img.style.display = 'none';
            } else {
                img.src = producto.coverImage;
                img.style.display = 'block';
                video.style.display = 'none';
            }
            coverPreview.style.display = 'block';
        }
        
        if (producto.galleryImages && producto.galleryImages.length > 0) {
            existingGalleryImages = [...producto.galleryImages];
            renderGalleryPreviews();
        }
        
        // Actualizar preview
        updatePreview();
        updatePreviewMedia();
        
        console.log('✅ Producto cargado:', producto.nombre);
    } catch (error) {
        console.error('Error al cargar producto:', error);
        mostrarNotificacion('Error al cargar el producto', 'error');
    }
}

// Actualizar preview
function updatePreview() {
    const name = document.getElementById('productName').value || 'Nombre del Producto';
    const category = document.getElementById('productCategory').value || 'Categoría';
    const price = document.getElementById('productPrice').value || 0;
    const stock = document.getElementById('productStock').value || 0;
    
    document.getElementById('previewName').textContent = name;
    document.getElementById('previewCategory').textContent = category;
    document.getElementById('previewPrice').textContent = parseFloat(price).toFixed(2);
    document.getElementById('previewStock').textContent = stock;
}

// Actualizar preview de imagen/video
function updatePreviewMedia() {
    const previewIcon = document.getElementById('previewIcon');
    const previewImage = document.getElementById('previewImage');
    const previewVideo = document.getElementById('previewVideo');
    const coverPreview = document.getElementById('coverPreview');
    const coverImg = coverPreview.querySelector('img');
    const coverVid = coverPreview.querySelector('video');
    
    // Ocultar todo primero
    previewIcon.style.display = 'none';
    previewImage.style.display = 'none';
    previewVideo.style.display = 'none';
    
    // Si hay imagen de portada subida
    if (coverImg.src && coverImg.style.display !== 'none') {
        previewImage.src = coverImg.src;
        previewImage.style.display = 'block';
    }
    // Si hay video de portada subido
    else if (coverVid.src && coverVid.style.display !== 'none') {
        previewVideo.src = coverVid.src;
        previewVideo.style.display = 'block';
    }
    // Si hay imagen existente
    else if (existingCoverImage) {
        if (existingCoverImage.match(/\.(mp4|webm)$/i)) {
            previewVideo.src = existingCoverImage;
            previewVideo.style.display = 'block';
        } else {
            previewImage.src = existingCoverImage;
            previewImage.style.display = 'block';
        }
    }
    // Mostrar ícono por defecto
    else {
        previewIcon.style.display = 'block';
    }
}

// Manejar envío del formulario
async function handleSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const nombre = document.getElementById('productName').value;
    const categoria = document.getElementById('productCategory').value;
    const precio = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const marca = document.getElementById('productBrand').value;
    const descripcionCorta = document.getElementById('productShortDesc').value;
    const descripcion = document.getElementById('productDescription').value;
    const destacado = document.getElementById('productFeatured').checked;
    
    // Validaciones
    if (!nombre || !categoria || precio === null || precio === undefined || stock === null || stock === undefined || isNaN(stock)) {
        mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
        return;
    }
    
    // Validar que stock sea un número válido (puede ser 0)
    if (stock < 0) {
        mostrarNotificacion('El stock no puede ser negativo', 'error');
        return;
    }
    
    // Validar que haya imagen de portada (nueva o existente)
    if (!coverImageFile && !existingCoverImage) {
        mostrarNotificacion('Debes subir una imagen de portada', 'error');
        return;
    }
    
    try {
        // Subir imágenes primero
        mostrarNotificacion('Subiendo imágenes...', 'info');
        const images = await uploadImages();
        
        const productoData = {
            nombre,
            categoria,
            precio,
            stock,
            marca,
            imagen: images.coverImage, // Usar para retrocompatibilidad con iconos
            coverImage: images.coverImage,
            galleryImages: images.galleryImages,
            descripcionCorta,
            descripcion,
            destacado,
            especificaciones: {}
        };
        
        let response;
        
        if (id) {
            // Actualizar producto existente
            response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData)
            });
        } else {
            // Crear nuevo producto
            response = await fetch(`${API_URL}/products/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productoData)
            });
        }
        
        if (!response.ok) throw new Error('Error al guardar');
        
        mostrarNotificacion(
            id ? '✅ Producto actualizado exitosamente' : '✅ Producto agregado exitosamente',
            'success'
        );
        
        // Redirigir al panel después de 1 segundo
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
        
    } catch (error) {
        console.error('Error al guardar producto:', error);
        mostrarNotificacion('Error al guardar el producto', 'error');
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

