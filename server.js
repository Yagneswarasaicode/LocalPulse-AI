import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'LocalPulse AI',
    hasGeminiKey: Boolean(apiKey),
    model: 'gemini-3.8-flash',
    location: 'Poorna Market & MVP Rythu Bazaar, Visakhapatnam',
    team: 'VECTORX'
  });
});

// Deterministic fallback generator matching prompt requirements
function generateFallbackExplanation(budget, totalCost, remainingCash, items) {
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

  return {
    telugu_audio_script: teluguAudioScript,
    english_explanation: englishExplanation,
    key_actions: buyItems.map(i => ({
      item: i.nameEn,
      item_te: i.nameTe || i.nameEn,
      quantity_kg: i.recommendedBuyKg,
      cost_inr: i.estimatedCost,
      priority: i.priority,
      reason: `Stock covers only ${(Math.round(i.daysLeft * 10) / 10)} days. Urgent demand at Rythu Bazaar.`
    })),
    items_to_skip: skipItems.map(i => ({
      item: i.nameEn,
      item_te: i.nameTe || i.nameEn,
      reason: `You have ${Math.round(i.daysLeft * 10) / 10} days of buffer (${i.remainingKg}kg). Avoid spoilage loss.`,
      reason_te: `${i.remainingKg} కేజీలు మిగిలి ఉన్నాయి (${Math.round(i.daysLeft * 10) / 10} రోజులు). కుళ్లిపోకుండా డబ్బు ఆదా చేయండి.`
    })),
    remaining_cash_advice: {
      telugu: `మిగిలిన ₹${remainingCash.toLocaleString('en-IN')} అత్యవసర లేదా మధ్యాహ్నం ధర తగ్గినప్పుడు మాత్రమే వాడండి.`,
      english: `Keep leftover ₹${remainingCash.toLocaleString('en-IN')} safe as working capital reserve for afternoon price dips at Poorna Market.`
    },
    mandi_tip: {
      telugu: 'విశాఖపట్నం తేమ వల్ల టమాటాలు త్వరగా పాడవుతాయి. గాలి తగిలే బుట్టల్లో భద్రపరచండి.',
      english: 'Vizag coastal humidity increases tomato spoilage. Store in aerated plastic crates away from direct sunlight.'
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
  const { budget = 2000, items = [], totalCost = 0, remainingCash = 0 } = req.body;

  const itemsText = items.map(item => 
    `${item.nameEn} (${item.nameTe || ''}): ${item.remainingKg}kg remaining (Sales: ${item.dailySalesKg}kg/day, Price: ₹${item.pricePerKg}/kg, Days of stock left: ${item.daysLeft?.toFixed(2) || '0'}, Priority: ${item.priority}, Recommended Buy: ${item.recommendedBuyKg}kg, Cost: ₹${item.estimatedCost})`
  ).join('\n');

  const promptInput = `Shop Cash: ₹${budget}. Total Allocated: ₹${totalCost}. Remaining Cash: ₹${remainingCash}.\nItems Data:\n${itemsText}`;

  if (!ai) {
    console.log('[LocalPulse AI] No GEMINI_API_KEY set. Delivering grounded fallback response.');
    const fallback = generateFallbackExplanation(budget, totalCost, remainingCash, items);
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
4. Return ONLY a valid JSON object matching the requested schema. No markdown formatting ticks before or after.`;

    const userPrompt = `Here is the morning procurement math for a Visakhapatnam vendor:
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
      model: 'gemini-3.8-flash',
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
      parsedData = generateFallbackExplanation(budget, totalCost, remainingCash, items);
    }

    return res.json({
      success: true,
      source: 'gemini-3.8-flash',
      data: parsedData
    });

  } catch (error) {
    console.error('[LocalPulse AI] Gemini API call error:', error);
    const fallback = generateFallbackExplanation(budget, totalCost, remainingCash, items);
    return res.json({
      success: true,
      source: 'fallback_after_error',
      error: error.message,
      data: fallback
    });
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
