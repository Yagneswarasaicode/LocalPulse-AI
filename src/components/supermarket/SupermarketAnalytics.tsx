import React from 'react';
import { Language } from '../../types';
import { salesAnalyticsService } from '../../services/SalesAnalyticsService';
import { inventoryService } from '../../services/InventoryService';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  Layers, 
  DollarSign, 
  Package, 
  AlertTriangle 
} from 'lucide-react';

interface SupermarketAnalyticsProps {
  businessId: string;
  language: Language;
}

export const SupermarketAnalytics: React.FC<SupermarketAnalyticsProps> = ({
  businessId,
  language,
}) => {
  const metrics = salesAnalyticsService.calculateMetrics(businessId);
  const inventory = inventoryService.getInventory(businessId);

  const totalInventoryCost = inventory.reduce((sum, i) => sum + i.stock.physicalStock * i.purchaseCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Supermarket Business Analytics
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Category revenue performance, gross margin capture, and inventory capital distribution.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card">
          <span className="text-xs font-bold text-navy-400 uppercase tracking-wider block mb-1">Gross Margin Capture</span>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono">
            {metrics.marginPercent}%
          </div>
          <span className="text-xs text-navy-500 mt-1 block">₹{metrics.totalMargin.toLocaleString('en-IN')} net profit from ₹{metrics.totalRevenue.toLocaleString('en-IN')} sales</span>
        </div>

        <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card">
          <span className="text-xs font-bold text-navy-400 uppercase tracking-wider block mb-1">Active Working Capital</span>
          <div className="text-3xl font-extrabold text-navy-900 font-mono">
            ₹{totalInventoryCost.toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-navy-500 mt-1 block">Locked across {inventory.length} active warehouse SKUs</span>
        </div>

        <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card">
          <span className="text-xs font-bold text-navy-400 uppercase tracking-wider block mb-1">Estimated Monthly Run-Rate</span>
          <div className="text-3xl font-extrabold text-teal-700 font-mono">
            ₹{Math.round(metrics.monthlyEstimated).toLocaleString('en-IN')}
          </div>
          <span className="text-xs text-navy-500 mt-1 block">Projected 30-day top-line volume</span>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-4">
        <h3 className="font-bold text-base text-navy-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <span>Category Performance Breakdown</span>
        </h3>

        <div className="space-y-3">
          {metrics.categories.map((cat, idx) => {
            const share = metrics.totalRevenue > 0 ? Math.round((cat.revenue / metrics.totalRevenue) * 100) : 0;
            return (
              <div key={idx} className="p-3.5 rounded-xl bg-navy-50/50 border border-navy-100">
                <div className="flex items-center justify-between mb-1.5 text-xs sm:text-sm">
                  <span className="font-bold text-navy-900">{cat.category}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-navy-500">{cat.unitsSold} units</span>
                    <span className="font-bold text-navy-900">₹{cat.revenue.toLocaleString('en-IN')}</span>
                    <span className="text-emerald-700 font-bold">({cat.marginPercent}% margin)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-navy-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-600 rounded-full"
                    style={{ width: `${share}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
