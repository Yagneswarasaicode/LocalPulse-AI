import React, { useState } from 'react';
import { SalesRecord, Language } from '../../types';
import { salesAnalyticsService } from '../../services/SalesAnalyticsService';
import { 
  TrendingUp, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  DollarSign, 
  Tag, 
  Check 
} from 'lucide-react';

interface SupermarketSalesHistoryProps {
  businessId: string;
  language: Language;
}

export const SupermarketSalesHistory: React.FC<SupermarketSalesHistoryProps> = ({
  businessId,
  language,
}) => {
  const [sales, setSales] = useState<SalesRecord[]>(() => salesAnalyticsService.getSales(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copied, setCopied] = useState(false);

  const metrics = salesAnalyticsService.calculateMetrics(businessId);

  const filteredSales = sales.filter(s => {
    const matchesSearch = s.productName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExportCsv = () => {
    const headers = ['TransactionID', 'ProductName', 'Category', 'Quantity', 'Unit', 'UnitPrice', 'TotalRevenue', 'GrossMargin', 'Timestamp'];
    const rows = filteredSales.map(s => [
      s.id,
      `"${s.productName}"`,
      s.category,
      s.quantitySold,
      s.unit,
      s.unitPrice,
      s.totalRevenue,
      s.grossMarginAmount,
      s.timestamp
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Sales & Transaction Ledger
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Historical point-of-sale transactions, margin analysis, and auditable register records.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-700 border border-navy-200 font-semibold text-xs sm:text-sm transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4 text-navy-600" />}
          <span>{copied ? 'CSV Copied to Clipboard!' : 'Export Sales CSV'}</span>
        </button>
      </div>

      {/* Top Margin & Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-bold text-navy-400 uppercase tracking-wider block mb-1">Total Sales Revenue</span>
          <div className="text-2xl font-extrabold text-navy-900 font-mono">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-navy-500">{metrics.transactionCount} transactions recorded</span>
        </div>

        <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-bold text-navy-400 uppercase tracking-wider block mb-1">Total Gross Margin</span>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            ₹{metrics.totalMargin.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">Profit after inventory purchase cost</span>
        </div>

        <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-card">
          <span className="text-xs font-bold text-navy-400 uppercase tracking-wider block mb-1">Margin Percentage</span>
          <div className="text-2xl font-extrabold text-teal-700 font-mono">
            {metrics.marginPercent}%
          </div>
          <span className="text-[11px] text-navy-500">Retail grocery industry target: 20–28%</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-navy-200 focus:border-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-navy-200 text-xs font-semibold bg-white text-navy-800 focus:border-emerald-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Dairy">Dairy</option>
            <option value="Rice and grains">Rice and grains</option>
            <option value="Packaged food">Packaged food</option>
            <option value="Household products">Household products</option>
          </select>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-navy-50/80 text-navy-700 font-bold uppercase tracking-wider text-[11px] border-b border-surface-border">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Qty Sold</th>
                <th className="py-3 px-3">Unit Price</th>
                <th className="py-3 px-3">Total Revenue</th>
                <th className="py-3 px-3">Gross Margin</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-navy-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-navy-400">{sale.id}</td>
                  <td className="py-3 px-3 font-bold text-navy-900">{sale.productName}</td>
                  <td className="py-3 px-3 text-navy-600 font-medium">{sale.category}</td>
                  <td className="py-3 px-3 font-mono font-semibold">{sale.quantitySold} {sale.unit}</td>
                  <td className="py-3 px-3 font-mono text-navy-700">₹{sale.unitPrice}</td>
                  <td className="py-3 px-3 font-mono font-bold text-navy-900">₹{sale.totalRevenue.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">+₹{sale.grossMarginAmount}</td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-navy-400">{sale.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
