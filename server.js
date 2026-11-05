import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

import { config, getSanitizedConfig } from './server/config.js';
import { weatherService } from './server/services/WeatherService.js';
import { marketPriceService } from './server/services/MarketPriceService.js';
import { barcodeService } from './server/services/BarcodeService.js';
import { holidayService } from './server/services/HolidayService.js';
import { validateFileBuffer, parseMultipartFormData } from './server/services/MultipartParser.js';
import { documentVisionService } from './server/services/DocumentVisionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.port;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.raw({ type: 'multipart/form-data', limit: '15mb' }));

// Initialize Google GenAI if key is present
const apiKey = config.geminiApiKey;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Enhanced Health check endpoint reporting provider status without exposing secrets
app.get('/api/health', (req, res) => {
  const sanitized = getSanitizedConfig();
  res.json({
    status: 'ok',
    appName: 'LocalPulse AI',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    location: 'Poorna Market & MVP Rythu Bazaar, Visakhapatnam',
    team: 'VECTORX',
    hasGeminiKey: sanitized.hasGeminiKey,
    model: 'gemini-2.5-flash',
    providers: {
      gemini: {
        configured: sanitized.hasGeminiKey,
        status: sanitized.hasGeminiKey ? 'CONFIGURED' : 'BLOCKED',
        note: sanitized.hasGeminiKey ? 'Ready for inference' : 'GEMINI_API_KEY not configured. Deterministic fallback active.',
      },
      weather: {
        provider: 'Open-Meteo',
        status: 'READY',
        endpoint: 'https://api.open-meteo.com/v1/forecast',
        license: 'CC BY 4.0',
      },
      mandi: {
        provider: 'data.gov.in (AGMARKNET)',
        configured: sanitized.hasDataGovKey,
        status: sanitized.hasDataGovKey ? 'CONFIGURED' : 'BLOCKED',
        note: sanitized.hasDataGovKey ? 'Live API key ready' : 'DATA_GOV_IN_API_KEY not configured. Serving verified historical benchmarks.',
      },
      barcode: {
        provider: 'Open Food Facts v3',
        status: 'READY',
        endpoint: 'https://world.openfoodfacts.org/api/v3',
        userAgent: sanitized.userAgent,
      },
      holidays: {
        provider: 'Official Central & AP Gazetted Calendars',
        status: 'READY',
        year: 2026,
        sources: ['DoPT (Govt of India)', 'GAD (Govt of Andhra Pradesh)'],
      },
    },
  });
});

// GET /api/weather: Open-Meteo weather with operational retail advisories
app.get('/api/weather', async (req, res) => {
  const lat = req.query.lat ? parseFloat(req.query.lat) : undefined;
  const lon = req.query.lon ? parseFloat(req.query.lon) : undefined;

  try {
    const result = await weatherService.getWeather(lat, lon);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'UNAVAILABLE',
      error: error.message || 'Failed to fetch weather observation',
    });
  }
});

// GET /api/mandi: data.gov.in / AGMARKNET prices with ₹/quintal -> ₹/kg normalization
app.get('/api/mandi', async (req, res) => {
  const state = req.query.state !== undefined ? req.query.state : 'Andhra Pradesh';
  const district = req.query.district !== undefined ? req.query.district : (req.query.commodity ? null : 'Visakhapatnam');
  const market = req.query.market || null;
  const commodity = req.query.commodity || null;
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
  const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;

  try {
    const result = await marketPriceService.getMandiPrices({ state, district, market, commodity, limit, offset });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'UNAVAILABLE',
      error: error.message || 'Failed to fetch mandi market prices',
    });
  }
});

// GET /api/product/barcode/:barcode: Open Food Facts lookup with descriptive User-Agent
app.get('/api/product/barcode/:barcode', async (req, res) => {
  const barcode = req.params.barcode;

  try {
    const result = await barcodeService.lookupBarcode(barcode);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'UNAVAILABLE',
      error: error.message || 'Failed to query barcode directory',
    });
  }
});

