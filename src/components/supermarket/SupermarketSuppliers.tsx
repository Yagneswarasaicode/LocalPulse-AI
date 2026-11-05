import React, { useState } from 'react';
import { Supplier, SupplierQuote, Language } from '../../types';
import { supplierService } from '../../services/SupplierService';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Star, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Layers,
  X
} from 'lucide-react';

interface SupermarketSuppliersProps {
  language: Language;
}

export const SupermarketSuppliers: React.FC<SupermarketSuppliersProps> = ({
  language,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => supplierService.getSuppliers());
  const [quotes, setQuotes] = useState<SupplierQuote[]>(() => supplierService.getQuotes());
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [newQuote, setNewQuote] = useState({
    supplierId: suppliers[0]?.id || '',
    productName: '',
    productId: 'sm-item-1',
    quotePrice: 20,
    packSize: 20,
    minimumOrderQty: 2,
    unit: 'kg' as any,
    validUntil: '2026-11-20',
  });

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find(s => s.id === newQuote.supplierId);
    if (!supp) return;

    const quoteToSave: SupplierQuote = {
      id: `quote-${Date.now()}`,
      supplierId: supp.id,
      supplierName: supp.name,
      productId: newQuote.productId,
      productName: newQuote.productName.trim() || 'Custom Product',
      quotePrice: Number(newQuote.quotePrice) || 10,
      packSize: Number(newQuote.packSize) || 1,
      minimumOrderQty: Number(newQuote.minimumOrderQty) || 1,
      unit: newQuote.unit,
      validUntil: newQuote.validUntil,
      quoteDate: new Date().toISOString().substring(0, 10),
    };

    supplierService.addQuote(quoteToSave);
    setQuotes([...supplierService.getQuotes()]);
    setShowAddQuoteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Supplier Directory & Quotation Matrix
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Verified vendor lead times, minimum order quantities, and active wholesale quote comparisons.
          </p>
        </div>

        <button
          onClick={() => setShowAddQuoteModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier Quote</span>
        </button>
      </div>

      {/* Supplier Profiles Grid */}
      <div>
        <h3 className="text-xs font-bold text-navy-400 uppercase tracking-wider mb-3">
          Contracted Regional Suppliers ({suppliers.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold bg-navy-100 text-navy-800 px-2 py-0.5 rounded font-mono">
                    Lead: {s.leadTimeDays} Day{s.leadTimeDays > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{s.rating}</span>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-navy-900">{s.name}</h4>
                <div className="text-xs text-navy-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="truncate">{s.locality}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border text-[11px] text-navy-600 flex items-center justify-between">
                <span>Contact: {s.contactPerson}</span>
                <span className="font-mono">{s.phone}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Quotations Matrix Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <div className="p-5 border-b border-surface-border">
          <h3 className="font-bold text-base text-navy-900">
            Active Supplier Quotations ({quotes.length})
          </h3>
          <p className="text-xs text-navy-500 mt-0.5">
            Verified wholesale price points used by the procurement engine.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-navy-50/80 text-navy-700 font-bold uppercase text-[11px] border-b border-surface-border">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Quoted Price</th>
                <th className="py-3 px-3">Pack Size</th>
                <th className="py-3 px-3">Min. Order (MOQ)</th>
                <th className="py-3 px-3">Quote Date</th>
                <th className="py-3 px-4 text-right">Validity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-navy-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy-900">{q.productName}</td>
                  <td className="py-3 px-3 text-navy-700 font-medium">{q.supplierName}</td>
                  <td className="py-3 px-3 font-mono font-extrabold text-emerald-700">₹{q.quotePrice} / {q.unit}</td>
                  <td className="py-3 px-3 font-mono">{q.packSize} {q.unit} / pack</td>
                  <td className="py-3 px-3 font-mono">{q.minimumOrderQty} packs ({q.minimumOrderQty * q.packSize} {q.unit})</td>
                  <td className="py-3 px-3 font-mono text-[11px] text-navy-500">{q.quoteDate}</td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-emerald-700 font-semibold">Valid till {q.validUntil}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Quote Modal */}
      {showAddQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 border border-surface-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-base text-navy-900">Record Manual Supplier Quote</h3>
              <button onClick={() => setShowAddQuoteModal(false)} className="text-navy-400 hover:text-navy-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Select Supplier</label>
                <select
                  value={newQuote.supplierId}
                  onChange={(e) => setNewQuote({ ...newQuote, supplierId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.locality})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sona Masoori Rice (25kg bag)"
                  value={newQuote.productName}
                  onChange={(e) => setNewQuote({ ...newQuote, productName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Quote Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuote.quotePrice}
                    onChange={(e) => setNewQuote({ ...newQuote, quotePrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Pack Size</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuote.packSize}
                    onChange={(e) => setNewQuote({ ...newQuote, packSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Min Order Qty (Packs)</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuote.minimumOrderQty}
                    onChange={(e) => setNewQuote({ ...newQuote, minimumOrderQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={newQuote.validUntil}
                    onChange={(e) => setNewQuote({ ...newQuote, validUntil: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddQuoteModal(false)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-navy-200 text-navy-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-xs"
                >
                  Save Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
