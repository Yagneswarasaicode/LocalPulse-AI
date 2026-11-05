import { VegetableItem } from '../types.ts';
import { InventoryItem, StockLevels } from '../types/shared.ts';
import { INITIAL_SAMPLE_VEGETABLES } from '../sampleData.ts';

const VENDOR_STORAGE_KEY_ITEMS = 'localpulse_vegetables_v1';
const VENDOR_STORAGE_KEY_RESERVATIONS = 'localpulse_vendor_reservations_v1';

export interface VendorReservation {
  vegetableId: string;
  reservedKg: number;
  inquiryId: string;
  timestamp: string;
}

/**
 * VendorAdapter provides a safe, non-mutating bridge between the existing
 * Vendor workspace and the shared multi-tenant platform & P2P Local Market.
 */
class VendorAdapter {
  private vendorBusinessId = 'biz-vendor-1';

  // Read vendor items safely from localStorage
  public getVendorRawItems(): VegetableItem[] {
    if (typeof window === 'undefined') return INITIAL_SAMPLE_VEGETABLES;
    try {
      const saved = localStorage.getItem(VENDOR_STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[VendorAdapter] Failed reading vendor items:', e);
    }
    return INITIAL_SAMPLE_VEGETABLES;
  }

  // Read vendor reservations
  public getVendorReservations(): VendorReservation[] {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(VENDOR_STORAGE_KEY_RESERVATIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('[VendorAdapter] Failed reading vendor reservations:', e);
    }
    return [];
  }

  private saveVendorReservations(res: VendorReservation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(VENDOR_STORAGE_KEY_RESERVATIONS, JSON.stringify(res));
    } catch (e) {
      console.warn('[VendorAdapter] Failed saving vendor reservations:', e);
    }
  }

  // Convert Vendor items into unified InventoryItem objects for shared services & P2P
  public getUnifiedVendorInventory(): InventoryItem[] {
    const rawItems = this.getVendorRawItems();
    const reservations = this.getVendorReservations();

    return rawItems.map((item) => {
      // Calculate active reserved stock for this vegetable
      const itemReservations = reservations
        .filter(r => r.vegetableId === item.id)
        .reduce((sum, r) => sum + r.reservedKg, 0);

      const physical = item.remainingKg;
      const reserved = itemReservations;
      const available = Math.max(0, physical - reserved);

      const stock: StockLevels = {
        physicalStock: physical,
        reservedStock: reserved,
        availableStock: available,
        incomingStock: 0,
        damagedStock: 0,
        expiredStock: 0,
      };

      const daysLeft = item.dailySalesKg > 0 ? physical / item.dailySalesKg : 0;

      return {
        id: item.id,
        sku: `VND-${item.id.toUpperCase()}`,
        nameEn: item.nameEn,
        nameTe: item.nameTe,
        category: 'Vegetables',
        unit: 'kg',
        packSize: 1,
        isPerishable: true,
        typicalShelfLifeDays: item.shelfLifeDays,
        businessId: this.vendorBusinessId,
        stock,
        reorderThreshold: Math.round(item.dailySalesKg * 1.5),
        safetyStock: item.dailySalesKg,
        purchaseCost: item.pricePerKg,
        sellingPrice: Math.round(item.pricePerKg * 1.35),
        storageCategory: 'aerated_basket',
        lastCountedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: available === 0 ? 'out_of_stock' : daysLeft < 1.0 ? 'low_stock' : 'in_stock',
      };
    });
  }

  // Safe stock reservation when a Vendor accepts a P2P inquiry
  public reserveVendorStock(vegetableId: string, quantityKg: number, inquiryId: string): boolean {
    const raw = this.getVendorRawItems();
    const target = raw.find(v => v.id === vegetableId);
    if (!target) return false;

    const reservations = this.getVendorReservations();
    const currentReserved = reservations
      .filter(r => r.vegetableId === vegetableId)
      .reduce((sum, r) => sum + r.reservedKg, 0);

    const available = target.remainingKg - currentReserved;
    if (available < quantityKg) {
      console.warn(`[VendorAdapter] Insufficient available stock to reserve: available ${available}kg, requested ${quantityKg}kg`);
      return false;
    }

    reservations.push({
      vegetableId,
      reservedKg: quantityKg,
      inquiryId,
      timestamp: new Date().toISOString()
    });

    this.saveVendorReservations(reservations);
    return true;
  }

  // Release reservation if P2P inquiry is cancelled or rejected
  public releaseVendorReservation(inquiryId: string): boolean {
    const reservations = this.getVendorReservations();
    const filtered = reservations.filter(r => r.inquiryId !== inquiryId);
    this.saveVendorReservations(filtered);
    return true;
  }

  // Finalize vendor deduction upon confirmed P2P trade handover
  public completeVendorTradeHandover(vegetableId: string, quantityKg: number, inquiryId: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const raw = this.getVendorRawItems();
      const updated = raw.map(item => {
        if (item.id === vegetableId) {
          const newRemaining = Math.max(0, item.remainingKg - quantityKg);
          return { ...item, remainingKg: newRemaining };
        }
        return item;
      });

      localStorage.setItem(VENDOR_STORAGE_KEY_ITEMS, JSON.stringify(updated));
      this.releaseVendorReservation(inquiryId);
      return true;
    } catch (e) {
      console.error('[VendorAdapter] Error completing trade handover:', e);
      return false;
    }
  }

  // Add stock to Vendor inventory if the vendor purchased produce through P2P
  public creditVendorPurchasedStock(nameEn: string, quantityKg: number, pricePerKg: number): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const raw = this.getVendorRawItems();
      let matched = false;
      const updated = raw.map(item => {
        if (item.nameEn.toLowerCase() === nameEn.toLowerCase()) {
          matched = true;
          return {
            ...item,
            remainingKg: item.remainingKg + quantityKg,
            pricePerKg: pricePerKg, // update to actual purchase price
          };
        }
        return item;
      });

      if (!matched) {
        updated.push({
          id: `veg-${Date.now()}`,
          nameEn,
          nameTe: nameEn,
          remainingKg: quantityKg,
          pricePerKg,
          dailySalesKg: Math.max(1, Math.round(quantityKg / 3)),
          shelfLifeDays: 3,
          isSample: false,
        });
      }

      localStorage.setItem(VENDOR_STORAGE_KEY_ITEMS, JSON.stringify(updated));
      return true;
    } catch (e) {
      console.error('[VendorAdapter] Error crediting vendor stock:', e);
      return false;
    }
  }
}

export const vendorAdapter = new VendorAdapter();
