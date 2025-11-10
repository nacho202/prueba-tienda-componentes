const fs = require('fs').promises;
const path = require('path');

const CREDENTIALS_FILE = path.join(process.cwd(), 'admin_credentials.json');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        // GET - Obtener credenciales
        if (event.httpMethod === 'GET') {
            let credentials;
            try {
                await fs.access(CREDENTIALS_FILE);
                const data = await fs.readFile(CREDENTIALS_FILE, 'utf8');
                credentials = JSON.parse(data);
            } catch {
                credentials = {
                    username: 'admin',
                    password: 'admin123'
                };
                await fs.writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf8');
            }
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(credentials)
            };
        }

        // POST - Actualizar contraseña
        if (event.httpMethod === 'POST') {
            const { username, password } = JSON.parse(event.body);
            
            if (!password || password.length < 6) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' })
                };
            }
            
            const credentials = { username, password };
            await fs.writeFile(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf8');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, message: 'Credenciales actualizadas exitosamente' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Método no permitido' })
        };

    } catch (error) {
        console.error('Error en función credentials:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error del servidor', details: error.message })
        };
    }
};

