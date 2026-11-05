import { cacheService } from './CacheService.js';

/**
 * Open-Meteo Weather Service
 * Free public API (600 req/min, 10,000 req/day).
 * Strictly reports LIVE only on actual HTTP 200 success.
 */
class WeatherService {
  constructor() {
    this.defaultLat = 17.6868; // Visakhapatnam (Poorna Market / MVP Rythu Bazaar)
    this.defaultLon = 83.2185;
    this.defaultTimezone = 'Asia/Kolkata';
    this.cacheTtlSeconds = 1800; // 30 minutes
  }

  /**
   * Derive operational retail advisories from weather observations
   */
  deriveAdvisories(temperature, relativeHumidity, precipitation) {
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

    return advisories;
  }

  /**
   * Normalize Open-Meteo response payload
   */
  normalizeWeather(raw, lat, lon) {
    const current = raw.current || {};
    const daily = raw.daily || {};

    const temperature = typeof current.temperature_2m === 'number' ? current.temperature_2m : null;
    const relativeHumidity = typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : null;
    const precipitation = typeof current.precipitation === 'number' ? current.precipitation : 0;
    const weatherCode = typeof current.weather_code === 'number' ? current.weather_code : 0;

    const advisories = (temperature !== null && relativeHumidity !== null)
      ? this.deriveAdvisories(temperature, relativeHumidity, precipitation)
      : [];

    const dailyForecast = [];
    if (Array.isArray(daily.time)) {
      for (let i = 0; i < daily.time.length; i++) {
        dailyForecast.push({
          date: daily.time[i],
          maxTemp: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
          minTemp: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null,
          precipitationSum: daily.precipitation_sum ? daily.precipitation_sum[i] : 0,
        });
      }
    }

    return {
      provider: 'Open-Meteo',
      location: {
        latitude: lat,
        longitude: lon,
        city: 'Visakhapatnam',
        locality: 'Poorna Market & MVP Rythu Bazaar',
        timezone: raw.timezone || 'Asia/Kolkata',
      },
      current: {
        temperatureC: temperature,
        relativeHumidityPercent: relativeHumidity,
        precipitationMm: precipitation,
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
  async getWeather(lat = this.defaultLat, lon = this.defaultLon) {
    const cacheKey = `weather_${Number(lat).toFixed(4)}_${Number(lon).toFixed(4)}`;

    return cacheService.wrap(cacheKey, this.cacheTtlSeconds, async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${encodeURIComponent(this.defaultTimezone)}&forecast_days=3`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
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

        const normalized = this.normalizeWeather(raw, lat, lon);
        return {
          success: true,
          status: 'LIVE',
          data: normalized,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    });
  }
}

export const weatherService = new WeatherService();
