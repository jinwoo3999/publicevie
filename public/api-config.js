// Auto-detect API URL based on environment
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://evie-system.vercel.app/api';

console.log('API_URL:', API_URL);
