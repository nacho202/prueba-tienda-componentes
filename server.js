// Servidor Node.js simple para TechStore
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/products/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = file.mimetype.match(/^(image|video)\/(jpeg|jpg|png|gif|webp|mp4|webm)$/);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp) o videos (mp4, webm)'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Servir archivos estáticos
app.use('/uploads', express.static('uploads')); // Servir carpeta de uploads

// Rutas de archivos
const PRODUCTS_FILE = path.join(__dirname, 'products.json');
const SALES_FILE = path.join(__dirname, 'sales.json');
const CREDENTIALS_FILE = path.join(__dirname, 'admin_credentials.json');
const COUPONS_FILE = path.join(__dirname, 'cupon.json');
const CATEGORIES_FILE = path.join(__dirname, 'categorias.json');

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// ===== SUBIDA DE IMÁGENES/VIDEOS =====
app.post('/api/upload', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No se subieron archivos' });
        }
        
        const processedFiles = [];
        
        for (const file of req.files) {
            const isImage = file.mimetype.startsWith('image/');
            const isVideo = file.mimetype.startsWith('video/');
            
            if (isImage && file.mimetype !== 'image/gif') {
                // Convertir imágenes a WebP (excepto GIFs)
                try {
                    const inputPath = file.path;
                    const outputFileName = file.filename.replace(/\.[^/.]+$/, '') + '.webp';
                    const outputPath = path.join('uploads', 'products', outputFileName);
                    
                    await sharp(inputPath)
                        .webp({ quality: 85 }) // Calidad 85% para balance tamaño/calidad
                        .toFile(outputPath);
                    
                    // Eliminar archivo original
                    await fs.unlink(inputPath);
                    
                    processedFiles.push(`/uploads/products/${outputFileName}`);
                    console.log('✅ Imagen convertida a WebP:', outputFileName);
                } catch (error) {
                    console.error('Error al convertir a WebP:', error);
                    // Si falla la conversión, usar el archivo original
                    processedFiles.push(`/uploads/products/${file.filename}`);
                }
            } else {
                // Videos y GIFs no se convierten
                processedFiles.push(`/uploads/products/${file.filename}`);
            }
        }
        
        console.log('✅ Archivos procesados:', processedFiles);
        
        res.json({ 
            success: true, 
            images: processedFiles,
            message: `${processedFiles.length} archivo(s) subido(s) exitosamente`
        });
    } catch (error) {
        console.error('Error al subir archivos:', error);
        res.status(500).json({ error: 'Error al subir archivos' });
    }
});

// Endpoint para eliminar una imagen
app.delete('/api/upload/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, 'uploads', 'products', filename);
        
        await fs.unlink(filePath);
        console.log('✅ Archivo eliminado:', filename);
        
        res.json({ success: true, message: 'Archivo eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        res.status(500).json({ error: 'Error al eliminar archivo' });
    }
});

