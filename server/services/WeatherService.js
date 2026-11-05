import { config } from '../config.js';
import { cacheService } from './CacheService.js';

/**
 * Open-Meteo Weather Service
 * Free public API (600 req/min, 10,000 req/day).
 * Strictly reports LIVE only on actual HTTP 200 success.
 */
export class WeatherService {
  constructor() {
    this.defaultLat = config.defaultLatitude || 17.6868; // Visakhapatnam
    this.defaultLon = config.defaultLongitude || 83.2185;
    this.defaultTimezone = config.defaultTimezone || 'Asia/Kolkata';
    this.baseUrl = config.weatherBaseUrl || 'https://api.open-meteo.com/v1/forecast';
    this.cacheTtlSeconds = 1800; // 30 minutes
  }

  /**
   * Derive operational retail advisories from weather observations
   */
  deriveAdvisories(temperature, relativeHumidity, precipitation, windSpeed = 0) {
    const advisories = [];

    // Heat stress on perishables
    if (temperature >= 35) {
      advisories.push({
        type: 'extreme_heat',
        severity: 'high',
        textEn: 'Severe coastal heat (≥35°C). Fast wilting for leafy greens. Spritz produce every 45 mins.',
        textTe: 'తీవ్రమైన ఎండ (≥35°C). ఆకుకూరలు త్వరగా వాడిపోతాయి. ప్రతి 45 నిమిషాలకు నీళ్లు చల్లండి.',
      });
    } else if (temperature >= 32) {
      advisories.push({
        type: 'heat_warning',
        severity: 'medium',
        textEn: 'Warm weather (>32°C). Keep tomatoes and leafy vegetables shaded under aerated covers.',
        textTe: 'ఎండ ప్రభావం ఎక్కువ. టమాటాలు, ఆకుకూరలను నీడలో గాలి తగిలేలా ఉంచండి.',
      });
    }

    // Coastal humidity & fungal/rot risk
    if (relativeHumidity >= 80) {
      advisories.push({
        type: 'high_humidity',
        severity: 'medium',
        textEn: 'High coastal humidity (>80%). Elevated tomato and onion skin rot risk. Avoid wet stacking.',
        textTe: 'విశాఖ తీర తేమ ఎక్కువ (>80%). టమాటాలు, ఉల్లిపాయలు తడి తగలకుండా గాలి ఆడేలా చూడండి.',
      });
    }

    // Rainfall and footfall disruption
    if (precipitation >= 5.0) {
      advisories.push({
        type: 'heavy_rain',
        severity: 'high',
        textEn: 'Heavy rainfall forecasted (≥5mm). Substantial Rythu Bazaar footfall drop expected. Reduce fresh vegetable procurement by 20-30%.',
        textTe: 'భారీ వర్ష సూచన (≥5mm). మార్కెట్‌కు వచ్చే ప్రజలు తగ్గుతారు. కూరగాయల కొనుగోలు 20-30% తగ్గించండి.',
      });
    } else if (precipitation > 0.5) {
      advisories.push({
        type: 'light_rain',
        severity: 'low',
        textEn: 'Intermittent showers. Keep plastic tarps accessible. Expect delayed afternoon shoppers.',
        textTe: 'చిరుజల్లులు కురిసే అవకాశం. కవర్లు సిద్ధంగా ఉంచుకోండి.',
      });
    }

    // Wind warnings for outdoor stall fixtures
    if (windSpeed >= 25) {
      advisories.push({
        type: 'high_wind',
        severity: 'medium',
        textEn: `Gusty coastal winds (${windSpeed} km/h). Secure umbrella awnings and fragile produce stands.`,
        textTe: `తీవ్రమైన గాలులు (${windSpeed} km/h). బండి గొడుగులు, కవర్లను గట్టిగా కట్టండి.`,
      });
    }

    return advisories;
  }

  /**
   * Validate coordinates
   */
  isValidCoordinates(lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
      return false;
    }
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Normalize Open-Meteo response payload
   */
  normalizeWeather(raw, lat, lon, isDemoLocation = false) {
    const current = raw.current || {};
    const daily = raw.daily || {};

    const temperature = typeof current.temperature_2m === 'number' ? current.temperature_2m : null;
    const relativeHumidity = typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : null;
    const precipitation = typeof current.precipitation === 'number' ? current.precipitation : 0;
    const weatherCode = typeof current.weather_code === 'number' ? current.weather_code : 0;
    const windSpeed = typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : 0;

    const advisories = (temperature !== null && relativeHumidity !== null)
      ? this.deriveAdvisories(temperature, relativeHumidity, precipitation, windSpeed)
      : [];

    const dailyForecast = [];
    if (Array.isArray(daily.time)) {
      for (let i = 0; i < daily.time.length; i++) {
        dailyForecast.push({
          date: daily.time[i],
          maxTemp: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
          minTemp: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null,
          precipitationSum: daily.precipitation_sum ? daily.precipitation_sum[i] : 0,
          precipitationProbability: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
        });
      }
    }

    return {
      provider: 'Open-Meteo',
      location: {
        latitude: lat,
        longitude: lon,
        city: isDemoLocation ? 'Visakhapatnam (Demo Baseline)' : 'Selected Business Location',
        locality: isDemoLocation ? 'Poorna Market & MVP Rythu Bazaar' : 'Custom Geo-Coordinates',
        timezone: raw.timezone || this.defaultTimezone,
        isDemoLocation,
      },
      current: {
        temperatureC: temperature,
        relativeHumidityPercent: relativeHumidity,
        precipitationMm: precipitation,
        windSpeedKmH: windSpeed,
        weatherCode,
        isDay: current.is_day === 1,
        observedAt: current.time || new Date().toISOString(),
      },
      dailyForecast,
      advisories,
      attribution: 'Weather data by Open-Meteo.com under CC BY 4.0',
    };
  }

  /**
   * Fetch weather with strict LIVE verification and fallback
   */
  async getWeather(lat = null, lon = null) {
    let targetLat = lat !== null && lat !== undefined ? parseFloat(lat) : this.defaultLat;
    let targetLon = lon !== null && lon !== undefined ? parseFloat(lon) : this.defaultLon;
    const isDemoLocation = (lat === null || lat === undefined || lon === null || lon === undefined);

    if (!this.isValidCoordinates(targetLat, targetLon)) {
      throw new Error(`Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180 (received lat: ${lat}, lon: ${lon})`);
    }

    const cacheKey = `weather_${targetLat.toFixed(4)}_${targetLon.toFixed(4)}`;

    return cacheService.wrap(cacheKey, this.cacheTtlSeconds, async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const url = `${this.baseUrl}?latitude=${targetLat}&longitude=${targetLon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=${encodeURIComponent(this.defaultTimezone)}&forecast_days=7`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': config.userAgent,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Open-Meteo returned HTTP ${response.status}: ${response.statusText}`);
        }

        const raw = await response.json();
        if (!raw || !raw.current) {
          throw new Error('Open-Meteo returned invalid JSON missing "current" payload');
        }

        const normalized = this.normalizeWeather(raw, targetLat, targetLon, isDemoLocation);
        return {
          success: true,
          status: 'LIVE',
          data: normalized,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        return {
          success: false,
          status: 'UNAVAILABLE',
          error: `Weather service offline or unreachable (${err.message || 'fetch failed'})`,
          provider: 'Open-Meteo',
          data: null,
          advisories: [],
        };
      }
    });
  }
}

export const weatherService = new WeatherService();
