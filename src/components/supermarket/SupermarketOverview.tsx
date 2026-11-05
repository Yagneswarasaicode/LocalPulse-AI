import React from 'react';
import { Language } from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { salesAnalyticsService } from '../../services/SalesAnalyticsService';
import { procurementService } from '../../services/ProcurementService';
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
  ArrowRight
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
  const items = inventoryService.getInventory(businessId);
  const salesMetrics = salesAnalyticsService.calculateMetrics(businessId);
  const plan = procurementService.calculateSupermarketPlan(businessId, 25000, 7);

  const totalSKUs = items.length;
  const inventoryValuation = items.reduce((sum, i) => sum + i.stock.physicalStock * i.purchaseCost, 0);
  const lowStockItems = items.filter(i => i.status === 'low_stock' || i.stock.availableStock <= i.reorderThreshold);
  const nearExpiryItems = items.filter(i => i.status === 'near_expiry');

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