// Endpoint para descargar desde URL
app.post('/api/download-from-url', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL no proporcionada' });
        }
        
        // Detectar si es imagen o video por extensión
        const urlLower = url.toLowerCase();
        const isVideo = urlLower.match(/\.(mp4|webm)(\?|$)/i);
        const isImage = urlLower.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
        
        if (!isVideo && !isImage) {
            return res.status(400).json({ error: 'URL debe ser una imagen o video válido' });
        }
        
        // Generar nombre de archivo único
        const ext = isVideo ? path.extname(url.split('?')[0]) : '.jpg';
        const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
        const filePath = path.join(__dirname, 'uploads', 'products', filename);
        
        // Descargar archivo
        const protocol = url.startsWith('https') ? https : http;
        
        await new Promise((resolve, reject) => {
            protocol.get(url, async (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Error al descargar: ${response.statusCode}`));
                    return;
                }
                
                const writeStream = require('fs').createWriteStream(filePath);
                response.pipe(writeStream);
                
                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            }).on('error', reject);
        });
        
        let finalPath = `/uploads/products/${filename}`;
        
        // Convertir a WebP si es imagen (excepto GIF)
        if (isImage && !urlLower.includes('.gif')) {
            try {
                const webpFilename = filename.replace(/\.[^/.]+$/, '') + '.webp';
                const webpPath = path.join(__dirname, 'uploads', 'products', webpFilename);
                
                await sharp(filePath)
                    .webp({ quality: 85 })
                    .toFile(webpPath);
                
                // Eliminar archivo original
                await fs.unlink(filePath);
                
                finalPath = `/uploads/products/${webpFilename}`;
                console.log('✅ Imagen descargada y convertida a WebP:', webpFilename);
            } catch (error) {
                console.error('Error al convertir a WebP:', error);
                // Si falla, usar archivo original
            }
        } else {
            console.log('✅ Archivo descargado desde URL:', filename);
        }
        
        res.json({
            success: true,
            path: finalPath,
            type: isVideo ? 'video' : 'image'
        });
    } catch (error) {
        console.error('Error al descargar desde URL:', error);
        res.status(500).json({ error: 'Error al descargar archivo desde URL' });
    }
});

// ===== CREDENCIALES =====

// Obtener credenciales
app.get('/api/credentials', async (req, res) => {
    try {
        // Verificar si existe el archivo
        try {
            await fs.access(CREDENTIALS_FILE);
        } catch {
            // Si no existe, crear credenciales por defecto
            const defaultCredentials = {
                username: 'admin',
                password: 'admin123'
            };
            await fs.writeFile(CREDENTIALS_FILE, JSON.stringify(defaultCredentials, null, 2), 'utf8');
        }
        
        const data = await fs.readFile(CREDENTIALS_FILE, 'utf8');
        const credentials = JSON.parse(data);
        res.json(credentials);
    } catch (error) {
        console.error('Error al leer credenciales:', error);
        res.status(500).json({ error: 'Error al leer credenciales' });
    }
});

// Actualizar contraseña
app.post('/api/credentials', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }
        
        const credentials = { username, password };
        await fs.writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf8');
        console.log('✅ Credenciales actualizadas');
        
        res.json({ success: true, message: 'Credenciales actualizadas exitosamente' });
    } catch (error) {
        console.error('Error al actualizar credenciales:', error);
        res.status(500).json({ error: 'Error al actualizar credenciales' });
    }
});

// ===== PRODUCTOS =====

// Obtener todos los productos
app.get('/api/products', async (req, res) => {
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const json = JSON.parse(data);
        // Si el JSON tiene estructura { "productos": [...] }, extraer el array
        const products = json.productos || json;
        res.json(products);
    } catch (error) {
        console.error('Error al leer productos:', error);
        res.status(500).json({ error: 'Error al leer productos' });
    }
});

// Guardar todos los productos (sobrescribe el archivo)
app.post('/api/products', async (req, res) => {
    try {
        const products = req.body;
        // Mantener la estructura { "productos": [...] }
        const jsonToSave = { productos: products };
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Productos guardados en products.json');
        res.json({ success: true, message: 'Productos guardados exitosamente' });
    } catch (error) {
        console.error('Error al guardar productos:', error);
        res.status(500).json({ error: 'Error al guardar productos' });
    }
});

// Agregar un producto
app.post('/api/products/add', async (req, res) => {
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const json = JSON.parse(data);
        const products = json.productos || json;
        
        const newProduct = req.body;
        newProduct.id = Math.max(...products.map(p => p.id), 0) + 1;
        
        products.push(newProduct);
        
        // Mantener la estructura { "productos": [...] }
        const jsonToSave = { productos: products };
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Producto agregado:', newProduct.nombre);
        
        res.json({ success: true, product: newProduct });
    } catch (error) {
        console.error('Error al agregar producto:', error);
        res.status(500).json({ error: 'Error al agregar producto' });
    }
});

// Actualizar un producto
app.put('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const updatedProduct = req.body;
        
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const json = JSON.parse(data);
        let products = json.productos || json;
        
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        products[index] = { ...products[index], ...updatedProduct };
        
        // Mantener la estructura { "productos": [...] }
        const jsonToSave = { productos: products };
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Producto actualizado:', products[index].nombre);
        
        res.json({ success: true, product: products[index] });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// Eliminar un producto
app.delete('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        const json = JSON.parse(data);
        let products = json.productos || json;
        
        const filteredProducts = products.filter(p => p.id !== productId);
        
        if (filteredProducts.length === products.length) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        // Mantener la estructura { "productos": [...] }
        const jsonToSave = { productos: filteredProducts };
        await fs.writeFile(PRODUCTS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Producto eliminado con ID:', productId);
        
        res.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

// ===== VENTAS =====

// Obtener todas las ventas
app.get('/api/sales', async (req, res) => {
    try {
        // Verificar si existe el archivo
        try {
            await fs.access(SALES_FILE);
        } catch {
            // Si no existe, crear archivo vacío
            await fs.writeFile(SALES_FILE, '[]', 'utf8');
        }
        
        const data = await fs.readFile(SALES_FILE, 'utf8');
        const sales = JSON.parse(data);
        res.json(sales);
    } catch (error) {
        console.error('Error al leer ventas:', error);
        res.status(500).json({ error: 'Error al leer ventas' });
    }
});

// Registrar una nueva venta
app.post('/api/sales', async (req, res) => {
    try {
        // Verificar si existe el archivo
        let sales = [];
        try {
            const data = await fs.readFile(SALES_FILE, 'utf8');
            sales = JSON.parse(data);
        } catch {
            // Si no existe, crear array vacío
            sales = [];
        }
        
        const newSale = req.body;
        sales.push(newSale);
        
        await fs.writeFile(SALES_FILE, JSON.stringify(sales, null, 2), 'utf8');
        console.log('✅ Venta registrada:', newSale.numeroPedido);
        
        res.json({ success: true, sale: newSale });
    } catch (error) {
        console.error('Error al registrar venta:', error);
        res.status(500).json({ error: 'Error al registrar venta' });
    }
});

// Limpiar historial de ventas
app.delete('/api/sales', async (req, res) => {
    try {
        await fs.writeFile(SALES_FILE, '[]', 'utf8');
        console.log('✅ Historial de ventas limpiado');
        res.json({ success: true, message: 'Historial de ventas limpiado' });
    } catch (error) {
        console.error('Error al limpiar ventas:', error);
        res.status(500).json({ error: 'Error al limpiar ventas' });
    }
});

// ===== CATEGORÍAS =====

// Obtener todas las categorías
app.get('/api/categories', async (req, res) => {
    try {
        const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
        const json = JSON.parse(data);
        const categories = json.categorias || json;
        res.json(categories);
    } catch (error) {
        console.error('Error al leer categorías:', error);
        res.status(500).json({ error: 'Error al leer categorías' });
    }
});

// Agregar una categoría
app.post('/api/categories/add', async (req, res) => {
    try {
        const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
        const json = JSON.parse(data);
        const categories = json.categorias || json;
        
        const newCategory = req.body;
        
        // Generar ID único
        newCategory.id = Math.max(...categories.map(c => c.id), 0) + 1;
        
        // Generar slug si no existe
        if (!newCategory.slug) {
            newCategory.slug = newCategory.nombre.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Quitar acentos
                .replace(/\s+/g, '-') // Espacios a guiones
                .replace(/[^\w-]+/g, ''); // Quitar caracteres especiales
        }
        
        categories.push(newCategory);
        
        const jsonToSave = { categorias: categories };
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Categoría agregada:', newCategory.nombre);
        
        res.json({ success: true, category: newCategory });
    } catch (error) {
        console.error('Error al agregar categoría:', error);
        res.status(500).json({ error: 'Error al agregar categoría' });
    }
});

// Actualizar una categoría
app.put('/api/categories/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const updatedCategory = req.body;
        
        const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
        const json = JSON.parse(data);
        let categories = json.categorias || json;
        
        const index = categories.findIndex(c => c.id === categoryId);
        if (index === -1) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        
        // Actualizar slug si cambió el nombre
        if (updatedCategory.nombre && updatedCategory.nombre !== categories[index].nombre) {
            updatedCategory.slug = updatedCategory.nombre.toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '');
        }
        
        categories[index] = { ...categories[index], ...updatedCategory };
        
        const jsonToSave = { categorias: categories };
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Categoría actualizada:', categories[index].nombre);
        
        res.json({ success: true, category: categories[index] });
    } catch (error) {
        console.error('Error al actualizar categoría:', error);
        res.status(500).json({ error: 'Error al actualizar categoría' });
    }
});

// Eliminar una categoría
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        
        const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
        const json = JSON.parse(data);
        let categories = json.categorias || json;
        
        const filteredCategories = categories.filter(c => c.id !== categoryId);
        
        if (filteredCategories.length === categories.length) {
            return res.status(404).json({ error: 'Categoría no encontrada' });
        }
        
        const jsonToSave = { categorias: filteredCategories };
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Categoría eliminada con ID:', categoryId);
        
        res.json({ success: true, message: 'Categoría eliminada' });
    } catch (error) {
        console.error('Error al eliminar categoría:', error);
        res.status(500).json({ error: 'Error al eliminar categoría' });
    }
});

// ===== CUPONES =====

// Obtener todos los cupones
app.get('/api/coupons', async (req, res) => {
    try {
        const data = await fs.readFile(COUPONS_FILE, 'utf8');
        const json = JSON.parse(data);
        const coupons = json.cupones || json;
        res.json(coupons);
    } catch (error) {
        console.error('Error al leer cupones:', error);
        res.status(500).json({ error: 'Error al leer cupones' });
    }
});

// Agregar un cupón
app.post('/api/coupons/add', async (req, res) => {
    try {
        const data = await fs.readFile(COUPONS_FILE, 'utf8');
        const json = JSON.parse(data);
        const coupons = json.cupones || json;
        
        const newCoupon = req.body;
        
        // Verificar si el código ya existe
        if (coupons.some(c => c.codigo.toUpperCase() === newCoupon.codigo.toUpperCase())) {
            return res.status(400).json({ error: 'El código de cupón ya existe' });
        }
        
        coupons.push(newCoupon);
        
        const jsonToSave = { cupones: coupons };
        await fs.writeFile(COUPONS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Cupón agregado:', newCoupon.codigo);
        
        res.json({ success: true, coupon: newCoupon });
    } catch (error) {
        console.error('Error al agregar cupón:', error);
        res.status(500).json({ error: 'Error al agregar cupón' });
    }
});

// Actualizar un cupón
app.put('/api/coupons/:codigo', async (req, res) => {
    try {
        const codigo = req.params.codigo.toUpperCase();
        const updatedCoupon = req.body;
        
        const data = await fs.readFile(COUPONS_FILE, 'utf8');
        const json = JSON.parse(data);
        let coupons = json.cupones || json;
        
        const index = coupons.findIndex(c => c.codigo.toUpperCase() === codigo);
        if (index === -1) {
            return res.status(404).json({ error: 'Cupón no encontrado' });
        }
        
        coupons[index] = { ...coupons[index], ...updatedCoupon };
        
        const jsonToSave = { cupones: coupons };
        await fs.writeFile(COUPONS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Cupón actualizado:', coupons[index].codigo);
        
        res.json({ success: true, coupon: coupons[index] });
    } catch (error) {
        console.error('Error al actualizar cupón:', error);
        res.status(500).json({ error: 'Error al actualizar cupón' });
    }
});

// Eliminar un cupón
app.delete('/api/coupons/:codigo', async (req, res) => {
    try {
        const codigo = req.params.codigo.toUpperCase();
        
        const data = await fs.readFile(COUPONS_FILE, 'utf8');
        const json = JSON.parse(data);
        let coupons = json.cupones || json;
        
        const filteredCoupons = coupons.filter(c => c.codigo.toUpperCase() !== codigo);
        
        if (filteredCoupons.length === coupons.length) {
            return res.status(404).json({ error: 'Cupón no encontrado' });
        }
        
        const jsonToSave = { cupones: filteredCoupons };
        await fs.writeFile(COUPONS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
        console.log('✅ Cupón eliminado:', codigo);
        
        res.json({ success: true, message: 'Cupón eliminado' });
    } catch (error) {
        console.error('Error al eliminar cupón:', error);
        res.status(500).json({ error: 'Error al eliminar cupón' });
    }
});

// Ruta catch-all para servir archivos estáticos y HTML (para Vercel)
app.get('*', (req, res) => {
    const filePath = path.join(__dirname, req.path);
    const ext = path.extname(filePath);
    
    // Si es un archivo estático (js, css, imágenes, etc.), servirlo directamente
    if (ext && ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.json'].includes(ext)) {
        return res.sendFile(filePath, (err) => {
            if (err) {
                console.log('Error serving static file:', filePath);
                res.status(404).send('File not found');
            }
        });
    }
    
    // Si es la raíz, servir index.html
    if (req.path === '/') {
        return res.sendFile(path.join(__dirname, 'index.html'));
    }
    
    // Si es una ruta HTML específica, servirla
    if (ext === '.html' || !ext) {
        const htmlFile = req.path.endsWith('.html') ? req.path : req.path + '.html';
        const fullPath = path.join(__dirname, htmlFile);
        return res.sendFile(fullPath, (err) => {
            if (err) {
                console.log('Error serving HTML:', fullPath);
                res.status(404).send('Page not found');
            }
        });
    }
    
    // Fallback a index.html
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 Servidor TechStore iniciado');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('📦 API de productos: http://localhost:${PORT}/api/products');
    console.log('🛒 API de ventas: http://localhost:${PORT}/api/sales');
    console.log('\n✅ El servidor está listo para recibir peticiones');
    console.log('⚠️  Para detener el servidor: Ctrl + C\n');
});
