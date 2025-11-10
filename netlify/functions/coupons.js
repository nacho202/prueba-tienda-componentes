const fs = require('fs').promises;
const path = require('path');

const COUPONS_FILE = path.join(process.cwd(), 'cupon.json');

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
        const data = await fs.readFile(COUPONS_FILE, 'utf8');
        const json = JSON.parse(data);
        const coupons = json.cupones || json;

        // GET - Obtener todos los cupones
        if (event.httpMethod === 'GET') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(coupons)
            };
        }

        // POST - Agregar cupón
        if (event.httpMethod === 'POST' && event.path.includes('/add')) {
            const newCoupon = JSON.parse(event.body);
            
            if (coupons.some(c => c.codigo.toUpperCase() === newCoupon.codigo.toUpperCase())) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'El código de cupón ya existe' })
                };
            }
            
            coupons.push(newCoupon);
            const jsonToSave = { cupones: coupons };
            await fs.writeFile(COUPONS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, coupon: newCoupon })
            };
        }

        // PUT - Actualizar cupón
        if (event.httpMethod === 'PUT') {
            const pathParts = event.path.split('/');
            const codigo = decodeURIComponent(pathParts[pathParts.length - 1]).toUpperCase();
            const updatedCoupon = JSON.parse(event.body);
            
            const index = coupons.findIndex(c => c.codigo.toUpperCase() === codigo);
            if (index === -1) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Cupón no encontrado' })
                };
            }
            
            coupons[index] = { ...coupons[index], ...updatedCoupon };
            const jsonToSave = { cupones: coupons };
            await fs.writeFile(COUPONS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, coupon: coupons[index] })
            };
        }

        // DELETE - Eliminar cupón
        if (event.httpMethod === 'DELETE') {
            const pathParts = event.path.split('/');
            const codigo = decodeURIComponent(pathParts[pathParts.length - 1]).toUpperCase();
            
            const filteredCoupons = coupons.filter(c => c.codigo.toUpperCase() !== codigo);
            
            if (filteredCoupons.length === coupons.length) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Cupón no encontrado' })
                };
            }
            
            const jsonToSave = { cupones: filteredCoupons };
            await fs.writeFile(COUPONS_FILE, JSON.stringify(jsonToSave, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Cupón eliminado' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };

    } catch (error) {
        console.error('Error en función coupons:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error del servidor', details: error.message })
        };
    }
};

