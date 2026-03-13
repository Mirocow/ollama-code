/**
 * Weather Plugin for Ollama Code
 *
 * Provides weather information using Open-Meteo API (free, no API key required)
 * or OpenWeatherMap API (requires API key for better accuracy)
 *
 * @license Apache-2.0
 */

const OPEN_METEO_API = 'https://api.open-meteo.com/v1';
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1';

/**
 * Plugin configuration
 */
let config = {
  apiKey: null,
  defaultUnits: 'celsius'
};

/**
 * Initialize plugin with settings
 */
function initialize(settings = {}) {
  config = { ...config, ...settings };
  console.log('[Weather Plugin] Initialized');
}

/**
 * Geocode city name to coordinates
 */
async function geocodeCity(city) {
  const url = `${GEOCODING_API}/search?name=${encodeURIComponent(city)}&count=1`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error(`City "${city}" not found`);
  }

  const location = data.results[0];
  return {
    lat: location.latitude,
    lon: location.longitude,
    name: location.name,
    country: location.country
  };
}

/**
 * Get current weather for a city
 */
async function getWeather(params) {
  const { city, units = config.defaultUnits } = params;

  if (!city) {
    return {
      success: false,
      error: 'City parameter is required'
    };
  }

  try {
    // Get coordinates
    const location = await geocodeCity(city);

    // Get weather data
    const tempUnit = units === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const url = `${OPEN_METEO_API}/forecast?latitude=${location.lat}&longitude=${location.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=${tempUnit}&timezone=auto`;

    const response = await fetch(url);
    const data = await response.json();

    const current = data.current;
    const weatherCode = current.weather_code;

    // Map weather codes to descriptions
    const weatherDescriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      95: 'Thunderstorm'
    };

    const description = weatherDescriptions[weatherCode] || 'Unknown';

    const tempSymbol = units === 'fahrenheit' ? '°F' : '°C';

    const result = `🌤️ Weather for ${location.name}, ${location.country}:

   Temperature: ${current.temperature_2m}${tempSymbol}
   Humidity: ${current.relative_humidity_2m}%
   Wind Speed: ${current.wind_speed_10m} km/h
   Conditions: ${description}

   Last updated: ${new Date().toLocaleString()}`;

    return {
      success: true,
      data: result,
      display: {
        summary: `${current.temperature_2m}${tempSymbol}, ${description} in ${location.name}`
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get weather: ${error.message}`
    };
  }
}

/**
 * Get weather forecast for a city
 */
async function getForecast(params) {
  const { city, days = 3 } = params;

  if (!city) {
    return {
      success: false,
      error: 'City parameter is required'
    };
  }

  try {
    // Get coordinates
    const location = await geocodeCity(city);

    // Get forecast data
    const url = `${OPEN_METEO_API}/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=celsius&timezone=auto&forecast_days=${Math.min(days, 7)}`;

    const response = await fetch(url);
    const data = await response.json();

    const daily = data.daily;

    // Map weather codes to descriptions
    const weatherDescriptions = {
      0: '☀️ Clear',
      1: '🌤️ Mainly clear',
      2: '⛅ Partly cloudy',
      3: '☁️ Overcast',
      45: '🌫️ Foggy',
      48: '🌫️ Rime fog',
      51: '🌦️ Light drizzle',
      53: '🌦️ Drizzle',
      55: '🌧️ Dense drizzle',
      61: '🌧️ Light rain',
      63: '🌧️ Rain',
      65: '🌧️ Heavy rain',
      71: '🌨️ Light snow',
      73: '🌨️ Snow',
      75: '❄️ Heavy snow',
      95: '⛈️ Thunderstorm'
    };

    let result = `📅 ${days}-Day Forecast for ${location.name}, ${location.country}:\n\n`;

    for (let i = 0; i < daily.time.length; i++) {
      const date = new Date(daily.time[i]);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const description = weatherDescriptions[daily.weather_code[i]] || '❓ Unknown';
      const maxTemp = Math.round(daily.temperature_2m_max[i]);
      const minTemp = Math.round(daily.temperature_2m_min[i]);
      const precip = daily.precipitation_probability_max[i] || 0;

      result += `   ${dayName}: ${description}  ${minTemp}°C - ${maxTemp}°C  💧${precip}%\n`;
    }

    result += `\n   Data from Open-Meteo API`;

    return {
      success: true,
      data: result,
      display: {
        summary: `Forecast for ${location.name}: ${daily.time.length} days`
      }
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to get forecast: ${error.message}`
    };
  }
}

/**
 * Plugin lifecycle hooks
 */
function onActivate(context) {
  console.log('[Weather Plugin] Activated');
  if (context?.settings) {
    initialize(context.settings);
  }
}

function onDeactivate() {
  console.log('[Weather Plugin] Deactivated');
}

// Export plugin interface
module.exports = {
  initialize,
  getWeather,
  getForecast,
  onActivate,
  onDeactivate,
  handlers: {
    get_weather: getWeather,
    get_forecast: getForecast
  }
};
