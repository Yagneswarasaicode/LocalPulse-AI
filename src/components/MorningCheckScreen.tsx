import React, { useState } from 'react';
import { 
  VegetableItem, 
  Language, 
  ActiveScreen,
  LiveWeatherReport,
  LiveMandiRecord
} from '../types';
import { translations } from '../translations';
import { MainActionButton } from './MainActionButton';
import { VendorMarketIntelligence } from './vendor/VendorMarketIntelligence';
import { 
  IndianRupee, 
  Mic, 
  Camera, 
  Plus, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Check, 
  Scale, 
  Tag, 
  TrendingDown,
  ShoppingBag
} from 'lucide-react';

interface MorningCheckScreenProps {
  items: VegetableItem[];
  budget: number;
  onBudgetChange: (budget: number) => void;
  onUpdateItem: (id: string, field: keyof VegetableItem, value: number | string) => void;
  onAddItem: (item: Omit<VegetableItem, 'id'>) => void;
  onDeleteItem: (id: string) => void;
  onResetToSample: () => void;
  onClearData: () => void;
  onOpenVoiceModal: () => void;
  onOpenPhotoModal: () => void;
  onGeneratePlan: () => void;
  language: Language;
  onWeatherUpdate?: (weather: LiveWeatherReport | null) => void;
  onMandiUpdate?: (mandi: LiveMandiRecord[]) => void;
}

