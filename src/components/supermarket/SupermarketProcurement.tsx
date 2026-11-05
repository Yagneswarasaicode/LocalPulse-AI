import React, { useState } from 'react';
import { SupermarketProcurementPlan, Language } from '../../types';
import { procurementService } from '../../services/ProcurementService';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Wallet, 
  Scale, 
  Truck, 
  FileText, 
  Check 
} from 'lucide-react';

interface SupermarketProcurementProps {
  businessId: string;
  language: Language;
}

export const SupermarketProcurement: React.FC<SupermarketProcurementProps> = ({
  businessId,
  language,
}) => {
  const [budget, setBudget] = useState(25000);
  const [horizonDays, setHorizonDays] = useState(7);
  const [copiedPO, setCopiedPO] = useState(false);

  const plan = procurementService.calculateSupermarketPlan(businessId, budget, horizonDays);
  const buyItems = plan.recommendations.filter(r => r.suggestedReorderQty > 0);

  const handleExportPO = () => {
    const lines = [
      `*PURCHASE ORDER DRAFT — POORNA FRESH SUPERMARKET*`,
      `Planning Horizon: ${plan.planningHorizonDays} Days | Approved Budget: ₹${plan.approvedBudget.toLocaleString('en-IN')}`,
      `Total Estimated Spend: ₹${plan.totalEstimatedSpending.toLocaleString('en-IN')} | Remaining Buffer: ₹${plan.remainingBudget.toLocaleString('en-IN')}`,
      `-----------------------------------------`,
      ...buyItems.map(i => `• ${i.product.nameEn} (${i.product.sku}): ${i.suggestedReorderQty} ${i.product.unit} @ ₹${i.unitCost}/${i.product.unit} = ₹${i.estimatedCost} [Supplier: ${i.chosenSupplierName || 'Consortium'}]`),
      `-----------------------------------------`,
      `Zero Budget Overrun Verified. Authorized by LocalPulse Procurement Engine.`
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedPO(true);
    setTimeout(() => setCopiedPO(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Deterministic Mathematical Advisor
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Supermarket Smart Procurement Advisor
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Pack-size rounded replenishment math with strict spending caps and verified supplier quotes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportPO}
            disabled={buyItems.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {copiedPO ? <Check className="w-4 h-4 text-emerald-200" /> : <FileText className="w-4 h-4" />}
            <span>{copiedPO ? 'PO Copied to Clipboard!' : 'Export Purchase Order (PO)'}</span>
          </button>
        </div>
      </div>

      {/* Budget & Parameter Controls */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-elevated border border-navy-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Budget Constraint Active</span>
            </div>
            <label className="text-lg font-bold text-white block mb-1">Approved Procurement Budget</label>
            <div className="relative max-w-sm">
              <span className="absolute left-3 top-2.5 text-xl font-bold text-emerald-400">₹</span>
              <input
                type="number"
                min="1000"
                step="1000"
                value={budget}
                onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                className="w-full pl-8 pr-4 py-2.5 bg-navy-800 border-2 border-navy-700 rounded-xl text-white font-extrabold text-xl font-mono focus:border-emerald-400"
              />
            </div>
            <p className="text-xs text-navy-300 mt-1">Algorithm strictly guarantees Total Spending ≤ ₹{budget.toLocaleString('en-IN')}</p>
          </div>

          <div className="md:col-span-6 flex flex-wrap gap-4 items-center justify-between bg-navy-800/60 p-4 rounded-xl border border-navy-700">
            <div>
              <span className="text-xs text-navy-400 uppercase font-bold block mb-1">Planning Horizon</span>
              <div className="flex gap-2">
                {[3, 7, 14].map(days => (
                  <button
                    key={days}
                    onClick={() => setHorizonDays(days)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      horizonDays === days
                        ? 'bg-emerald-500 text-navy-950 font-extrabold shadow-sm'
                        : 'bg-navy-900 text-navy-300 border border-navy-700 hover:text-white'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-navy-400 uppercase font-bold block mb-1">Spend Utilization</span>
              <div className="text-2xl font-extrabold text-emerald-300 font-mono">
                {plan.budgetUtilizationPercent}%
              </div>
              <span className="text-[11px] text-navy-400">₹{plan.totalEstimatedSpending.toLocaleString('en-IN')} of ₹{budget.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-4 border-t border-navy-800">
          <div className="w-full h-3 bg-navy-800 rounded-full overflow-hidden p-0.5 border border-navy-700">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${Math.min(100, plan.budgetUtilizationPercent)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-navy-400 mt-1.5 font-mono">
            <span>₹0</span>
            <span>Allocated: ₹{plan.totalEstimatedSpending.toLocaleString('en-IN')}</span>
            <span>Remaining Reserve: ₹{plan.remainingBudget.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Warnings strip if missing quote */}
      {plan.warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Supplier Quotation Notice:</span>
          </div>
          {plan.warnings.slice(0, 2).map((w, idx) => (
            <p key={idx} className="text-amber-700">{w}</p>
          ))}
        </div>
      )}

      {/* Recommendations Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-surface-border flex items-center justify-between">
          <h3 className="font-bold text-base text-navy-900">
            Replenishment Recommendations ({buyItems.length} Products to Order)
          </h3>
          <span className="text-xs font-mono text-navy-500 font-semibold">
            Calculated: {plan.calculatedAt}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-navy-50 text-navy-700 font-bold uppercase text-[11px] border-b border-surface-border">
                <th className="py-3 px-4">Product / SKU</th>
                <th className="py-3 px-3">Available</th>
                <th className="py-3 px-3">7-Day Demand</th>
                <th className="py-3 px-3">Target Stock</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Pack Size</th>
                <th className="py-3 px-3 font-extrabold text-navy-900">Suggested Order</th>
                <th className="py-3 px-3 font-extrabold text-navy-900">Est. Cost (₹)</th>
                <th className="py-3 px-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {plan.recommendations.map((rec) => (
                <tr key={rec.product.id} className={`hover:bg-navy-50/40 transition-colors ${
                  rec.suggestedReorderQty === 0 ? 'opacity-60 bg-slate-50/50' : ''
                }`}>
                  <td className="py-3 px-4 font-bold text-navy-900">
                    <div>
                      <span>{rec.product.nameEn}</span>
                      <div className="text-[11px] text-navy-400 font-mono font-normal">
                        {rec.product.sku}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono">{rec.product.stock.availableStock} {rec.product.unit}</td>
                  <td className="py-3 px-3 font-mono text-navy-600">{rec.expectedDemand7Days} {rec.product.unit}</td>
                  <td className="py-3 px-3 font-mono text-navy-600">{rec.targetStock} {rec.product.unit}</td>
                  <td className="py-3 px-3">
                    {rec.priority === 'HIGH' && (
                      <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                        HIGH
                      </span>
                    )}
                    {rec.priority === 'MED' && (
                      <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded">
                        MED
                      </span>
                    )}
                    {rec.priority === 'SKIP' && (
                      <span className="bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        SKIP
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono">{rec.packSize} {rec.product.unit}</td>
                  <td className="py-3 px-3 font-mono font-extrabold text-navy-900">
                    {rec.suggestedReorderQty > 0 ? (
                      <span className="bg-emerald-100 text-emerald-950 px-2 py-0.5 rounded border border-emerald-300">
                        {rec.suggestedReorderQty} {rec.product.unit}
                      </span>
                    ) : (
                      <span className="text-navy-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono font-extrabold text-emerald-700">
                    ₹{rec.estimatedCost.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-xs text-navy-500 max-w-xs">{rec.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
