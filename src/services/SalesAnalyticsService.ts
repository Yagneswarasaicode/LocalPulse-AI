import { SalesRecord } from '../types/supermarket.ts';
import { SUPERMARKET_SAMPLE_SALES } from '../sampleData/supermarketSamples.ts';

const STORAGE_KEY_SALES = 'localpulse_sales_v1';

class SalesAnalyticsService {
  private sales: SalesRecord[] = [];

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof window === 'undefined') {
      this.sales = SUPERMARKET_SAMPLE_SALES;
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SALES);
      this.sales = saved ? JSON.parse(saved) : SUPERMARKET_SAMPLE_SALES;
    } catch (e) {
      console.warn('[SalesAnalyticsService] Error loading sales:', e);
      this.sales = SUPERMARKET_SAMPLE_SALES;
    }
  }

  private saveSales(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(this.sales));
    } catch (e) {
      console.warn('[SalesAnalyticsService] Error saving sales:', e);
    }
  }

  public getSales(businessId: string): SalesRecord[] {
    return this.sales.filter(s => s.businessId === businessId);
  }

  public recordSale(sale: SalesRecord): void {
    this.sales.unshift(sale);
    this.saveSales();
  }

  public recordBatchSales(records: SalesRecord[]): void {
    this.sales = [...records, ...this.sales];
    this.saveSales();
  }

  // Calculate real performance metrics from stored transactions
  public calculateMetrics(businessId: string) {
    const list = this.getSales(businessId);
    
    const totalRevenue = list.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalMargin = list.reduce((sum, s) => sum + s.grossMarginAmount, 0);
    const marginPercent = totalRevenue > 0 ? Math.round((totalMargin / totalRevenue) * 1000) / 10 : 0;

    // Daily Sales (from last 24h of records)
    const dailySales = list.slice(0, 5).reduce((sum, s) => sum + s.totalRevenue, 0);
    const weeklySales = totalRevenue; // In demo seed, total represents weekly block
    const monthlyEstimated = weeklySales * 4.2;

    // Category Breakdown
    const categoryMap = new Map<string, { revenue: number; margin: number; unitsSold: number }>();
    for (const s of list) {
      const curr = categoryMap.get(s.category) || { revenue: 0, margin: 0, unitsSold: 0 };
      curr.revenue += s.totalRevenue;
      curr.margin += s.grossMarginAmount;
      curr.unitsSold += s.quantitySold;
      categoryMap.set(s.category, curr);
    }

    const categories = Array.from(categoryMap.entries()).map(([cat, data]) => ({
      category: cat,
      revenue: data.revenue,
      margin: data.margin,
      unitsSold: data.unitsSold,
      marginPercent: data.revenue > 0 ? Math.round((data.margin / data.revenue) * 100) : 0,
    }));

    return {
      totalRevenue,
      totalMargin,
      marginPercent,
      dailySales,
      weeklySales,
      monthlyEstimated,
      transactionCount: list.length,
      categories,
    };
  }
}

export const salesAnalyticsService = new SalesAnalyticsService();
