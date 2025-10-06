// Copy this file to config.js and add your actual API keys
const CONFIG = {
    OPENWEATHER_API_KEY: 'your_openweathermap_api_key_here',
    GOOGLE_MAPS_API_KEY: 'your_google_maps_api_key_here'
};

// For vanilla JavaScript, we'll expose this globally
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