// GET /api/holidays: Official Central & AP Gazetted Holiday Calendar 2026
app.get('/api/holidays', (req, res) => {
  const year = req.query.year || 2026;
  const region = req.query.region || 'AP';

  const result = holidayService.getHolidays(year, region);
  res.json(result);
});

// Deterministic fallback generator matching prompt requirements with weather and mandi grounding
function generateFallbackExplanation(budget, totalCost, remainingCash, items, weather = null, mandiPrices = []) {
  const buyItems = items.filter(i => (i.recommendedBuyKg || 0) > 0);
  const skipItems = items.filter(i => (i.recommendedBuyKg || 0) === 0 || i.priority === 'SKIP');

  // Exact shape requested in prompt:
  // "ఈ రోజు 20 కేజీల టమాటాలు (₹480), 20 కేజీల ఉల్లిపాయలు (₹600) కొనండి. మీ వద్ద 4 రోజులకు సరిపడా బంగాళాదుంపలు ఉన్నందున వాటిని కొనవద్దు. మిగిలిన నగదు: ₹920."
  const buyTeluguParts = buyItems.slice(0, 3).map(i => `${i.recommendedBuyKg} కేజీల ${i.nameTe || i.nameEn} (₹${i.estimatedCost})`);
  let buyTeluguStr = buyTeluguParts.length > 0 ? `ఈ రోజు ${buyTeluguParts.join(', ')} కొనండి.` : 'ఈ రోజు ఎలాంటి కొత్త కొనుగోళ్లు అవసరం లేదు.';
  
  let skipTeluguStr = '';
  if (skipItems.length > 0) {
    const mainSkip = skipItems[0];
    const days = Math.round((mainSkip.daysLeft || 3) * 10) / 10;
    skipTeluguStr = ` మీ వద్ద ${days} రోజులకు సరిపడా ${mainSkip.nameTe || mainSkip.nameEn} ఉన్నందున వాటిని కొనవద్దు.`;
  }
  const cashTeluguStr = ` మిగిలిన నగదు: ₹${remainingCash.toLocaleString('en-IN')}.`;

  const teluguAudioScript = `${buyTeluguStr}${skipTeluguStr}${cashTeluguStr}`;

  const englishParts = buyItems.slice(0, 3).map(i => `${i.recommendedBuyKg}kg ${i.nameEn} (₹${i.estimatedCost})`);
  const englishExplanation = `Today buy ${englishParts.join(', ')}. Do not buy ${skipItems.length > 0 ? skipItems[0].nameEn : 'slow-moving items'} as you have enough stock left. Remaining cash: ₹${remainingCash.toLocaleString('en-IN')}.`;

  // Grounding weather and mandi into fallback tips
  let weatherTipEn = 'Vizag coastal humidity increases tomato spoilage. Store in aerated plastic crates.';
  let weatherTipTe = 'విశాఖపట్నం తేమ వల్ల టమాటాలు త్వరగా పాడవుతాయి. గాలి తగిలే బుట్టల్లో భద్రపరచండి.';
  if (weather && weather.current) {
    if (weather.current.temperatureC >= 32) {
      weatherTipEn = `High temperature (${weather.current.temperatureC}°C) today. Keep leafy greens shaded and spritz water frequently.`;
      weatherTipTe = `ఈ రోజు ఉష్ణోగ్రత (${weather.current.temperatureC}°C) ఎక్కువ. ఆకుకూరలను నీడలో ఉంచి తడి చల్లండి.`;
    } else if (weather.current.precipitationMm > 0) {
      weatherTipEn = `Rainfall (${weather.current.precipitationMm}mm) forecasted. Keep plastic tarpaulins ready and guard produce against waterlogging.`;
      weatherTipTe = `వర్ష సూచన (${weather.current.precipitationMm}mm). కవర్లు సిద్ధంగా ఉంచుకోండి.`;
    }
  }

  let mandiTipEn = weatherTipEn;
  let mandiTipTe = weatherTipTe;
  if (Array.isArray(mandiPrices) && mandiPrices.length > 0) {
    const tomatoMandi = mandiPrices.find(m => m.commodity && m.commodity.toLowerCase().includes('tomato')) || mandiPrices[0];
    mandiTipEn = `AGMARKNET Benchmark: ${tomatoMandi.commodity} modal price is ₹${tomatoMandi.modalPricePerKg}/kg at ${tomatoMandi.market || 'Visakhapatnam'}. Compare your purchase invoice against this benchmark.`;
    mandiTipTe = `మార్కెట్ మోడల్ రేటు: ${tomatoMandi.commodityTe || tomatoMandi.commodity} కిలో ₹${tomatoMandi.modalPricePerKg}గా ఉంది. మీ కొనుగోలు ధరను సరిచూసుకోండి.`;
  }

  return {
    telugu_audio_script: teluguAudioScript,
    english_explanation: englishExplanation,
    key_actions: buyItems.map(i => ({
      item: i.nameEn,
      item_te: i.nameTe || i.nameEn,
      quantity_kg: i.recommendedBuyKg,
      cost_inr: i.estimatedCost,
      priority: i.priority,
      reason: `Stock covers only ${(Math.round((i.daysLeft || 1) * 10) / 10)} days. Urgent demand at Rythu Bazaar.`
    })),
    items_to_skip: skipItems.map(i => ({
      item: i.nameEn,
      item_te: i.nameTe || i.nameEn,
      reason: `You have ${Math.round((i.daysLeft || 3) * 10) / 10} days of buffer (${i.remainingKg}kg). Avoid spoilage loss.`,
      reason_te: `${i.remainingKg} కేజీలు మిగిలి ఉన్నాయి (${Math.round((i.daysLeft || 3) * 10) / 10} రోజులు). కుళ్లిపోకుండా డబ్బు ఆదా చేయండి.`
    })),
    remaining_cash_advice: {
      telugu: `మిగిలిన ₹${remainingCash.toLocaleString('en-IN')} అత్యవసర లేదా మధ్యాహ్నం ధర తగ్గినప్పుడు మాత్రమే వాడండి.`,
      english: `Keep leftover ₹${remainingCash.toLocaleString('en-IN')} safe as working capital reserve for afternoon price dips at Poorna Market.`
    },
    mandi_tip: {
      telugu: mandiTipTe,
      english: mandiTipEn
    },
    budget_stats: {
      total_budget: budget,
      total_cost: totalCost,
      remaining_cash: remainingCash,
      zero_overrun_verified: totalCost <= budget
    }
  };
}

