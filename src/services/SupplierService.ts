import { Supplier, SupplierQuote } from '../types/supermarket.ts';
import { SUPERMARKET_SAMPLE_SUPPLIERS, SUPERMARKET_SAMPLE_QUOTES } from '../sampleData/supermarketSamples.ts';

const STORAGE_KEY_SUPPLIERS = 'localpulse_suppliers_v1';
const STORAGE_KEY_QUOTES = 'localpulse_quotes_v1';

class SupplierService {
  private suppliers: Supplier[] = [];
  private quotes: SupplierQuote[] = [];

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof window === 'undefined') {
      this.suppliers = SUPERMARKET_SAMPLE_SUPPLIERS;
      this.quotes = SUPERMARKET_SAMPLE_QUOTES;
      return;
    }

    try {
      const savedSupp = localStorage.getItem(STORAGE_KEY_SUPPLIERS);
      this.suppliers = savedSupp ? JSON.parse(savedSupp) : SUPERMARKET_SAMPLE_SUPPLIERS;

      const savedQuotes = localStorage.getItem(STORAGE_KEY_QUOTES);
      this.quotes = savedQuotes ? JSON.parse(savedQuotes) : SUPERMARKET_SAMPLE_QUOTES;
    } catch (e) {
      console.warn('[SupplierService] Error loading localStorage:', e);
      this.suppliers = SUPERMARKET_SAMPLE_SUPPLIERS;
      this.quotes = SUPERMARKET_SAMPLE_QUOTES;
    }
  }

  private saveSuppliers(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SUPPLIERS, JSON.stringify(this.suppliers));
    } catch (e) {
      console.warn('[SupplierService] Error saving suppliers:', e);
    }
  }

  private saveQuotes(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_QUOTES, JSON.stringify(this.quotes));
    } catch (e) {
      console.warn('[SupplierService] Error saving quotes:', e);
    }
  }

  public getSuppliers(): Supplier[] {
    return [...this.suppliers];
  }

  public getSupplier(id: string): Supplier | undefined {
    return this.suppliers.find(s => s.id === id);
  }

  public addSupplier(supplier: Supplier): void {
    this.suppliers.push(supplier);
    this.saveSuppliers();
  }

  public getQuotes(): SupplierQuote[] {
    return [...this.quotes];
  }

  public getQuotesForProduct(productId: string): SupplierQuote[] {
    return this.quotes.filter(q => q.productId === productId);
  }

  public addQuote(quote: SupplierQuote): void {
    this.quotes.unshift(quote);
    this.saveQuotes();
  }

  public getBestQuoteForProduct(productId: string): SupplierQuote | undefined {
    const list = this.getQuotesForProduct(productId);
    if (list.length === 0) return undefined;
    return list.reduce((best, curr) => (curr.quotePrice < best.quotePrice ? curr : best), list[0]);
  }
}

export const supplierService = new SupplierService();
