import { config, getSanitizedConfig } from '../server/config.js';
import { cacheService } from '../server/services/CacheService.js';
import { weatherService } from '../server/services/WeatherService.js';
import { marketPriceService } from '../server/services/MarketPriceService.js';
import { barcodeService } from '../server/services/BarcodeService.js';
import { holidayService } from '../server/services/HolidayService.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('LOCALPULSE AI — STAGE 2.1 SHARED SERVICES TEST SUITE');
  console.log('====================================================\n');

  // 1. CONFIG & CREDENTIAL MASKING TESTS
  console.log('Suite 1: Secure Configuration & Secret Masking');
  const sanitized = getSanitizedConfig();
  assert(typeof sanitized.hasGeminiKey === 'boolean', 'hasGeminiKey is a boolean');
  assert(typeof sanitized.hasDataGovKey === 'boolean', 'hasDataGovKey is a boolean');
  assert(!('geminiApiKey' in sanitized), 'Raw geminiApiKey is NOT present in sanitized config');
  assert(!('dataGovApiKey' in sanitized), 'Raw dataGovApiKey is NOT present in sanitized config');
  assert(sanitized.userAgent.includes('LocalPulseAI-Retail'), 'User-Agent header is properly formatted with repo link');

  // 2. CACHE SERVICE TESTS
  console.log('\nSuite 2: TTL Cache Engine');
  cacheService.clear();
  cacheService.set('test_key', { sample: 123 }, 2); // 2s TTL
  const hit = cacheService.get('test_key');
  assert(hit !== null && hit.data.sample === 123, 'Cache stores and retrieves data successfully');
  assert(cacheService.has('test_key') === true, 'cacheService.has returns true for active key');

  cacheService.delete('test_key');
  assert(cacheService.get('test_key') === null, 'cacheService.delete removes key immediately');

  // 3. WEATHER SERVICE TESTS
  console.log('\nSuite 3: Weather Service Normalization & Operational Advisories');
  const mockOpenMeteoPayload = {
    timezone: 'Asia/Kolkata',
    current: {
      time: '2026-03-01T10:00',
      temperature_2m: 35.5,
      relative_humidity_2m: 82,
      precipitation: 6.2,
      weather_code: 61,
      is_day: 1,
    },
    daily: {
      time: ['2026-03-01', '2026-03-02', '2026-03-03'],
      temperature_2m_max: [36.0, 35.0, 34.0],
      temperature_2m_min: [26.0, 25.5, 25.0],
      precipitation_sum: [6.2, 2.0, 0.0],
    },
  };

  const normalizedWeather = weatherService.normalizeWeather(mockOpenMeteoPayload, 17.6868, 83.2185);
  assert(normalizedWeather.provider === 'Open-Meteo', 'Provider identified as Open-Meteo');
  assert(normalizedWeather.current.temperatureC === 35.5, 'Temperature parsed as 35.5°C');
  assert(normalizedWeather.current.relativeHumidityPercent === 82, 'Relative humidity parsed as 82%');
  assert(normalizedWeather.current.precipitationMm === 6.2, 'Precipitation parsed as 6.2mm');

  // Test advisory derivation
  const advisories = normalizedWeather.advisories;
  assert(advisories.some(a => a.type === 'extreme_heat'), 'Extreme heat advisory generated (temp >= 35°C)');
  assert(advisories.some(a => a.type === 'high_humidity'), 'High humidity advisory generated (humidity >= 80%)');
  assert(advisories.some(a => a.type === 'heavy_rain'), 'Heavy rain operational advisory generated (rain >= 5mm)');
  assert(advisories[0].textTe.length > 0, 'Advisories include localized Telugu text');

  // 4. MANDI PRICE SERVICE TESTS
  console.log('\nSuite 4: Mandi Price Service, Unit Conversion & Missing Key Handling');
  assert(marketPriceService.convertQuintalToKg(2400) === 24.0, '2400 ₹/quintal correctly converts to ₹24.00/kg');
  assert(marketPriceService.convertQuintalToKg(3000) === 30.0, '3000 ₹/quintal correctly converts to ₹30.00/kg');
  assert(marketPriceService.convertQuintalToKg(0) === 0, 'Zero quintal price safely returns 0');

  // Test missing key behavior
  const mandiRes = await marketPriceService.getMandiPrices('Visakhapatnam');
  assert(mandiRes.success === true, 'Mandi service returns successful response structure');
  if (!config.dataGovApiKey) {
    assert(mandiRes.status === 'BLOCKED', 'Returns status BLOCKED when DATA_GOV_IN_API_KEY is not configured');
    assert(mandiRes.isDemoOnly === true, 'Flags records explicitly as isDemoOnly: true (DEMO_ONLY)');
    assert(mandiRes.data.length >= 6, `Returns synthetic Poorna Market demo benchmark records (Count: ${mandiRes.data.length})`);
    const tomato = mandiRes.data.find(d => d.commodity === 'Tomato');
    assert(Boolean(tomato && tomato.modalPricePerKg === 24.0), 'Poorna Market Tomato benchmark is ₹24.0/kg');
    assert(tomato.rawUnit === '₹/quintal' && tomato.normalizedUnit === '₹/kg', 'Retains original and normalized unit metadata');
  }

  // 5. BARCODE PRODUCT LOOKUP TESTS
  console.log('\nSuite 5: Open Food Facts Barcode Normalization & Safeguards');
  const invalidBarcodeRes = await barcodeService.lookupBarcode('123');
  assert(invalidBarcodeRes.success === false && invalidBarcodeRes.status === 'INVALID_BARCODE', 'Rejects short/invalid barcodes (< 8 digits)');

  const mockOFFProduct = {
    code: '8901030383701',
    product_name: 'Tata Tea Gold',
    brands: 'Tata Tea',
    categories: 'Beverages, Teas, Black tea',
    quantity: '500g',
    image_url: 'https://images.openfoodfacts.org/images/tata_tea.jpg',
    ingredients_text: 'Tea leaves',
  };

  const normalizedProduct = barcodeService.normalizeProduct(mockOFFProduct, '8901030383701');
  assert(normalizedProduct.productName === 'Tata Tea Gold', 'Product name extracted');
  assert(normalizedProduct.brand === 'Tata Tea', 'Brand extracted');
  assert(normalizedProduct.category === 'Beverages', 'Category accurately mapped to Beverages');
  assert(normalizedProduct.packSize === '500g', 'Pack size preserved');
  assert(Boolean(normalizedProduct.disclaimer), 'Includes explicit disclaimer that barcode does not overwrite store inventory/cost');

  // 6. OFFICIAL 2026 HOLIDAY CALENDAR TESTS
  console.log('\nSuite 6: Official Indian Central & Andhra Pradesh Holiday Calendar (2026)');
  const holidaysRes = holidayService.getHolidays(2026, 'AP');
  assert(holidaysRes.success === true && holidaysRes.status === 'LOCAL_VERIFIED', 'Holiday service returns status LOCAL_VERIFIED for statutory 2026 calendar');
  assert(holidaysRes.year === 2026, 'Year verified as 2026');
  assert(holidaysRes.totalHolidays >= 12, `Contains verified official holidays (Total: ${holidaysRes.totalHolidays})`);

  // Check specific Andhra Pradesh festivals
  const sankranti = holidaysRes.data.find(h => h.date === '2026-01-14');
  assert(Boolean(sankranti), 'Makara Sankranti / Pongal verified for 2026-01-14');
  assert(sankranti.nameTe === 'మకర సంక్రాంతి / పొంగల్', 'Makara Sankranti includes official Telugu name');
  assert(sankranti.sourceUrl.includes('gad.ap.gov.in'), 'Cites official AP GAD authority URL');

  const ugadi = holidaysRes.data.find(h => h.date === '2026-03-19');
  assert(Boolean(ugadi), 'Ugadi (Telugu New Year) verified for 2026-03-19');

  // Test unverified year rejection
  const invalidYearRes = holidayService.getHolidays(2099);
  assert(invalidYearRes.success === false && invalidYearRes.status === 'UNAVAILABLE', 'Rejects unverified years with status UNAVAILABLE');

  console.log('\n====================================================');
  console.log(`STAGE 2.1 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
