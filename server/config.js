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
    userAgent: config.userAgent,
  };
}
