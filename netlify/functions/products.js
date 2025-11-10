const fs = require('fs').promises;
const path = require('path');

const PRODUCTS_FILE = path.join(process.cwd(), 'products.json');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Manejar preflight request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        // GET - Obtener todos los productos
        if (event.httpMethod === 'GET') {
            const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
            const json = JSON.parse(data);
            const products = json.productos || json;
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(products)
            };
        }

        // POST - Guardar todos los productos
        if (event.httpMethod === 'POST') {
            const products = JSON.parse(event.body);
            const jsonToSave = { productos: products };
            await fs.writeFile(PRODUCTS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Productos guardados exitosamente' })
            };
        }

        // PUT - Actualizar un producto específico
        if (event.httpMethod === 'PUT') {
            const pathParts = event.path.split('/');
            const productId = parseInt(pathParts[pathParts.length - 1]);
            const updatedProduct = JSON.parse(event.body);
            
            const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
            const json = JSON.parse(data);
            let products = json.productos || json;
            
            const index = products.findIndex(p => p.id === productId);
            if (index === -1) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Producto no encontrado' })
                };
            }
            
            products[index] = { ...products[index], ...updatedProduct };
            
            const jsonToSave = { productos: products };
            await fs.writeFile(PRODUCTS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, product: products[index] })
            };
        }

        // DELETE - Eliminar un producto
        if (event.httpMethod === 'DELETE') {
            const pathParts = event.path.split('/');
            const productId = parseInt(pathParts[pathParts.length - 1]);
            
            const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
            const json = JSON.parse(data);
            let products = json.productos || json;
            
            const filteredProducts = products.filter(p => p.id !== productId);
            
            if (filteredProducts.length === products.length) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Producto no encontrado' })
                };
            }
            
            const jsonToSave = { productos: filteredProducts };
            await fs.writeFile(PRODUCTS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Producto eliminado' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };

    } catch (error) {
        console.error('Error en función products:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error del servidor', details: error.message })
        };
    }
};

