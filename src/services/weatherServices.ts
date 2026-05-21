// src/services/weatherService.ts
// Centralized API calls for weather data from OpenWeatherMap

// IMPORTANT: Replace with your actual OpenWeatherMap API key
// Get your free API key from: https://home.openweathermap.org/api_keys
const WEATHER_API_KEY = 'YOUR_API_KEY_HERE'; // <-- CHANGE THIS
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
  feelsLike: string;
  icon: string;
}

export const weatherService = {
  // Get current weather by city name
  getCurrentWeather: async (city: string, country?: string): Promise<WeatherData> => {
    try {
      const query = country ? `${city},${country}` : city;
      const response = await fetch(
        `${WEATHER_API_BASE}/weather?q=${query}&units=metric&appid=${WEATHER_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert OpenWeatherMap response to your app's format
      return {
        temp: `${Math.round(data.main.temp)}°C`,
        condition: data.weather[0].main,
        humidity: `${data.main.humidity}%`,
        wind: `${Math.round(data.wind.speed * 3.6)} km/h`, // Convert m/s to km/h
        feelsLike: `${Math.round(data.main.feels_like)}°C`,
        icon: getWeatherIcon(data.weather[0].icon)
      };
    } catch (error) {
      console.error('Weather API error for', city, ':', error);
      // Return fallback weather data when API fails
      return {
        temp: '--°C',
        condition: 'Unknown',
        humidity: '--%',
        wind: '-- km/h',
        feelsLike: '--°C',
        icon: '🌡️'
      };
    }
  },

  // Get weather for multiple cities (batch)
  getMultipleWeather: async (cities: string[]): Promise<Record<string, WeatherData>> => {
    const results: Record<string, WeatherData> = {};
    
    // Use Promise.all for parallel requests (max 60 calls/minute on free tier)
    await Promise.all(
      cities.map(async (city) => {
        results[city] = await weatherService.getCurrentWeather(city);
      })
    );
    
    return results;
  },

  // Get 5-day weather forecast
  getForecast: async (city: string, country?: string): Promise<WeatherData[]> => {
    try {
      const query = country ? `${city},${country}` : city;
      const response = await fetch(
        `${WEATHER_API_BASE}/forecast?q=${query}&units=metric&appid=${WEATHER_API_KEY}`
      );
      
      if (!response.ok) throw new Error('Forecast API error');
      
      const data = await response.json();
      
      // Return forecast for next 5 days (one reading per day at noon)
      const dailyForecasts = data.list.filter((item: any, index: number) => index % 8 === 0);
      
      return dailyForecasts.map((item: any) => ({
        temp: `${Math.round(item.main.temp)}°C`,
        condition: item.weather[0].main,
        humidity: `${item.main.humidity}%`,
        wind: `${Math.round(item.wind.speed * 3.6)} km/h`,
        feelsLike: `${Math.round(item.main.feels_like)}°C`,
        icon: getWeatherIcon(item.weather[0].icon)
      }));
    } catch (error) {
      console.error('Forecast API error:', error);
      return [];
    }
  }
};

// Helper function: Convert OpenWeatherMap icon code to emoji
function getWeatherIcon(iconCode: string): string {
  const iconMap: Record<string, string> = {
    '01d': '☀️', // clear sky day
    '01n': '🌙', // clear sky night
    '02d': '⛅', // few clouds day
    '02n': '☁️', // few clouds night
    '03d': '☁️', // scattered clouds
    '03n': '☁️',
    '04d': '☁️', // broken clouds
    '04n': '☁️',
    '09d': '🌧️', // shower rain
    '09n': '🌧️',
    '10d': '🌦️', // rain
    '10n': '🌧️',
    '11d': '⛈️', // thunderstorm
    '11n': '⛈️',
    '13d': '❄️', // snow
    '13n': '❄️',
    '50d': '🌫️', // mist
    '50n': '🌫️',
  };
  
  return iconMap[iconCode] || '🌡️';
}