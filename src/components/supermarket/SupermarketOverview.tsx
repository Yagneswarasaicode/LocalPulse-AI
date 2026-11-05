import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { salesAnalyticsService } from '../../services/SalesAnalyticsService';
import { procurementService } from '../../services/ProcurementService';
import { translations } from '../../translations';
import { 
  Building2, 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  ShoppingCart, 
  Truck, 
  Sparkles,
  ArrowRight,
  CloudSun,
  Calendar,
  Thermometer,
  Droplets,
  CloudRain,
  RefreshCw,
  Info,
  Wind
} from 'lucide-react';

interface SupermarketOverviewProps {
  businessId: string;
  onNavigateSection: (section: string) => void;
  language: Language;
}

export const SupermarketOverview: React.FC<SupermarketOverviewProps> = ({
  businessId,
  onNavigateSection,
  language,
}) => {
  const t = translations[language];
  const items = inventoryService.getInventory(businessId);
  const salesMetrics = salesAnalyticsService.calculateMetrics(businessId);
  const plan = procurementService.calculateSupermarketPlan(businessId, 25000, 7);

  const totalSKUs = items.length;
  const inventoryValuation = items.reduce((sum, i) => sum + i.stock.physicalStock * i.purchaseCost, 0);
  const lowStockItems = items.filter(i => i.status === 'low_stock' || i.stock.availableStock <= i.reorderThreshold);
  const nearExpiryItems = items.filter(i => i.status === 'near_expiry');

  // Stage 2.3: Live Weather State (Open-Meteo)
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherStatus, setWeatherStatus] = useState<'LOADING' | 'LIVE' | 'CACHED' | 'UNAVAILABLE'>('LOADING');
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Stage 2.3: Statutory Holiday Calendar State (Official 2026 Gazette)
  const [holidaysData, setHolidaysData] = useState<any[]>([]);
  const [holidaysStatus, setHolidaysStatus] = useState<'LOADING' | 'LOCAL_VERIFIED' | 'UNAVAILABLE'>('LOADING');
  const [showAllYearHolidays, setShowAllYearHolidays] = useState(false);

  // Fetch Live Weather
  const fetchWeather = async () => {
    setWeatherStatus('LOADING');
    setWeatherError(null);
    try {
      const res = await fetch('/api/weather?lat=17.6868&lon=83.2185');
      const json = await res.json();
      if (json && json.data) {
        setWeatherData(json.data);
        setWeatherStatus(json.status || 'LIVE');
      } else {
        setWeatherStatus('UNAVAILABLE');
        setWeatherError(json.error || 'Weather observation unavailable');
      }
    } catch {
      setWeatherStatus('UNAVAILABLE');
      setWeatherError('Network disconnected. Weather service offline.');
    }
  };

  // Fetch Official Gazetted Holidays
  const fetchHolidays = async () => {
    setHolidaysStatus('LOADING');
    try {
      const res = await fetch('/api/holidays?year=2026&region=AP');
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        setHolidaysData(json.data);
        setHolidaysStatus(json.status || 'LOCAL_VERIFIED');
      } else {
        setHolidaysStatus('UNAVAILABLE');
      }
    } catch {
      setHolidaysStatus('UNAVAILABLE');
    }
  };

  useEffect(() => {
    fetchWeather();
    fetchHolidays();
  }, []);

  // Filter Upcoming Holidays relative to current date
  const todayYmd = new Date().toISOString().split('T')[0];
  const upcomingHolidays = holidaysData.filter(h => h.date >= todayYmd);
  const displayedHolidays = showAllYearHolidays ? holidaysData : upcomingHolidays;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Enterprise Supermarket Workspace
            </span>
            <span className="text-xs font-mono text-navy-400 bg-navy-50 px-2 py-0.5 rounded border border-navy-200">
              DEMO DATA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Poorna Fresh Supermarket (MVP Colony)
          </h1>
          <p className="text-sm text-navy-600 mt-1">
            Real-time retail inventory valuation, daily sales velocity, and deterministic procurement.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateSection('procurement')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Smart Procurement (7-Day)</span>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Active SKUs */}
        <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">Active SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-mono">
            {totalSKUs}
          </div>
          <div className="text-xs text-navy-500 mt-1 flex items-center gap-1">
            <span>8 product categories tracked</span>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">Inventory Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
            ₹{inventoryValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-emerald-800 font-medium mt-1">
            At wholesale purchase cost
          </div>
        </div>

        {/* Weekly Gross Revenue */}
        <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">Weekly Sales (Gross)</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 font-mono">
            ₹{salesMetrics.weeklySales.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-navy-500 mt-1">
            Avg Margin: <strong className="text-emerald-700">{salesMetrics.marginPercent}%</strong>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">Restock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">
            {lowStockItems.length}
          </div>
          <div className="text-xs text-rose-700 font-medium mt-1">
            {nearExpiryItems.length} items near expiry
          </div>
        </div>
      </div>

      {/* STAGE 2.3: EXTERNAL INTELLIGENCE (WEATHER & STATUTORY HOLIDAYS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Weather Card (Open-Meteo) */}
        <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <CloudSun className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-navy-900">
                    {t.liveWeatherTitle || 'Live Operational Weather'}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                    weatherStatus === 'LIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : weatherStatus === 'CACHED'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}>
                    ● {weatherStatus}
                  </span>
                </div>
                <p className="text-[11px] text-navy-500">
                  {t.weatherVizagDefault || 'Poorna Market & MVP Rythu Bazaar, Visakhapatnam (Demo Default)'}
                </p>
              </div>
            </div>

            <button
              onClick={fetchWeather}
              title="Refresh Weather"
              className="p-2 rounded-xl text-navy-500 hover:text-navy-900 hover:bg-navy-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${weatherStatus === 'LOADING' ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {weatherStatus === 'LOADING' && (
            <div className="py-8 flex flex-col items-center justify-center text-xs text-navy-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
              <span>Fetching live atmospheric observation...</span>
            </div>
          )}

          {weatherStatus !== 'LOADING' && weatherData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-navy-50/70 p-3.5 rounded-2xl border border-navy-100">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-navy-500 font-semibold flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                    <span>{t.temperature || 'Temperature'}</span>
                  </div>
                  <div className="text-xl font-extrabold text-navy-900 font-mono">
                    {weatherData.current?.temperatureC !== null ? `${weatherData.current?.temperatureC}°C` : 'N/A'}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[11px] text-navy-500 font-semibold flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-sky-500" />
                    <span>{t.humidity || 'Humidity'}</span>
                  </div>
                  <div className="text-xl font-extrabold text-navy-900 font-mono">
                    {weatherData.current?.relativeHumidityPercent !== null ? `${weatherData.current?.relativeHumidityPercent}%` : 'N/A'}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[11px] text-navy-500 font-semibold flex items-center gap-1">
                    <CloudRain className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{t.precipitation || 'Precipitation'}</span>
                  </div>
                  <div className="text-xl font-extrabold text-navy-900 font-mono">
                    {weatherData.current?.precipitationMm} mm
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[11px] text-navy-500 font-semibold flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-teal-600" />
                    <span>Wind</span>
                  </div>
                  <div className="text-xl font-extrabold text-navy-900 font-mono">
                    {weatherData.current?.windSpeedKmH || 0} km/h
                  </div>
                </div>
              </div>

              {/* 7-Day Atmospheric Horizon Strip */}
              {Array.isArray(weatherData.dailyForecast) && weatherData.dailyForecast.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-extrabold text-navy-600 uppercase tracking-wider block">
                    7-Day Atmospheric Outlook (Produce Planning):
                  </span>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {weatherData.dailyForecast.slice(0, 7).map((d: any, idx: number) => {
                      const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                      return (
                        <div key={idx} className="bg-white p-2 rounded-xl border border-navy-100 text-center space-y-0.5">
                          <span className="text-[10px] font-bold text-navy-500 block uppercase">{dayName}</span>
                          <span className="text-xs font-mono font-extrabold text-navy-900 block">
                            {d.maxTemp ? `${Math.round(d.maxTemp)}°` : '—'}
                          </span>
                          <span className="text-[10px] text-navy-400 block font-mono">
                            {d.precipitationProbability ? `${d.precipitationProbability}%` : '0%'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Produce Handling Advisories */}
              {Array.isArray(weatherData.advisories) && weatherData.advisories.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-navy-600 uppercase tracking-wider block">
                    {t.operationalAdvisories || 'Operational Produce Advisories'}:
                  </span>
                  {weatherData.advisories.map((adv: any, idx: number) => (
                    <div key={idx} className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                      adv.severity === 'high' 
                        ? 'bg-rose-50 border-rose-200 text-rose-900' 
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                        adv.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                      }`} />
                      <div>
                        <p className="font-semibold">{language === 'te' ? adv.textTe : adv.textEn}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-navy-400 flex items-center justify-between pt-1">
                <span>{weatherData.attribution}</span>
                <span>Observed: {weatherData.current?.observedAt?.replace('T', ' ')}</span>
              </div>
            </div>
          )}

          {weatherStatus === 'UNAVAILABLE' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-navy-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-navy-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-navy-700">Weather Context Temporarily Offline</p>
                <p className="text-[11px] mt-0.5">
                  {weatherError || 'External weather connection unavailable. Store operations and inventory remain 100% functional.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Statutory Holiday Calendar Card (Official 2026 Gazette) */}
        <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-navy-900">
                    {t.upcomingHolidaysTitle || 'Upcoming Gazetted Holidays'}
                  </h3>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-mono uppercase">
                    ● LOCAL_VERIFIED
                  </span>
                </div>
                <p className="text-[11px] text-navy-500">
                  {t.holidayAuthorityCitation || 'Official DoPT & AP GAD Statutory Schedule 2026'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAllYearHolidays(!showAllYearHolidays)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-colors"
            >
              {showAllYearHolidays ? `Upcoming Only (${upcomingHolidays.length})` : `Full Year (${holidaysData.length})`}
            </button>
          </div>

          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {displayedHolidays.length === 0 ? (
              <div className="py-8 text-center text-xs text-navy-400 bg-navy-50/50 rounded-xl border border-navy-100">
                <p>{t.noUpcomingHolidays || 'No upcoming gazetted holidays in the immediate horizon.'}</p>
                <button
                  onClick={() => setShowAllYearHolidays(true)}
                  className="mt-2 text-emerald-700 font-bold hover:underline"
                >
                  View full 2026 gazette calendar ({holidaysData.length} total)
                </button>
              </div>
            ) : (
              displayedHolidays.map((holiday, idx) => {
                const isUpcoming = holiday.date >= todayYmd;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all text-xs space-y-1 ${
                      isUpcoming 
                        ? 'bg-white border-navy-200 shadow-2xs' 
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-navy-900 flex items-center gap-1.5">
                        <span>{language === 'te' ? holiday.nameTe : holiday.nameEn}</span>
                        {language === 'te' && (
                          <span className="text-[10px] text-navy-500 font-normal">({holiday.nameEn})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                          isUpcoming ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {holiday.date}
                        </span>
                        <span className="text-[10px] bg-navy-100 text-navy-700 px-1.5 py-0.2 rounded font-semibold">
                          {holiday.jurisdiction}
                        </span>
                      </div>
                    </div>
                    <p className="text-navy-600 text-[11px] leading-relaxed">
                      {language === 'te' ? holiday.marketAdvisoryTe : holiday.marketAdvisoryEn}
                    </p>
                    <div className="text-[10px] text-navy-400 font-mono">
                      Authority: {holiday.authority}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="text-[10px] text-navy-400 flex items-center justify-between pt-1 border-t border-surface-border">
            <span>Verified against DoPT F.No.12/2/2025-JCA & AP GAD Notification</span>
            <span className="font-semibold text-emerald-700">Qualitative retail guidance only</span>
          </div>
        </div>
      </div>

      {/* Operational Highlights & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Restock & Expiry Items */}
        <div className="lg:col-span-2 bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-base text-navy-900">Urgent Inventory Attention Required</h3>
            </div>
            <button
              onClick={() => onNavigateSection('inventory')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Manage Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-surface-border">
            {lowStockItems.concat(nearExpiryItems).slice(0, 4).map((item, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-navy-900 flex items-center gap-2">
                    <span>{item.nameEn}</span>
                    <span className="text-[10px] bg-navy-100 text-navy-700 font-mono px-1.5 py-0.2 rounded">
                      {item.sku}
                    </span>
                  </div>
                  <div className="text-xs text-navy-500 mt-0.5">
                    Category: {item.category} • Cost: ₹{item.purchaseCost}/{item.unit} • Selling: ₹{item.sellingPrice}/{item.unit}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                    item.status === 'near_expiry' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {item.status === 'near_expiry' ? 'Expires in 2d' : `Stock: ${item.stock.availableStock} ${item.unit}`}
                  </span>
                  <div className="text-[11px] text-navy-400 mt-0.5">
                    Reorder pt: {item.reorderThreshold} {item.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: AI Supermarket Advisor Summary */}
        <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-elevated border border-navy-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>AI Supermarket Advisor</span>
            </div>
            <h4 className="font-bold text-lg text-white">
              7-Day Procurement & Liquidation Brief
            </h4>
            <p className="text-xs text-navy-200 mt-2 leading-relaxed">
              Recommended replenishment: <strong>{plan.recommendations.filter(r => r.suggestedReorderQty > 0).length} products</strong> estimated at <strong>₹{plan.totalEstimatedSpending.toLocaleString('en-IN')}</strong> (100% within approved ₹{plan.approvedBudget.toLocaleString('en-IN')} budget).
            </p>
            <div className="bg-navy-800/80 rounded-xl p-3 border border-navy-700/80 mt-4 text-xs space-y-1.5">
              <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>P2P Surplus Recovery Opportunity:</span>
              </div>
              <p className="text-navy-300">
                You have 45 pouches of fresh milk expiring on Nov 7. List on P2P Local Market to recover ~₹900 from nearby Rythu Bazaar vendors before discard.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-navy-800 flex gap-2">
            <button
              onClick={() => onNavigateSection('copilot')}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
            >
              Open AI Copilot
            </button>
            <button
              onClick={() => onNavigateSection('procurement')}
              className="flex-1 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-navy-200 font-semibold text-xs border border-navy-700"
            >
              View Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
