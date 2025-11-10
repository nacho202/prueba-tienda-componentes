const fs = require('fs').promises;
const path = require('path');

const SALES_FILE = path.join(process.cwd(), 'sales.json');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        // GET - Obtener todas las ventas
        if (event.httpMethod === 'GET') {
            let sales = [];
            try {
                await fs.access(SALES_FILE);
                const data = await fs.readFile(SALES_FILE, 'utf8');
                sales = JSON.parse(data);
            } catch {
                await fs.writeFile(SALES_FILE, '[]', 'utf8');
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(sales)
            };
        }

        // POST - Registrar una nueva venta
        if (event.httpMethod === 'POST') {
            let sales = [];
            try {
                const data = await fs.readFile(SALES_FILE, 'utf8');
                sales = JSON.parse(data);
            } catch {
                sales = [];
            }
            
            const newSale = JSON.parse(event.body);
            sales.push(newSale);
            
            await fs.writeFile(SALES_FILE, JSON.stringify(sales, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, sale: newSale })
            };
        }

        // DELETE - Limpiar historial
        if (event.httpMethod === 'DELETE') {
            await fs.writeFile(SALES_FILE, '[]', 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Historial de ventas limpiado' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };

    } catch (error) {
        console.error('Error en función sales:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error del servidor', details: error.message })
        };
    }
};

