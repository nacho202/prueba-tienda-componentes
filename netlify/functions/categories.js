const fs = require('fs').promises;
const path = require('path');

const CATEGORIES_FILE = path.join(process.cwd(), 'categorias.json');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
        const json = JSON.parse(data);
        const categories = json.categorias || json;

        // GET - Obtener todas las categorías
        if (event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(categories)
            };
        }

        // POST - Agregar categoría
        if (event.httpMethod === 'POST' && event.path.includes('/add')) {
            const newCategory = JSON.parse(event.body);
            newCategory.id = Math.max(...categories.map(c => c.id), 0) + 1;
            
            if (!newCategory.slug) {
                newCategory.slug = newCategory.nombre.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/[^\w-]+/g, '');
            }
            
            categories.push(newCategory);
            const jsonToSave = { categorias: categories };
            await fs.writeFile(CATEGORIES_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, category: newCategory })
            };
        }

        // PUT - Actualizar categoría
        if (event.httpMethod === 'PUT') {
            const pathParts = event.path.split('/');
            const categoryId = parseInt(pathParts[pathParts.length - 1]);
            const updatedCategory = JSON.parse(event.body);
            
            const index = categories.findIndex(c => c.id === categoryId);
            if (index === -1) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Categoría no encontrada' })
                };
            }
            
            if (updatedCategory.nombre && updatedCategory.nombre !== categories[index].nombre) {
                updatedCategory.slug = updatedCategory.nombre.toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/[^\w-]+/g, '');
            }
            
            categories[index] = { ...categories[index], ...updatedCategory };
            const jsonToSave = { categorias: categories };
            await fs.writeFile(CATEGORIES_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, category: categories[index] })
            };
        }

        // DELETE - Eliminar categoría
        if (event.httpMethod === 'DELETE') {
            const pathParts = event.path.split('/');
            const categoryId = parseInt(pathParts[pathParts.length - 1]);
            
            const filteredCategories = categories.filter(c => c.id !== categoryId);
            
            if (filteredCategories.length === categories.length) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Categoría no encontrada' })
                };
            }
            
            const jsonToSave = { categorias: filteredCategories };
            await fs.writeFile(CATEGORIES_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Categoría eliminada' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };

    } catch (error) {
        console.error('Error en función categories:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error del servidor', details: error.message })
        };
    }
};