// POST /api/explain: Grounded Gemini Telugu Audio/Text Explainer
app.post('/api/explain', async (req, res) => {
  const { 
    budget = 2000, 
    items = [], 
    totalCost = 0, 
    remainingCash = 0,
    weather = null,
    mandiPrices = []
  } = req.body;

  let activeWeather = weather;
  if (!activeWeather) {
    try {
      const w = await weatherService.getWeather();
      activeWeather = w.data;
    } catch (_) {}
  }

  let activeMandi = mandiPrices;
  if (!activeMandi || !activeMandi.length) {
    try {
      const m = await marketPriceService.getMandiPrices({ district: 'Visakhapatnam', limit: 8 });
      activeMandi = m.data;
    } catch (_) {}
  }

  const itemsText = items.map(item => 
    `${item.nameEn} (${item.nameTe || ''}): ${item.remainingKg}kg remaining (Sales: ${item.dailySalesKg}kg/day, Price: ₹${item.pricePerKg}/kg, Days of stock left: ${item.daysLeft?.toFixed(2) || '0'}, Priority: ${item.priority}, Recommended Buy: ${item.recommendedBuyKg}kg, Cost: ₹${item.estimatedCost})`
  ).join('\n');

  let weatherContext = '';
  if (activeWeather && activeWeather.current) {
    weatherContext = `\nLive Weather Context (Visakhapatnam): Temperature ${activeWeather.current.temperatureC}°C, Relative Humidity ${activeWeather.current.relativeHumidityPercent}%, Precipitation ${activeWeather.current.precipitationMm}mm, Wind Speed ${activeWeather.current.windSpeedKmH || 0} km/h. Produce Advisories: ${(activeWeather.advisories || []).map(a => a.textEn).join('; ') || 'Standard coastal conditions'}.`;
  }

  let mandiContext = '';
  if (Array.isArray(activeMandi) && activeMandi.length > 0) {
    mandiContext = `\nLive AGMARKNET Mandi Price Benchmarks (AP / Visakhapatnam): ` + 
      activeMandi.slice(0, 8).map(m => `${m.commodity}: Modal ₹${m.modalPricePerKg}/kg (Range ₹${m.minPricePerKg}-₹${m.maxPricePerKg})`).join(', ');
  }

  const promptInput = `Shop Cash: ₹${budget}. Total Allocated: ₹${totalCost}. Remaining Cash: ₹${remainingCash}.\nItems Data:\n${itemsText}${weatherContext}${mandiContext}`;

  if (!ai) {
    console.log('[LocalPulse AI] No GEMINI_API_KEY set. Delivering grounded fallback response.');
    const fallback = generateFallbackExplanation(budget, totalCost, remainingCash, items, activeWeather, activeMandi);
    return res.json({
      success: true,
      source: 'simulated_grounded_engine',
      data: fallback
    });
  }

  try {
    const systemInstruction = `You are LocalPulse AI, an expert vegetable procurement advisor for street vendors at MVP Rythu Bazaar and Poorna Market in Visakhapatnam, Andhra Pradesh.
Your job is to interpret deterministic mathematical purchasing outputs and explain them in encouraging, clear Telugu and simple English.

CRITICAL INSTRUCTIONS:
1. Do not alter or hallucinate new purchase weights or prices. Honor the deterministic mathematical recommendations provided in the input.
2. The "telugu_audio_script" must be concise and match this exact shape and style:
   "ఈ రోజు 20 కేజీల టమాటాలు (₹480), 20 కేజీల ఉల్లిపాయలు (₹600) కొనండి. మీ వద్ద 4 రోజులకు సరిపడా బంగాళాదుంపలు ఉన్నందున వాటిని కొనవద్దు. మిగిలిన నగదు: ₹920."
3. Provide simple English translation in "english_explanation".
4. Market & Weather Grounding:
   - In "mandi_tip", compare the recommended purchase prices against the live AGMARKNET wholesale modal rates provided in the context, and provide actionable purchasing tips.
   - For perishables in "key_actions" and "items_to_skip", integrate today's weather observation (temperature, humidity, precipitation) into the operational advice.
5. Return ONLY a valid JSON object matching the requested schema. No markdown formatting ticks before or after.`;

    const userPrompt = `Here is the morning procurement math and market intelligence for a Visakhapatnam vendor:
${promptInput}

Generate a structured JSON response matching this schema:
{
  "telugu_audio_script": "string (Exact Telugu explanation matching the required shape)",
  "english_explanation": "string (Clear simple English explanation)",
  "key_actions": [
    {
      "item": "string",
      "item_te": "string",
      "quantity_kg": number,
      "cost_inr": number,
      "priority": "HIGH" | "MED" | "SKIP",
      "reason": "string"
    }
  ],
  "items_to_skip": [
    {
      "item": "string",
      "item_te": "string",
      "reason": "string",
      "reason_te": "string"
    }
  ],
  "remaining_cash_advice": {
    "telugu": "string",
    "english": "string"
  },
  "mandi_tip": {
    "telugu": "string",
    "english": "string"
  },
  "budget_stats": {
    "total_budget": ${budget},
    "total_cost": ${totalCost},
    "remaining_cash": ${remainingCash},
    "zero_overrun_verified": ${totalCost <= budget}
  }
}`;

    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    const responseText = response.text || '';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText.trim().replace(/^```json/, '').replace(/```$/, ''));
    } catch (parseErr) {
      console.warn('[LocalPulse AI] JSON parse error from Gemini output, using structured fallback:', parseErr);
      parsedData = generateFallbackExplanation(budget, totalCost, remainingCash, items, activeWeather, activeMandi);
    }

    return res.json({
      success: true,
      source: 'gemini-2.5-flash',
      data: parsedData
    });
  } catch (apiErr) {
    console.error('[LocalPulse AI] Gemini generation error, using fallback:', apiErr.message);
    const fallback = generateFallbackExplanation(budget, totalCost, remainingCash, items, activeWeather, activeMandi);
    return res.json({
      success: true,
      source: 'simulated_grounded_engine',
      data: fallback
    });
  }
});

