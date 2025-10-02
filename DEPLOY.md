# 🚀 Guía Rápida de Despliegue

## Opción 1: Vercel (Recomendada) ⭐

### Paso 1: Subir a GitHub
```bash
# Si no tienes Git configurado
git init
git add .
git commit -m "Primera versión"

# Crear repositorio en GitHub y subir
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main
```

### Paso 2: Conectar con Vercel
1. Ve a **https://vercel.com**
2. Regístrate con tu cuenta de GitHub
3. Haz clic en **"Add New Project"**
4. Selecciona tu repositorio
5. Vercel detecta automáticamente Node.js
6. Haz clic en **"Deploy"**
7. ¡Espera 2-3 minutos y listo! 🎉

### Paso 3: Obtener tu URL
Tu sitio estará en: `https://tu-proyecto.vercel.app`

---

## Opción 2: Netlify (Solo Frontend)

### Paso 1: Configurar Backend Separado
El backend debe estar en Railway, Render o Heroku.

### Paso 2: Desplegar Frontend
1. Ve a **https://netlify.com**
2. Arrastra la carpeta del proyecto
3. Listo

⚠️ **Nota**: Debes actualizar `config.js` con la URL de tu backend.

---

## Opción 3: Railway

### Paso 1: Crear Cuenta
Ve a **https://railway.app**

### Paso 2: Desplegar
1. Haz clic en "New Project"
2. Selecciona "Deploy from GitHub"
3. Selecciona tu repositorio
4. Railway detecta automáticamente Node.js
5. Haz clic en "Deploy"

---

## Opción 4: Render

### Paso 1: Crear Cuenta
Ve a **https://render.com**

### Paso 2: Crear Web Service
1. Haz clic en "New +"
2. Selecciona "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Haz clic en "Create Web Service"

---

## Opción 5: Hosting Tradicional (cPanel)

### Requisitos
- Hosting con soporte Node.js
- Acceso SSH
- Node.js 14+ instalado

### Pasos
```bash
# Conectar por SSH
ssh usuario@tu-servidor.com

# Subir archivos (puedes usar FileZilla)
# O clonar desde Git
git clone https://github.com/TU-USUARIO/TU-REPO.git

# Instalar dependencias
cd TU-REPO
npm install

# Iniciar con PM2 (para mantener activo)
npm install -g pm2
pm2 start server.js --name "techstore"
pm2 save
pm2 startup
```

---

## 🔧 Configuración Post-Despliegue

### 1. EmailJS (Confirmación de Compras)
1. Ve a **https://emailjs.com**
2. Crea una cuenta
3. Configura un servicio de email
4. Crea un template
5. Copia tus credenciales
6. Actualiza en `checkout.js`:
   ```javascript
   emailjs.init("TU_PUBLIC_KEY");
   ```

### 2. Cambiar Credenciales de Admin
1. Ingresa al panel de admin
2. Ve a "Cambiar Contraseña"
3. Establece una contraseña segura

### 3. Verificar Archivos JSON
Asegúrate de que estos archivos existan:
- `products.json`
- `sales.json` (puede estar vacío: `[]`)
- `cupon.json` (puede estar vacío: `[]`)
- `categorias.json`
- `admin_credentials.json`

---

## 📱 Para Agregar a tu Portfolio

### Información del Proyecto

**Título**: TechStore - E-commerce Full-Stack

**Descripción Corta**:
```
Tienda online completa con panel de administración para componentes de PC. 
Sistema de ventas, cupones, tracking UTM y confirmación por email.
```

**Descripción Larga**:
```
E-commerce full-stack desarrollado con JavaScript vanilla y Node.js. 
Incluye:

- Catálogo de productos con filtros y búsqueda
- Carrito de compras con localStorage
- Sistema de checkout con múltiples métodos de pago
- Panel de administración completo (CRUD de productos, ventas, cupones)
- Dashboard con estadísticas en tiempo real
- Sistema de cupones de descuento
- Seguimiento UTM para campañas de marketing
- Gestión de imágenes con crop automático
- Confirmación de compra por email
- Diseño responsive y moderno

Tecnologías: JavaScript ES6, Node.js, Express, HTML5, CSS3, 
Multer, Sharp, EmailJS
```

**Características Técnicas**:
- ✅ API REST con Express
- ✅ CRUD completo
- ✅ Autenticación básica
- ✅ Procesamiento de imágenes
- ✅ Sistema de archivos JSON
- ✅ Responsive design
- ✅ Validación de formularios
- ✅ Gestión de estado con localStorage

**Links**:
- 🌐 Demo: `tu-url.vercel.app`
- 💻 GitHub: `github.com/tu-usuario/tu-repo`
- 🎥 Video: (opcional)

**Capturas de Pantalla**:
1. Página principal con productos
2. Detalle de producto con galería
3. Carrito de compras
4. Checkout
5. Panel de administración
6. Dashboard con estadísticas

---

## ❓ Solución de Problemas Comunes

### Error: "Cannot find module"
```bash
npm install
```

### Error: "Port already in use"
Cambia el puerto en `server.js` o cierra la aplicación que lo usa.

### Las imágenes no se cargan
Verifica que la carpeta `uploads/products/` exista y tenga permisos.

### El admin no funciona
Verifica que `admin_credentials.json` exista con:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Los emails no se envían
Configura correctamente EmailJS en `checkout.js` con tus credenciales.

---

## 🎉 ¡Listo para Producción!

Tu tienda está lista para ser mostrada en tu portfolio profesional.

**Próximos pasos recomendados**:
1. ✅ Despliega en Vercel
2. ✅ Toma capturas de pantalla
3. ✅ Agrega a tu portfolio
4. ✅ Comparte en LinkedIn
5. ✅ Incluye en tu CV

¡Mucha suerte con tu proyecto! 🚀

