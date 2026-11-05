import React from 'react';
import { TradeRecord, Language } from '../../types';
import { marketplaceService } from '../../services/MarketplaceService';
import { 
  History, 
  MapPin, 
  CheckCircle2, 
  DollarSign, 
  Star, 
  ShieldCheck 
} from 'lucide-react';

interface P2PTradeHistoryProps {
  language: Language;
}

export const P2PTradeHistory: React.FC<P2PTradeHistoryProps> = ({
  language,
}) => {
  const trades = marketplaceService.getTradeHistory();
  const totalValue = trades.reduce((sum, t) => sum + t.totalTradeValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Completed Surplus Trade Ledger
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Immutable record of completed handovers, verified payments, and local produce value recovery.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-navy-400 uppercase font-bold block">Total Recovered Trade Volume</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{totalValue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {trades.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 border border-surface-border text-center space-y-2">
          <History className="w-12 h-12 text-navy-300 mx-auto" />
          <h3 className="font-bold text-base text-navy-900">No completed trades recorded yet</h3>
          <p className="text-xs text-navy-500 max-w-sm mx-auto">
            Completed handovers between vendors and supermarkets will appear here with full provenance.
          </p>
        </div>
      ) : (
        <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-navy-50 text-navy-700 font-bold uppercase text-[11px] border-b border-surface-border">
                  <th className="py-3 px-4">Trade ID</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Seller</th>
                  <th className="py-3 px-3">Buyer</th>
                  <th className="py-3 px-3">Quantity</th>
                  <th className="py-3 px-3">Price / Unit</th>
                  <th className="py-3 px-3 font-extrabold text-navy-900">Total Value</th>
                  <th className="py-3 px-4 text-right">Handover Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {trades.map(t => (
                  <tr key={t.id} className="hover:bg-navy-50/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-navy-400">{t.id}</td>
                    <td className="py-3 px-3 font-bold text-navy-900">{t.productName}</td>
                    <td className="py-3 px-3 text-navy-700 font-medium">{t.sellerBusinessName}</td>
                    <td className="py-3 px-3 text-navy-700 font-medium">{t.buyerBusinessName}</td>
                    <td className="py-3 px-3 font-mono font-semibold">{t.quantity} {t.unit}</td>
                    <td className="py-3 px-3 font-mono">₹{t.pricePerUnit}</td>
                    <td className="py-3 px-3 font-mono font-extrabold text-emerald-700">₹{t.totalTradeValue}</td>
                    <td className="py-3 px-4 text-right font-mono text-[11px] text-navy-400">{t.completedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
