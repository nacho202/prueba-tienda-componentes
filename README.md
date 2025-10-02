# 🛒 TechStore - Tienda Online de Componentes PC

Tienda online completa con panel de administración, sistema de ventas, gestión de productos, cupones, categorías y seguimiento UTM.

## ✨ Características Principales

- 🛍️ **Catálogo de Productos**: Visualización de productos con imágenes, descripción, stock y precios
- 🛒 **Carrito de Compras**: Sistema completo de carrito con localStorage
- 💳 **Checkout**: Procesamiento de pagos con tarjeta y transferencia bancaria
- 📧 **Email Confirmación**: Envío automático de confirmación de compra (EmailJS)
- 👨‍💼 **Panel Admin**: Gestión completa de productos, ventas, cupones y categorías
- 📊 **Dashboard**: Estadísticas de ventas, productos y stock bajo
- 🎫 **Sistema de Cupones**: Descuentos por porcentaje o monto fijo
- 📈 **Seguimiento UTM**: Tracking de campañas de marketing
- 🖼️ **Galería de Imágenes**: Múltiples imágenes por producto con navegación
- 🎨 **Crop de Imágenes**: Recorte automático en proporción 1:1
- 🔄 **Stock en Tiempo Real**: Actualización automática del inventario
- 📱 **Diseño Responsivo**: Adaptado para móviles, tablets y desktop

## 🚀 Despliegue en Vercel (Recomendado)

### 1. Preparar el Proyecto

```bash
# Asegúrate de que todos los archivos estén actualizados
git add .
git commit -m "Preparar para producción"
git push origin main
```

### 2. Desplegar en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta (puedes usar GitHub)
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente Node.js
5. Haz clic en "Deploy"
6. ¡Listo! Tu sitio estará en línea en minutos

### 3. Configurar Variables de Entorno (Opcional)

Si usas EmailJS, agrega estas variables en Vercel:
- `EMAILJS_SERVICE_ID`: Tu Service ID de EmailJS
- `EMAILJS_TEMPLATE_ID`: Tu Template ID de EmailJS
- `EMAILJS_PUBLIC_KEY`: Tu Public Key de EmailJS

## 🏠 Despliegue Local

### Requisitos
- Node.js 14 o superior
- npm o yarn

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor
npm start

# O con nodemon para desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

## 📂 Estructura del Proyecto

```
TechStore/
├── index.html              # Página principal
├── producto.html           # Página de detalle de producto
├── carrito.html           # Página del carrito
├── checkout.html          # Página de checkout
├── admin.html             # Panel de administración
├── edit-product.html      # Editor de productos
├── venta-detalle.html     # Detalle de venta
├── script.js              # Lógica de la tienda
├── producto.js            # Lógica de producto individual
├── carrito.js             # Lógica del carrito
├── checkout.js            # Lógica del checkout
├── admin.js               # Lógica del admin
├── edit-product.js        # Lógica del editor
├── venta-detalle.js       # Lógica de detalle de venta
├── config.js              # Configuración de API
├── styles.css             # Estilos globales
├── server.js              # Servidor Node.js/Express
├── vercel.json            # Configuración de Vercel
├── package.json           # Dependencias
├── products.json          # Base de datos de productos
├── sales.json             # Base de datos de ventas
├── cupon.json             # Base de datos de cupones
├── categorias.json        # Base de datos de categorías
├── admin_credentials.json # Credenciales del admin
└── uploads/               # Imágenes de productos
```

## 🔐 Credenciales de Admin

Por defecto:
- **Usuario**: admin
- **Contraseña**: admin123

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción desde el panel de admin.

## 🛠️ Tecnologías Utilizadas

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome (iconos)
- Cropper.js (recorte de imágenes)
- EmailJS (envío de emails)

### Backend
- Node.js
- Express.js
- Multer (subida de archivos)
- Sharp (procesamiento de imágenes)
- CORS

## 📱 Para tu Portfolio

### URL de Demo
Una vez desplegado en Vercel, obtendrás una URL como:
`https://tu-proyecto.vercel.app`

### Capturas de Pantalla Recomendadas
1. Página principal con productos
2. Página de detalle de producto
3. Carrito de compras
4. Panel de administración
5. Dashboard con estadísticas
6. Editor de productos

### Descripción para Portfolio

```
TechStore - E-commerce Completo

Tienda online full-stack con panel de administración para venta de 
componentes de PC. Incluye gestión de productos, sistema de ventas, 
cupones de descuento, seguimiento UTM y confirmación por email.

Tecnologías: JavaScript, Node.js, Express, HTML5, CSS3
Características: CRUD completo, API REST, responsive design, 
sistema de autenticación, procesamiento de imágenes.
```

## 🌐 Otras Opciones de Hosting

### Netlify (Solo Frontend)
Si quieres hostear solo el frontend, puedes usar Netlify. El backend deberá estar en otro lugar.

### Railway / Render (Backend + Frontend)
Alternativas a Vercel que también soportan Node.js gratis.

### Hosting Tradicional
Puedes subir a cualquier hosting que soporte Node.js (HostGator, Hostinger, etc.)

## 📞 Soporte

Si tienes dudas sobre el despliegue, revisa:
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Node.js](https://nodejs.org/docs)
- [Documentación de Express](https://expressjs.com)

## 📝 Notas Importantes

1. **Base de Datos**: Actualmente usa archivos JSON. Para producción real, considera usar MongoDB o PostgreSQL.
2. **Imágenes**: Las imágenes se guardan en `/uploads`. En Vercel, esto es temporal. Para producción, usa Cloudinary o AWS S3.
3. **Seguridad**: Cambia las credenciales de admin y considera usar JWT para autenticación en producción.
4. **EmailJS**: Configura tu cuenta de EmailJS para el envío de emails de confirmación.

## 🎯 Mejoras Futuras Sugeridas

- [ ] Integración con base de datos real (MongoDB/PostgreSQL)
- [ ] Almacenamiento de imágenes en la nube (Cloudinary/S3)
- [ ] Sistema de usuarios con registro y login
- [ ] Pasarela de pago real (MercadoPago, Stripe)
- [ ] Sistema de envíos con cálculo de costos
- [ ] Panel de analytics más completo
- [ ] Sistema de reviews/comentarios
- [ ] Wishlist/lista de deseos
- [ ] Comparador de productos
- [ ] Notificaciones push

---

Desarrollado con ❤️ para tu portfolio profesional

