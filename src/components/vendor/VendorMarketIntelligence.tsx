import React, { useState, useEffect } from 'react';
import { Language, LiveWeatherReport, LiveMandiRecord } from '../../types';
import { 
  CloudSun, 
  Droplets, 
  Thermometer, 
  Wind, 
  CloudRain, 
  RefreshCw, 
  AlertTriangle, 
  TrendingDown, 
  Store, 
  Search, 
  Filter, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface VendorMarketIntelligenceProps {
  language: Language;
  onWeatherUpdate?: (weather: LiveWeatherReport | null) => void;
  onMandiUpdate?: (mandi: LiveMandiRecord[]) => void;
}

export const VendorMarketIntelligence: React.FC<VendorMarketIntelligenceProps> = ({
  language,
  onWeatherUpdate,
  onMandiUpdate,
}) => {
  // Weather state
  const [weatherData, setWeatherData] = useState<LiveWeatherReport | null>(null);
  const [weatherStatus, setWeatherStatus] = useState<'LOADING' | 'LIVE' | 'CACHED' | 'UNAVAILABLE'>('LOADING');
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Mandi state
  const [mandiRecords, setMandiRecords] = useState<LiveMandiRecord[]>([]);
  const [mandiStatus, setMandiStatus] = useState<'LOADING' | 'LIVE' | 'CACHED' | 'DEMO' | 'BLOCKED' | 'UNAVAILABLE'>('LOADING');
  const [mandiDisclaimer, setMandiDisclaimer] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Visakhapatnam');
  const [searchCommodity, setSearchCommodity] = useState<string>('');
  const [isRefreshingWeather, setIsRefreshingWeather] = useState(false);
  const [isRefreshingMandi, setIsRefreshingMandi] = useState(false);

  // Fetch Weather
  const fetchWeather = async () => {
    setIsRefreshingWeather(true);
    setWeatherStatus('LOADING');
    setWeatherError(null);
    try {
      const res = await fetch('/api/weather?lat=17.6868&lon=83.2185');
      const json = await res.json();
      if (json && json.data) {
        setWeatherData(json.data);
        setWeatherStatus(json.status || 'LIVE');
        if (onWeatherUpdate) onWeatherUpdate(json.data);
      } else {
        setWeatherStatus('UNAVAILABLE');
        setWeatherError(json.error || 'Weather observation unavailable');
      }
    } catch (err: any) {
      setWeatherStatus('UNAVAILABLE');
      setWeatherError('Weather service unreachable');
    } finally {
      setIsRefreshingWeather(false);
    }
  };

  // Fetch Mandi Prices
  const fetchMandi = async (district: string = selectedDistrict, comm: string = searchCommodity) => {
    setIsRefreshingMandi(true);
    setMandiStatus('LOADING');
    try {
      let url = `/api/mandi?limit=50`;
      if (district && district !== 'ALL') {
        url += `&district=${encodeURIComponent(district)}`;
      }
      if (comm.trim()) {
        url += `&commodity=${encodeURIComponent(comm.trim())}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        setMandiRecords(json.data);
        setMandiStatus(json.status || (json.isDemoOnly ? 'DEMO' : 'LIVE'));
        if (json.disclaimer) {
          setMandiDisclaimer(json.disclaimer);
        }
        if (onMandiUpdate) onMandiUpdate(json.data);
      } else {
        setMandiStatus('UNAVAILABLE');
      }
    } catch {
      setMandiStatus('UNAVAILABLE');
    } finally {
      setIsRefreshingMandi(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    fetchMandi('Visakhapatnam', '');
  }, []);

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    fetchMandi(dist, searchCommodity);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMandi(selectedDistrict, searchCommodity);
  };

  // Filtered view
  const displayedRecords = mandiRecords.filter(r => {
    if (!searchCommodity.trim()) return true;
    const q = searchCommodity.toLowerCase();
    return r.commodity.toLowerCase().includes(q) || (r.commodityTe && r.commodityTe.toLowerCase().includes(q));
  });

  return (
    <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-navy-900 tracking-tight">
                {language === 'te' ? 'ప్రత్యక్ష వాతావరణం & మార్కెట్ ధరల విశ్లేషణ' : 'Live Atmospheric & Mandi Intelligence'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase font-mono bg-emerald-50 text-emerald-800 border border-emerald-300">
                Andhra Pradesh / Vizag
              </span>
            </div>
            <p className="text-xs text-navy-500">
              {language === 'te'
                ? 'ఓపెన్-మీటియో ఉపగ్రహ వాతావరణం మరియు ప్రభుత్వ అగ్‌మార్క్‌నెట్ ప్రత్యక్ష హోల్‌సేల్ రాక ధరలు'
                : 'Real-time Open-Meteo microclimate observations and official AGMARKNET daily arrivals'}
            </p>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Weather & Mandi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: LIVE WEATHER (5 cols) */}
        <div className="lg:col-span-5 bg-navy-50/70 rounded-2xl p-4 sm:p-5 border border-navy-200/80 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CloudSun className="w-5 h-5 text-amber-600" />
                <span className="font-extrabold text-sm text-navy-900">
                  {language === 'te' ? 'వాతావరణ స్థితి' : 'Atmospheric Conditions'}
                </span>
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
              <button
                onClick={fetchWeather}
                disabled={isRefreshingWeather}
                title="Refresh Weather"
                className="p-1.5 rounded-lg text-navy-600 hover:bg-navy-200/60 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingWeather ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="text-[11px] text-navy-500 font-medium mb-3">
              📍 Poorna Market & MVP Rythu Bazaar (Visakhapatnam)
            </div>

            {weatherStatus === 'LOADING' && (
              <div className="py-6 flex flex-col items-center justify-center text-xs text-navy-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                <span>{language === 'te' ? 'వాతావరణ పరిశీలన లోడ్ అవుతోంది...' : 'Fetching live atmospheric observation...'}</span>
              </div>
            )}

            {weatherStatus !== 'LOADING' && weatherData && (
              <div className="space-y-4">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5">
                  <div className="bg-white p-2.5 rounded-xl border border-navy-200/60 shadow-xs">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-navy-500">
                      <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                      <span>{language === 'te' ? 'ఉష్ణోగ్రత' : 'Temp'}</span>
                    </div>
                    <div className="text-xl font-extrabold text-navy-900 font-mono mt-0.5">
                      {weatherData.current?.temperatureC !== null ? `${weatherData.current?.temperatureC}°C` : 'N/A'}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-navy-200/60 shadow-xs">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-navy-500">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" />
                      <span>{language === 'te' ? 'తేమ' : 'Humidity'}</span>
                    </div>
                    <div className="text-xl font-extrabold text-navy-900 font-mono mt-0.5">
                      {weatherData.current?.relativeHumidityPercent !== null ? `${weatherData.current?.relativeHumidityPercent}%` : 'N/A'}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-navy-200/60 shadow-xs">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-navy-500">
                      <CloudRain className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{language === 'te' ? 'వర్షం' : 'Precipitation'}</span>
                    </div>
                    <div className="text-xl font-extrabold text-navy-900 font-mono mt-0.5">
                      {weatherData.current?.precipitationMm} mm
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-navy-200/60 shadow-xs">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-navy-500">
                      <Wind className="w-3.5 h-3.5 text-teal-600" />
                      <span>{language === 'te' ? 'గాలి వేగం' : 'Wind'}</span>
                    </div>
                    <div className="text-xl font-extrabold text-navy-900 font-mono mt-0.5">
                      {weatherData.current?.windSpeedKmH || 0} km/h
                    </div>
                  </div>
                </div>

                {/* Produce Advisories */}
                {Array.isArray(weatherData.advisories) && weatherData.advisories.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-extrabold text-navy-700 uppercase tracking-wider block">
                      {language === 'te' ? 'కూరగాయల భద్రతా సూచనలు' : 'Operational Produce Advisories'}:
                    </span>
                    {weatherData.advisories.map((adv, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                          adv.severity === 'high'
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                          adv.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                        }`} />
                        <div>
                          <p className="font-semibold leading-relaxed">
                            {language === 'te' ? adv.textTe : adv.textEn}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {weatherStatus === 'UNAVAILABLE' && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-navy-600 flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-navy-800">
                    {language === 'te' ? 'వాతావరణ సేవ తాత్కాలికంగా ఆఫ్‌లైన్‌లో ఉంది' : 'Weather observation temporarily offline'}
                  </p>
                  <p className="text-[11px] text-navy-500">{weatherError || 'Connecting to Open-Meteo satellite feed...'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-navy-400 border-t border-navy-200 pt-2 flex items-center justify-between">
            <span>Open-Meteo CC BY 4.0</span>
            {weatherData?.current?.observedAt && (
              <span>Observed: {weatherData.current.observedAt.replace('T', ' ')}</span>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: MANDI PRICE INTELLIGENCE (7 cols) */}
        <div className="lg:col-span-7 bg-surface-card rounded-2xl border border-surface-border flex flex-col justify-between space-y-3">
          <div>
            {/* Mandi Title & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-600" />
                <span className="font-extrabold text-sm text-navy-900">
                  {language === 'te' ? 'అగ్‌మార్క్‌నెట్ ప్రత్యక్ష మార్కెట్ ధరలు' : 'AGMARKNET Mandi Arrival Benchmarks'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono uppercase ${
                  mandiStatus === 'LIVE'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : mandiStatus === 'CACHED'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  ● {mandiStatus === 'BLOCKED' ? 'DEMO BENCHMARK' : mandiStatus}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchMandi(selectedDistrict, searchCommodity)}
                  disabled={isRefreshingMandi}
                  title="Refresh Mandi Prices"
                  className="p-1.5 rounded-lg text-navy-600 hover:bg-navy-100 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingMandi ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Filter Bar: District Selector & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-3">
              <div className="sm:col-span-5">
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full text-xs font-semibold bg-navy-50/70 border border-navy-200 rounded-xl px-2.5 py-2 text-navy-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Visakhapatnam">Visakhapatnam (విశాఖపట్నం)</option>
                  <option value="Guntur">Guntur (గుంటూరు)</option>
                  <option value="Krishna">Krishna (కృష్ణా)</option>
                  <option value="East Godavari">East Godavari (తూర్పు గోదావరి)</option>
                  <option value="Chittoor">Chittoor (చిత్తూరు)</option>
                  <option value="Kurnool">Kurnool (కర్నూలు)</option>
                  <option value="Anantapur">Anantapur (అనంతపురం)</option>
                  <option value="ALL">All Andhra Pradesh (ఆంధ్రప్రదేశ్ మొత్తం)</option>
                </select>
              </div>

              <form onSubmit={handleSearchSubmit} className="sm:col-span-7 flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-navy-400" />
                  <input
                    type="text"
                    value={searchCommodity}
                    onChange={(e) => setSearchCommodity(e.target.value)}
                    placeholder={language === 'te' ? 'కూరగాయ పేరు శోధించండి (ఉదా: Tomato)...' : 'Search commodity (e.g. Tomato)...'}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-navy-50/70 border border-navy-200 rounded-xl text-navy-800 placeholder-navy-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-navy-900 text-white rounded-xl text-xs font-bold hover:bg-navy-800 shrink-0"
                >
                  {language === 'te' ? 'వెతుకు' : 'Filter'}
                </button>
              </form>
            </div>

            {/* Mandi Table */}
            {mandiStatus === 'LOADING' ? (
              <div className="py-8 flex flex-col items-center justify-center text-xs text-navy-400 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                <span>{language === 'te' ? 'అగ్‌మార్క్‌నెట్ మార్కెట్ రికార్డులను పొందుతోంది...' : 'Fetching AGMARKNET mandi arrivals...'}</span>
              </div>
            ) : displayedRecords.length === 0 ? (
              <div className="py-6 text-center text-xs text-navy-500 bg-navy-50/50 rounded-xl border border-navy-200">
                {language === 'te'
                  ? 'ఈ ఫిల్టర్‌కు సరిపోలే రాక రికార్డులు కనుగొనబడలేదు.'
                  : `No daily arrivals found matching "${searchCommodity || selectedDistrict}".`}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-60 border border-navy-100 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-navy-50 text-navy-700 font-bold sticky top-0 uppercase text-[10px] border-b border-navy-200">
                    <tr>
                      <th className="py-2 px-3">{language === 'te' ? 'వస్తువు' : 'Commodity'}</th>
                      <th className="py-2 px-2">{language === 'te' ? 'మార్కెట్' : 'Market'}</th>
                      <th className="py-2 px-2 text-right">{language === 'te' ? 'మోడల్ రేటు' : 'Modal (₹/kg)'}</th>
                      <th className="py-2 px-2 text-right">{language === 'te' ? 'పరిధి (₹/kg)' : 'Range (₹/kg)'}</th>
                      <th className="py-2 px-2 text-right">{language === 'te' ? 'తేదీ' : 'Date'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {displayedRecords.slice(0, 8).map((rec, idx) => (
                      <tr key={idx} className="hover:bg-navy-50/50 transition-colors">
                        <td className="py-2 px-3 font-bold text-navy-900">
                          <span>{rec.commodity}</span>
                          {rec.commodityTe && (
                            <span className="block text-[10px] text-navy-500 font-normal">
                              {rec.commodityTe}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-[11px] text-navy-600 max-w-[120px] truncate" title={rec.market}>
                          {rec.market}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-extrabold text-emerald-700">
                          ₹{rec.modalPricePerKg.toFixed(1)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-[11px] text-navy-600">
                          ₹{rec.minPricePerKg.toFixed(0)} - ₹{rec.maxPricePerKg.toFixed(0)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-[10px] text-navy-400">
                          {rec.arrivalDate || 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Statutory Disclaimer */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-950">
                {language === 'te' ? 'శాసనబద్ధమైన బహిరంగ మార్కెట్ హెచ్చరిక:' : 'Statutory Wholesale Benchmark Disclaimer:'}
              </p>
              <p className="text-amber-800 leading-snug">
                {language === 'te'
                  ? 'అగ్‌మార్క్‌నెట్ ధరలు హోల్‌సేల్ మార్కెట్ రాక రేట్లు మరియు సూచిక బెంచ్‌మార్క్‌లు మాత్రమే. నాణ్యత, గ్రేడింగ్ మరియు స్థానిక వ్యాపారులతో చర్చల ఆధారంగా రిటైల్ కొనుగోలు ధరలు మారవచ్చు.'
                  : (mandiDisclaimer || 'AGMARKNET prices reflect wholesale arrivals and are indicative benchmarks. Actual local purchase prices may vary based on quality, grading, and supplier negotiation.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
