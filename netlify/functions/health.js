exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
    };

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
            status: 'ok', 
            message: 'Servidor funcionando correctamente',
            timestamp: new Date().toISOString()
        })
    };
};