export const MorningCheckScreen: React.FC<MorningCheckScreenProps> = ({
  items,
  budget,
  onBudgetChange,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  onResetToSample,
  onClearData,
  onOpenVoiceModal,
  onOpenPhotoModal,
  onGeneratePlan,
  language,
  onWeatherUpdate,
  onMandiUpdate,
}) => {
  const t = translations[language];

  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    nameEn: '',
    nameTe: '',
    remainingKg: 5,
    pricePerKg: 30,
    dailySalesKg: 5,
    shelfLifeDays: 3,
  });

  const [budgetInputError, setBudgetInputError] = useState('');

  const cashPresets = [1000, 1500, 2000, 2500, 3000, 5000];

  const handleBudgetChange = (valStr: string) => {
    const val = Number(valStr);
    if (isNaN(val) || val < 0) {
      setBudgetInputError(language === 'te' ? 'సరైన బడ్జెట్ నమోదు చేయండి' : 'Enter a valid positive cash budget');
    } else {
      setBudgetInputError('');
      onBudgetChange(val);
    }
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.nameEn.trim()) return;
    onAddItem({
      nameEn: newItem.nameEn.trim(),
      nameTe: newItem.nameTe.trim() || newItem.nameEn.trim(),
      remainingKg: Number(newItem.remainingKg) || 0,
      pricePerKg: Number(newItem.pricePerKg) || 10,
      dailySalesKg: Number(newItem.dailySalesKg) || 1,
      shelfLifeDays: Number(newItem.shelfLifeDays) || 3,
      isSample: false,
    });
    setNewItem({
      nameEn: '',
      nameTe: '',
      remainingKg: 5,
      pricePerKg: 30,
      dailySalesKg: 5,
      shelfLifeDays: 3,
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Screen Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Screen 1 • Mandi Morning Intake
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              {t.morningCheckTitle}
            </h1>
            <p className="text-sm sm:text-base text-navy-600 mt-1 max-w-3xl leading-relaxed">
              {t.morningCheckSubtitle}
            </p>
          </div>

          {/* Quick Voice & Photo Logging Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-sm shadow-md shadow-navy-900/10 transition-all group"
            >
              <Mic className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>{t.voiceLogBtn}</span>
            </button>
            <button
              onClick={onOpenPhotoModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-navy-800 border border-navy-200 hover:border-emerald-400 font-semibold text-sm shadow-xs transition-all group"
            >
              <Camera className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>{t.photoScanBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Atmospheric Weather & Mandi Intelligence Widget */}
      <VendorMarketIntelligence
        language={language}
        onWeatherUpdate={onWeatherUpdate}
        onMandiUpdate={onMandiUpdate}
      />

      {/* Cash Budget Input Box */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-elevated border border-navy-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>{t.zeroOverrunGuarantee}</span>
            </div>
            <label htmlFor="budget-input" className="block text-lg sm:text-xl font-bold text-white mb-1">
              {t.cashBudgetLabel}
            </label>
            <p className="text-xs sm:text-sm text-navy-300 mb-4">
              {t.cashBudgetHelp}
            </p>

            {/* Cash Input Field with Currency Prefix */}
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-emerald-400 font-bold text-2xl">
                ₹
              </div>
              <input
                id="budget-input"
                type="number"
                min="0"
                step="50"
                value={budget || ''}
                onChange={(e) => handleBudgetChange(e.target.value)}
                placeholder="2000"
                className="w-full pl-12 pr-4 py-3.5 bg-navy-800/90 border-2 border-navy-700 focus:border-emerald-400 rounded-xl text-white font-extrabold text-2xl tracking-wide placeholder-navy-500 shadow-inner transition-colors"
              />
            </div>
            {budgetInputError && (
              <p className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {budgetInputError}
              </p>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="lg:col-span-5 bg-navy-800/60 p-4 rounded-xl border border-navy-700/60">
            <span className="text-xs font-semibold text-navy-300 block mb-2.5">
              {t.presetCash}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {cashPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => onBudgetChange(preset)}
                  className={`py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                    budget === preset
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300'
                      : 'bg-navy-900/80 hover:bg-navy-700 text-navy-200 border border-navy-700'
                  }`}
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-navy-400 mt-2.5">
              {language === 'te' 
                ? 'వైజాగ్ పూర్ణా మార్కెట్ వీధి వ్యాపారుల సగటు ఉదయపు బడ్జెట్: ₹2,000' 
                : 'Avg morning Rythu Bazaar cart budget: ₹2,000'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Action Button (Prominent Call to Action) */}
      <MainActionButton
        onClick={onGeneratePlan}
        language={language}
        label={t.generatePlanBtn}
        sublabel={language === 'te' 
          ? `₹${budget.toLocaleString('en-IN')} నగదుకు సరిపడా ఉత్తమ కొనుగోలు ప్రణాళిక లెక్కించండి` 
          : `Calculate deterministic purchase weights for ₹${budget.toLocaleString('en-IN')} cash budget`}
      />

      {/* Inventory Table & Manager */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-4 sm:p-6 border-b border-surface-border flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-navy-900">
                {t.inventoryListTitle}
              </h2>
              <span className="bg-navy-100 text-navy-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {items.length} {language === 'te' ? 'రకాలు' : 'Items'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
              {language === 'te' 
                ? 'ప్రస్తుతం మీ బండి వద్ద మిగిలి ఉన్న నిల్వలు, సగటు అమ్మకం వేగం మరియు మండి కొనుగోలు ధర' 
                : 'Stock remaining from yesterday, sales rate, and wholesale purchase cost/kg'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs sm:text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNewProduce}</span>
            </button>
            <button
              onClick={onResetToSample}
              title="Reset to 10 Rythu Bazaar Sample Records"
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-700 border border-navy-200 font-medium text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.resetToSample}</span>
            </button>
          </div>
        </div>

        {/* Add New Produce Inline Form Modal/Dropdown */}
        {showAddForm && (
          <form onSubmit={handleCreateNewItem} className="p-5 bg-emerald-50/50 border-b border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>{language === 'te' ? 'కొత్త కూరగాయ వివరాలు నమోదు చేయండి' : 'Add New Vegetable Stock'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-navy-500 hover:text-navy-800 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">
                  Name (English)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ridge Gourd"
                  value={newItem.nameEn}
                  onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">
                  Name (Telugu / తెలుగు)
                </label>
                <input
                  type="text"
                  placeholder="ఉదా: బీరకాయ"
                  value={newItem.nameTe}
                  onChange={(e) => setNewItem({ ...newItem, nameTe: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm focus:border-emerald-500 telugu-text"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">
                  Remaining (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newItem.remainingKg}
                  onChange={(e) => setNewItem({ ...newItem, remainingKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">
                  Wholesale (₹/kg)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={newItem.pricePerKg}
                  onChange={(e) => setNewItem({ ...newItem, pricePerKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">
                  Sales Rate (kg/day)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={newItem.dailySalesKg}
                  onChange={(e) => setNewItem({ ...newItem, dailySalesKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 text-sm focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-navy-600 hover:bg-navy-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
              >
                Save Item
              </button>
            </div>
          </form>
        )}

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-navy-100 text-navy-400 mx-auto flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-navy-900">
              {language === 'te' ? 'కూరగాయల జాబితా ఖాళీగా ఉంది' : 'No vegetables in inventory log'}
            </h3>
            <p className="text-sm text-navy-500 max-w-md mx-auto">
              {language === 'te' 
                ? 'నమూనా సమాచారాన్ని లోడ్ చేయడానికి రీసెట్ బటన్ నొక్కండి లేదా మీ స్వంత కూరగాయలను జోడించండి.' 
                : 'Click "Reset to Sample Data" to load the official Rythu Bazaar sample produce records or add your own.'}
            </p>
            <button
              onClick={onResetToSample}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md"
            >
              {t.resetToSample}
            </button>
          </div>
        ) : (
          /* Responsive Table on Desktop, Cards on Mobile */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy-50/80 text-navy-700 text-xs font-bold uppercase tracking-wider border-b border-surface-border">
                    <th className="py-3 px-4">{t.tableItem}</th>
                    <th className="py-3 px-3">{t.remainingStock}</th>
                    <th className="py-3 px-3">{t.wholesalePrice}</th>
                    <th className="py-3 px-3">{t.dailySalesRate}</th>
                    <th className="py-3 px-3">{t.daysStockLeft}</th>
                    <th className="py-3 px-4 text-right">{t.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border text-sm">
                  {items.map((item) => {
                    const daysLeft = item.dailySalesKg > 0 
                      ? Math.round((item.remainingKg / item.dailySalesKg) * 100) / 100 
                      : 0;

                    const isHighUrgency = daysLeft <= 1.0;
                    const isOverstocked = daysLeft >= 2.3;

                    return (
                      <tr 
                        key={item.id}
                        className="hover:bg-navy-50/40 transition-colors group"
                      >
                        {/* Vegetable Name */}
                        <td className="py-3.5 px-4 font-semibold text-navy-900">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                <span>{item.nameEn}</span>
                                {item.isSample && (
                                  <span className="bg-navy-100 text-navy-700 text-[10px] font-semibold px-1.5 py-0.2 rounded border border-navy-200">
                                    Sample
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-navy-500 telugu-text font-normal">
                                {item.nameTe}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Remaining Stock Input */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.remainingKg}
                              onChange={(e) => onUpdateItem(item.id, 'remainingKg', Number(e.target.value))}
                              className="w-16 sm:w-20 px-2 py-1 text-sm font-bold border border-navy-200 rounded-md bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-navy-900 text-right"
                            />
                            <span className="text-xs text-navy-500 font-medium">kg</span>
                          </div>
                        </td>

                        {/* Wholesale Price Input */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-navy-500 font-semibold">₹</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.pricePerKg}
                              onChange={(e) => onUpdateItem(item.id, 'pricePerKg', Number(e.target.value))}
                              className="w-14 sm:w-16 px-2 py-1 text-sm font-semibold border border-navy-200 rounded-md bg-white focus:border-emerald-500 text-navy-900 text-right"
                            />
                            <span className="text-xs text-navy-400">/kg</span>
                          </div>
                        </td>

                        {/* Daily Sales Rate Input */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0.1"
                              step="0.5"
                              value={item.dailySalesKg}
                              onChange={(e) => onUpdateItem(item.id, 'dailySalesKg', Number(e.target.value))}
                              className="w-14 sm:w-16 px-2 py-1 text-sm font-semibold border border-navy-200 rounded-md bg-white focus:border-emerald-500 text-navy-900 text-right"
                            />
                            <span className="text-xs text-navy-400">kg/d</span>
                          </div>
                        </td>

                        {/* Days Stock Left */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              isHighUrgency 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                : isOverstocked 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {daysLeft.toFixed(2)} d
                            </span>
                            {isHighUrgency && (
                              <span className="text-[10px] text-rose-600 font-medium hidden sm:inline">
                                Low
                              </span>
                            )}
                            {isOverstocked && (
                              <span className="text-[10px] text-amber-700 font-medium hidden sm:inline">
                                Surplus
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            title="Remove item"
                            className="p-1.5 rounded-lg text-navy-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Summary Stats */}
            <div className="bg-navy-50/50 p-4 border-t border-surface-border flex flex-wrap items-center justify-between gap-4 text-xs text-navy-600 font-medium">
              <div className="flex items-center gap-4">
                <span>
                  <strong>Total Produce:</strong> {items.length} items
                </span>
                <span>
                  <strong>Total Stock:</strong> {items.reduce((s, i) => s + i.remainingKg, 0)} kg
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClearData}
                  className="text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearData}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
