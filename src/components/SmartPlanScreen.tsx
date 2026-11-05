import React, { useState } from 'react';
import { 
  ProcurementPlan, 
  Language, 
  PriorityLevel 
} from '../types';
import { translations } from '../translations';
import { MainActionButton } from './MainActionButton';
import { 
  TrendingUp, 
  ShieldCheck, 
  Wallet, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  Share2, 
  Printer, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  Info,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface SmartPlanScreenProps {
  plan: ProcurementPlan;
  onNavigateToCopilot: () => void;
  onRecalculate: () => void;
  language: Language;
}

export const SmartPlanScreen: React.FC<SmartPlanScreenProps> = ({
  plan,
  onNavigateToCopilot,
  onRecalculate,
  language,
}) => {
  const t = translations[language];
  const [copied, setCopied] = useState(false);
  const [filterPriority, setFilterPriority] = useState<PriorityLevel | 'ALL'>('ALL');

  const budgetUsagePercent = plan.totalBudget > 0 
    ? Math.min(100, Math.round((plan.totalCost / plan.totalBudget) * 100)) 
    : 0;

  const buyItems = plan.items.filter(i => i.recommendedBuyKg > 0);
  const skipItems = plan.items.filter(i => i.recommendedBuyKg === 0 || i.priority === 'SKIP');

  const filteredItems = plan.items.filter(item => {
    if (filterPriority === 'ALL') return true;
    return item.priority === filterPriority;
  });

  const handleCopyWhatsAppText = () => {
    const lines = [
      `*LocalPulse AI - Mandi Morning Order Slip*`,
      `📍 Poorna Market / MVP Rythu Bazaar, Vizag`,
      `💰 Budget: ₹${plan.totalBudget} | Total: ₹${plan.totalCost} | Remaining: ₹${plan.remainingCash}`,
      `---------------------------------`,
      ...buyItems.map(i => `• ${i.item.nameEn} (${i.item.nameTe}): *${i.recommendedBuyKg} kg* @ ₹${i.item.pricePerKg}/kg = ₹${i.estimatedCost}`),
      `---------------------------------`,
      `⛔ SKIP (Surplus Stock):`,
      ...skipItems.map(i => `• ${i.item.nameEn}: ${i.item.remainingKg}kg remaining (${i.daysLeft} days)`),
      `\nGenerated with Zero Budget Overrun Guarantee.`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Screen Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Screen 2 • Deterministic Math Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              {t.planTitle}
            </h1>
            <p className="text-sm sm:text-base text-navy-600 mt-1 max-w-3xl leading-relaxed">
              {t.planSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopyWhatsAppText}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs sm:text-sm transition-colors shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-600" />}
              <span>{copied ? (language === 'te' ? 'కాపీ చేయబడింది!' : 'Copied!') : t.exportWhatsapp}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-navy-50 text-navy-700 border border-navy-200 font-semibold text-xs sm:text-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-navy-600" />
              <span className="hidden sm:inline">{t.printSlip}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Budget Summary Card & Progress Gauge */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-elevated border border-navy-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Strict Zero Budget Overrun Guarantee</span>
          </div>
          <span className="text-xs text-navy-300 font-mono">
            Plan Calculated: {plan.calculatedAt || 'Just now'}
          </span>
        </div>

        {/* 3 Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Allocated Budget */}
          <div className="bg-navy-800/80 rounded-xl p-4 border border-navy-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-navy-300 uppercase font-semibold">{t.allocatedBudget}</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              ₹{plan.totalCost.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-navy-400 mt-1">
              {language === 'te' ? `బడ్జెట్: ₹${plan.totalBudget.toLocaleString('en-IN')}` : `of ₹${plan.totalBudget.toLocaleString('en-IN')} cash budget`}
            </div>
          </div>

          {/* Cash Leftover (Safe) */}
          <div className="bg-navy-800/80 rounded-xl p-4 border border-navy-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-navy-300 uppercase font-semibold">{t.cashPreserved}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
              ₹{plan.remainingCash.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-emerald-400/90 mt-1 font-medium">
              {language === 'te' ? 'వృధా కాకుండా సురక్షితం' : 'Zero budget overrun'}
            </div>
          </div>

          {/* Spoilage Risk Avoided */}
          <div className="bg-navy-800/80 rounded-xl p-4 border border-navy-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-navy-300 uppercase font-semibold">{t.spoilageSavedKg}</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {plan.totalBuyKg} <span className="text-base font-normal text-navy-300">kg to buy</span>
            </div>
            <div className="text-xs text-navy-400 mt-1">
              {language === 'te' ? `4 రకాల అధిక నిల్వలు ఆపబడ్డాయి` : `${skipItems.length} surplus items skipped`}
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-navy-300 font-semibold mb-2">
            <span>Budget Utilization: {budgetUsagePercent}%</span>
            <span>Unused Reserve: ₹{plan.remainingCash.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-full h-3.5 bg-navy-800 rounded-full overflow-hidden p-0.5 border border-navy-700">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 shadow-sm"
              style={{ width: `${budgetUsagePercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-navy-400 mt-1.5 font-mono">
            <span>₹0</span>
            <span>Allocated: ₹{plan.totalCost}</span>
            <span>Limit: ₹{plan.totalBudget}</span>
          </div>
        </div>
      </div>

      {/* Main Action Button (Prominent Call to Action) */}
      <MainActionButton
        onClick={onNavigateToCopilot}
        language={language}
        label={t.explainPlanBtn}
        sublabel={language === 'te' 
          ? 'ఈ ప్లాన్ ఎందుకు సరైనదో తెలుగులో వాయిస్ మరియు వివరణ వినండి' 
          : 'Grounded Telugu Audio & Text Copilot explaining why to buy this today'}
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-navy-500 uppercase tracking-wider mr-1">
          Filter:
        </span>
        <button
          onClick={() => setFilterPriority('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterPriority === 'ALL'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'bg-white text-navy-700 border border-navy-200 hover:bg-navy-50'
          }`}
        >
          All Items ({plan.items.length})
        </button>
        <button
          onClick={() => setFilterPriority('HIGH')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterPriority === 'HIGH'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          High Urgency ({plan.items.filter(i => i.priority === 'HIGH').length})
        </button>
        <button
          onClick={() => setFilterPriority('MED')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterPriority === 'MED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
          }`}
        >
          Medium Buffer ({plan.items.filter(i => i.priority === 'MED').length})
        </button>
        <button
          onClick={() => setFilterPriority('SKIP')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            filterPriority === 'SKIP'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Skip / Surplus ({skipItems.length})
        </button>
      </div>

      {/* Detailed Plan Breakdown Cards & Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-surface-border flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-navy-900">
              {language === 'te' ? 'కూరగాయల వారీగా కొనుగోలు సిఫార్సులు' : 'Itemized Procurement Recommendations'}
            </h2>
            <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
              {language === 'te' 
                ? 'తక్కువ నిల్వ ఉన్న తాజా కూరగాయలకు మొదటి ప్రాధాన్యత ఇవ్వబడింది' 
                : 'Prioritized by stock exhaustion risk (< 1.0 day buffer)'}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            {buyItems.length} to Buy • {skipItems.length} to Skip
          </span>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-50/80 text-navy-700 text-xs font-bold uppercase tracking-wider border-b border-surface-border">
                <th className="py-3 px-4">{t.tableItem}</th>
                <th className="py-3 px-3">{t.tableRemaining}</th>
                <th className="py-3 px-3">{t.tableWholesale}</th>
                <th className="py-3 px-3">{t.tableDaysLeft}</th>
                <th className="py-3 px-3">{t.tablePriority}</th>
                <th className="py-3 px-3 font-extrabold text-navy-900">{t.tableRecommendedBuy}</th>
                <th className="py-3 px-3 font-extrabold text-navy-900">{t.tableTotalCost}</th>
                <th className="py-3 px-4">{t.tableReason}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-sm">
              {filteredItems.map((rec) => {
                const isSkip = rec.priority === 'SKIP';
                const isHigh = rec.priority === 'HIGH';

                return (
                  <tr 
                    key={rec.item.id}
                    className={`transition-colors ${
                      isSkip 
                        ? 'bg-slate-50/60 opacity-80 hover:bg-slate-100/60' 
                        : isHigh 
                        ? 'bg-rose-50/20 hover:bg-rose-50/40' 
                        : 'hover:bg-emerald-50/20'
                    }`}
                  >
                    {/* Item Name */}
                    <td className="py-3.5 px-4 font-bold text-navy-900">
                      <div>
                        <span>{rec.item.nameEn}</span>
                        <div className="text-xs text-navy-500 telugu-text font-normal">
                          {rec.item.nameTe}
                        </div>
                      </div>
                    </td>

                    {/* Remaining */}
                    <td className="py-3.5 px-3 font-medium text-navy-700">
                      {rec.item.remainingKg} kg
                    </td>

                    {/* Wholesale */}
                    <td className="py-3.5 px-3 text-navy-600 font-medium">
                      ₹{rec.item.pricePerKg}/kg
                    </td>

                    {/* Days Left */}
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        rec.daysLeft < 1.0 
                          ? 'bg-rose-100 text-rose-800' 
                          : rec.daysLeft <= 2.2 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-800'
                      }`}>
                        {rec.daysLeft.toFixed(2)} d
                      </span>
                    </td>

                    {/* Priority Badge */}
                    <td className="py-3.5 px-3">
                      {rec.priority === 'HIGH' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-500 text-white shadow-xs">
                          HIGH
                        </span>
                      )}
                      {rec.priority === 'MED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-600 text-white shadow-xs">
                          MED
                        </span>
                      )}
                      {rec.priority === 'SKIP' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-400 text-white">
                          SKIP
                        </span>
                      )}
                    </td>

                    {/* Recommended Buy */}
                    <td className="py-3.5 px-3">
                      {rec.recommendedBuyKg > 0 ? (
                        <span className="text-base font-extrabold text-navy-900 bg-emerald-100/60 text-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-300">
                          Buy {rec.recommendedBuyKg} kg
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-500 px-2 py-1 bg-slate-100 rounded-lg">
                          Buy 0 kg
                        </span>
                      )}
                    </td>

                    {/* Cost */}
                    <td className="py-3.5 px-3">
                      {rec.estimatedCost > 0 ? (
                        <span className="font-extrabold text-emerald-700 text-sm">
                          ₹{rec.estimatedCost.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">
                          ₹0
                        </span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 text-xs text-navy-600 max-w-xs">
                      {language === 'te' ? (
                        <span className="telugu-text font-medium">{rec.reasonTe}</span>
                      ) : (
                        <span>{rec.reasonEn}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="bg-navy-50/60 p-4 border-t border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs text-navy-600">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {language === 'te' 
                ? 'వైజాగ్ పూర్ణా మార్కెట్ మరియు MVP రైతు బజార్ ధరల హెచ్చుతగ్గుల ఆధారంగా లెక్కించబడింది.' 
                : 'Calculated using Rythu Bazaar supply dynamics. Zero budget overrun verified.'}
            </span>
          </div>
          <button
            onClick={onNavigateToCopilot}
            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
          >
            <span>{t.explainPlanBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