// In-memory rate limiting map: ip -> { count, resetTime }
const rateLimitMap = new Map();
function checkRateLimit(ip, limit = 30, windowMs = 60000) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + windowMs;
  } else {
    entry.count += 1;
  }
  rateLimitMap.set(ip, entry);
  return entry.count <= limit;
}

// POST /api/extract-document: Multimodal Gemini Vision Document & Invoice Extractor
app.post('/api/extract-document', async (req, res) => {
  const clientIp = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please wait a moment before uploading another document.'
    });
  }

  let fileBuffer = null;
  let mimeType = null;
  let fileName = 'document';
  let language = req.query.lang || 'en';

  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ success: false, error: 'Malformed multipart body' });
    }
    const { fields, files } = parseMultipartFormData(req.body, contentType);
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No file found in multipart upload' });
    }
    const uploadedFile = files[0];
    fileBuffer = uploadedFile.buffer;
    mimeType = uploadedFile.mimeType;
    fileName = uploadedFile.filename || 'document';
    if (fields.language) language = fields.language;
  } else if (contentType.includes('application/json')) {
    const { fileBase64, mimeType: declaredMime, fileName: declaredName, language: declaredLang } = req.body || {};
    if (!fileBase64) {
      return res.status(400).json({ success: false, error: 'Missing fileBase64 payload' });
    }
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    fileBuffer = Buffer.from(cleanBase64, 'base64');
    mimeType = declaredMime;
    if (declaredName) fileName = declaredName;
    if (declaredLang) language = declaredLang;
  } else {
    return res.status(415).json({
      success: false,
      error: 'Unsupported content-type. Please use multipart/form-data or application/json.'
    });
  }

  // File signature, size, and page validation
  const validation = validateFileBuffer(fileBuffer, mimeType, fileName);
  if (!validation.valid) {
    const statusCode = validation.error.includes('exceeds maximum allowed limit') ? 413 : 400;
    return res.status(statusCode).json({ success: false, error: validation.error });
  }

  try {
    const extractionPromise = documentVisionService.extractDocument({
      fileBuffer,
      mimeType: validation.mimeType,
      fileName,
      language
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Document extraction timed out after 30 seconds')), 30000)
    );

    const result = await Promise.race([extractionPromise, timeoutPromise]);

    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('[Extract Document Error]:', err.message);
    const isApiKeyError = err.message && (err.message.includes('GEMINI_API_KEY') || err.message.includes('API key'));
    const isTimeout = err.message && err.message.includes('timed out');
    const statusCode = isApiKeyError ? 503 : isTimeout ? 504 : 500;

    return res.status(statusCode).json({
      success: false,
      error: err.message || 'Failed to extract document'
    });
  } finally {
    fileBuffer = null;
  }
});

// Serve frontend static build if dist exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[LocalPulse AI Server] Running on http://localhost:${PORT}`);
  console.log(`[LocalPulse AI Server] Gemini API Status: ${apiKey ? 'Configured with Gemini 3.8 Flash' : 'Simulated Grounded Engine Active (Set GEMINI_API_KEY in .env)'}`);
});
