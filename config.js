// Configuración de la API
// Este archivo detecta automáticamente si estás en desarrollo o producción
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : window.location.origin + '/api'; // En producción, usar la misma URL del sitio + /api

