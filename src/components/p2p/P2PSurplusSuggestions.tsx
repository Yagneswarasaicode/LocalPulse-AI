import React, { useState } from 'react';
import { SurplusSuggestion, Language } from '../../types';
import { marketplaceService } from '../../services/MarketplaceService';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  DollarSign, 
  Tag 
} from 'lucide-react';

interface P2PSurplusSuggestionsProps {
  currentBusinessId: string;
  currentBusinessType: any;
  currentBusinessName: string;
  onNavigateTab: (tab: string) => void;
  language: Language;
}

export const P2PSurplusSuggestions: React.FC<P2PSurplusSuggestionsProps> = ({
  currentBusinessId,
  currentBusinessType,
  currentBusinessName,
  onNavigateTab,
  language,
}) => {
  const [selectedSourceType, setSelectedSourceType] = useState<'vendor' | 'supermarket'>(currentBusinessType === 'supermarket' ? 'supermarket' : 'vendor');
  const [publishedMsg, setPublishedMsg] = useState('');

  const suggestions = marketplaceService.detectSurplusSuggestions(
    selectedSourceType === 'vendor' ? 'biz-vendor-1' : 'biz-supermarket-1',
    selectedSourceType
  );

  const handle1ClickList = (s: SurplusSuggestion) => {
    const res = marketplaceService.createListing({
      sellerBusinessId: s.sourceBusinessId,
      sellerBusinessName: s.sourceBusinessType === 'vendor' ? 'Rythu Bazaar Stall #42 (K. Apparao)' : 'Poorna Fresh Supermarket (MVP Colony)',
      sellerType: s.sourceBusinessType,
      productId: s.productId,
      productName: s.productName,
      category: s.category,
      initialQuantity: s.suggestedSurplusQty,
      availableQuantity: s.suggestedSurplusQty,
      unit: s.unit,
      originalCost: s.originalCostPerUnit,
      askingPricePerUnit: s.suggestedMinPrice,
      condition: s.urgency === 'HIGH' ? 'ripe_immediate_use' : 'fresh_grade_a',
      expiryDate: s.expiryDate,
      pickupLocality: s.sourceBusinessType === 'vendor' ? 'MVP Rythu Bazaar Shed #4' : 'Poorna Fresh Supermarket Sector 4 Dock',
      pickupTiming: 'Today 2:00 PM - 6:00 PM',
      notes: `AI-detected surplus: ${s.rationale}`,
    });

    if (res.success) {
      setPublishedMsg(`Published ${s.suggestedSurplusQty} ${s.unit} of ${s.productName} on P2P Market! Check "My Listings".`);
      setTimeout(() => setPublishedMsg(''), 3500);
    }
  };

  const totalRecoveryPotential = suggestions.reduce((sum, s) => sum + s.estimatedGrossRecovery, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              AI Surplus Detection Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            AI-Assisted Surplus Liquidation Opportunities
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Cross-workspace detection of slow-moving produce or near-expiry batches to liquidate before rot.
          </p>
        </div>

        {/* Business Selector Toggle */}
        <div className="flex items-center bg-navy-100 p-1 rounded-xl">
          <button
            onClick={() => setSelectedSourceType('vendor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSourceType === 'vendor' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600'
            }`}
          >
            Vendor Inventory (Rythu Bazaar)
          </button>
          <button
            onClick={() => setSelectedSourceType('supermarket')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSourceType === 'supermarket' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600'
            }`}
          >
            Supermarket Inventory
          </button>
        </div>
      </div>

      {publishedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{publishedMsg}</span>
        </div>
      )}

      {/* Recovery Potential Card */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-elevated border border-navy-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Estimated Gross Recovery Capital</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-300">
            ₹{totalRecoveryPotential.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-navy-300 mt-1">
            Across {suggestions.length} identified surplus lots in {selectedSourceType === 'vendor' ? 'Vendor cart' : 'Supermarket inventory'}.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-navy-400 block mb-1">Rule of Safe Selling</span>
          <span className="text-xs bg-navy-800 text-emerald-300 px-3 py-1 rounded-lg border border-navy-700 font-medium">
            Never auto-published • Seller review required
          </span>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <div className="bg-surface-card rounded-2xl p-12 border border-surface-border text-center space-y-2">
            <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-base text-navy-900">Zero Critical Surplus Detected</h3>
            <p className="text-xs text-navy-500 max-w-md mx-auto">
              Current inventory turnover is well-balanced within 1.5–2.0 days of consumer demand.
            </p>
          </div>
        ) : (
          suggestions.map((s) => (
            <div
              key={s.id}
              className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-400 transition-all"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-navy-900">{s.productName}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                    s.urgency === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {s.urgency === 'HIGH' ? 'URGENT LIQUIDATION' : 'SURPLUS LOT'}
                  </span>
                </div>

                <p className="text-xs text-navy-600 leading-relaxed">
                  {language === 'te' && s.rationaleTe ? s.rationaleTe : s.rationale}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-navy-500 pt-1">
                  <span>Physical: <strong>{s.physicalStock} {s.unit}</strong></span>
                  <span>•</span>
                  <span>Buffer: <strong>{s.daysOfBuffer} days</strong></span>
                  <span>•</span>
                  <span>Wholesale Cost: <strong>₹{s.originalCostPerUnit}</strong></span>
                </div>
              </div>

              {/* Action Box */}
              <div className="bg-navy-50 p-4 rounded-xl border border-navy-100 text-right shrink-0 space-y-2">
                <div>
                  <span className="text-[10px] text-navy-400 uppercase font-bold block">Recommended Asking Price</span>
                  <div className="text-xl font-extrabold text-emerald-700 font-mono">
                    ₹{s.suggestedMinPrice} - ₹{s.suggestedMaxPrice} <span className="text-xs text-navy-500 font-normal">/ {s.unit}</span>
                  </div>
                </div>

                <button
                  onClick={() => handle1ClickList(s)}
                  className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  Confirm & List {s.suggestedSurplusQty} {s.unit}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
