import dotenv from 'dotenv';
dotenv.config();

/**
 * Secure Backend Configuration
 * Never exposes or logs raw secret values.
 */
export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
  dataGovApiKey: process.env.DATA_GOV_IN_API_KEY || '',
  dataGovResourceId: process.env.DATA_GOV_IN_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070',
  dataGovBaseUrl: process.env.DATA_GOV_IN_API_BASE_URL || 'https://api.data.gov.in/resource',
  weatherBaseUrl: process.env.WEATHER_API_BASE_URL || 'https://api.open-meteo.com/v1/forecast',
  defaultLatitude: parseFloat(process.env.DEFAULT_LATITUDE || '17.6868'),
  defaultLongitude: parseFloat(process.env.DEFAULT_LONGITUDE || '83.2185'),
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
  environment: process.env.NODE_ENV || 'development',
  userAgent: 'LocalPulseAI-Retail/1.0 (https://github.com/Yagneswarasaicode/LocalPulse-AI)',
};

/**
 * Sanitized configuration summary for diagnostics and health checks.
 * Absolutely NO secret values are returned.
 */
export function getSanitizedConfig() {
  return {
    port: config.port,
    environment: config.environment,
    hasGeminiKey: Boolean(config.geminiApiKey && config.geminiApiKey.trim().length > 0),
    hasDataGovKey: Boolean(config.dataGovApiKey && config.dataGovApiKey.trim().length > 0),
    dataGovResourceId: config.dataGovResourceId,
    weatherBaseUrl: config.weatherBaseUrl,
    defaultLocation: {
      latitude: config.defaultLatitude,
      longitude: config.defaultLongitude,
      timezone: config.defaultTimezone,
      city: 'Visakhapatnam',
    },
    userAgent: config.userAgent,
  };
}
