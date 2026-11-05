import { InventoryItem, InventoryMovement, UnitOfMeasure } from '../types/shared.ts';
import { SUPERMARKET_SAMPLE_INVENTORY } from '../sampleData/supermarketSamples.ts';

const STORAGE_KEY_SM_INVENTORY = 'localpulse_sm_inventory_v1';
const STORAGE_KEY_MOVEMENTS = 'localpulse_movements_v1';
const STORAGE_KEY_IDEMPOTENCY = 'localpulse_applied_idempotency_keys_v1';

class InventoryService {
  private inventory: Map<string, InventoryItem[]> = new Map();
  private movements: InventoryMovement[] = [];
  private appliedIdempotencyKeys: Set<string> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof window === 'undefined') return;

    try {
      const savedSM = localStorage.getItem(STORAGE_KEY_SM_INVENTORY);
      if (savedSM) {
        this.inventory.set('biz-supermarket-1', JSON.parse(savedSM));
      } else {
        this.inventory.set('biz-supermarket-1', SUPERMARKET_SAMPLE_INVENTORY);
        this.saveSMInventory();
      }

      const savedMovements = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      if (savedMovements) {
        this.movements = JSON.parse(savedMovements);
      }

      const savedKeys = localStorage.getItem(STORAGE_KEY_IDEMPOTENCY);
      if (savedKeys) {
        this.appliedIdempotencyKeys = new Set(JSON.parse(savedKeys));
      }
    } catch (e) {
      console.warn('[InventoryService] Error loading localStorage:', e);
      this.inventory.set('biz-supermarket-1', SUPERMARKET_SAMPLE_INVENTORY);
    }
  }

  private saveSMInventory(): void {
    if (typeof window === 'undefined') return;
    try {
      const items = this.inventory.get('biz-supermarket-1') || [];
      localStorage.setItem(STORAGE_KEY_SM_INVENTORY, JSON.stringify(items));
    } catch (e) {
      console.warn('[InventoryService] Error saving SM inventory:', e);
    }
  }

  private saveMovements(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(this.movements));
    } catch (e) {
      console.warn('[InventoryService] Error saving movements:', e);
    }
  }

  // Retrieve inventory for a business
  public getInventory(businessId: string): InventoryItem[] {
    if (!this.inventory.has(businessId)) {
      if (businessId === 'biz-supermarket-1') {
        this.inventory.set(businessId, SUPERMARKET_SAMPLE_INVENTORY);
      } else {
        this.inventory.set(businessId, []);
      }
    }
    return this.inventory.get(businessId)!;
  }

  public getItem(businessId: string, productId: string): InventoryItem | undefined {
    const list = this.getInventory(businessId);
    return list.find(i => i.id === productId || i.sku === productId);
  }

  // Create or Update Item
  public saveItem(businessId: string, item: InventoryItem): void {
    const list = this.getInventory(businessId);
    const existingIndex = list.findIndex(i => i.id === item.id);
    
    // Ensure availableStock is strictly consistent
    item.stock.availableStock = Math.max(0, item.stock.physicalStock - item.stock.reservedStock);

    if (existingIndex >= 0) {
      list[existingIndex] = item;
    } else {
      list.unshift(item);
    }

    if (businessId === 'biz-supermarket-1') this.saveSMInventory();
  }

  public deleteItem(businessId: string, productId: string): boolean {
    const list = this.getInventory(businessId);
    const filtered = list.filter(i => i.id !== productId);
    this.inventory.set(businessId, filtered);
    if (businessId === 'biz-supermarket-1') this.saveSMInventory();
    return true;
  }

  // Safe Stock Adjustment (Guarantees NEVER negative inventory)
  public adjustStock(
    businessId: string,
    productId: string,
    delta: number,
    type: InventoryMovement['type'],
    reason: string,
    referenceId?: string
  ): { success: boolean; error?: string; updatedItem?: InventoryItem } {
    const item = this.getItem(businessId, productId);
    if (!item) {
      return { success: false, error: 'Product not found in inventory' };
    }

    const newPhysical = item.stock.physicalStock + delta;
    if (newPhysical < 0) {
      return { 
        success: false, 
        error: `Cannot reduce inventory by ${Math.abs(delta)} ${item.unit}. Physical stock would become negative (${newPhysical}).` 
      };
    }

    // Check that physical stock does not fall below reserved stock
    if (newPhysical < item.stock.reservedStock) {
      return { 
        success: false, 
        error: `Cannot reduce stock to ${newPhysical} ${item.unit} because ${item.stock.reservedStock} ${item.unit} is currently reserved for active P2P trade inquiries.` 
      };
    }

    const previousPhysical = item.stock.physicalStock;
    item.stock.physicalStock = newPhysical;
    item.stock.availableStock = Math.max(0, newPhysical - item.stock.reservedStock);

    // Update status based on thresholds
    if (item.stock.availableStock === 0) {
      item.status = 'out_of_stock';
    } else if (item.stock.availableStock <= item.reorderThreshold) {
      item.status = 'low_stock';
    } else {
      item.status = 'in_stock';
    }

    this.saveItem(businessId, item);

    // Record movement audit
    this.recordMovement({
      id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      businessId,
      productId: item.id,
      productName: item.nameEn,
      type,
      quantityChange: delta,
      unit: item.unit,
      previousPhysicalStock: previousPhysical,
      newPhysicalStock: newPhysical,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reason,
      referenceId,
    });

    return { success: true, updatedItem: item };
  }

  // Atomic Multi-Item Batch Adjustment for Document Imports (BUY / SELL)
  public applyBatchAdjustment(
    businessId: string,
    adjustments: Array<{
      productId: string;
      productName?: string;
      delta: number;
      type: InventoryMovement['type'];
      unitCost?: number;
      sellingPrice?: number;
      reason: string;
      referenceId?: string;
    }>,
    idempotencyKey?: string
  ): { success: boolean; error?: string; updatedItems?: InventoryItem[]; movements?: InventoryMovement[] } {
    if (idempotencyKey && this.appliedIdempotencyKeys.has(idempotencyKey)) {
      return {
        success: false,
        error: `Duplicate submission prevented: document already imported with idempotency key "${idempotencyKey}".`
      };
    }

    // 1. Dry-run validation: check EVERY item before changing any stock
    const plannedUpdates: Array<{
      item: InventoryItem;
      newPhysical: number;
      delta: number;
      adj: typeof adjustments[0];
    }> = [];

    for (const adj of adjustments) {
      const item = this.getItem(businessId, adj.productId);
      if (!item) {
        return {
          success: false,
          error: `Cannot apply batch update: product "${adj.productName || adj.productId}" not found in inventory.`
        };
      }

      const newPhysical = item.stock.physicalStock + adj.delta;
      if (newPhysical < 0) {
        return {
          success: false,
          error: `Cannot reduce inventory for "${item.nameEn}" by ${Math.abs(adj.delta)} ${item.unit}. Available physical stock (${item.stock.physicalStock} ${item.unit}) is insufficient.`
        };
      }

      if (newPhysical < item.stock.reservedStock) {
        return {
          success: false,
          error: `Cannot reduce inventory for "${item.nameEn}" to ${newPhysical} ${item.unit} because ${item.stock.reservedStock} ${item.unit} is reserved for active P2P trade inquiries.`
        };
      }

      plannedUpdates.push({ item, newPhysical, delta: adj.delta, adj });
    }

    // 2. All validations passed: apply updates atomically
    const updatedItems: InventoryItem[] = [];
    const recordedMovements: InventoryMovement[] = [];

    for (const { item, newPhysical, delta, adj } of plannedUpdates) {
      const previousPhysical = item.stock.physicalStock;
      item.stock.physicalStock = newPhysical;
      item.stock.availableStock = Math.max(0, newPhysical - item.stock.reservedStock);

      if (adj.delta > 0 && adj.unitCost && adj.unitCost > 0) {
        item.purchaseCost = adj.unitCost;
      }
      if (adj.sellingPrice && adj.sellingPrice > 0) {
        item.sellingPrice = adj.sellingPrice;
      }

      if (item.stock.availableStock === 0) item.status = 'out_of_stock';
      else if (item.stock.availableStock <= item.reorderThreshold) item.status = 'low_stock';
      else item.status = 'in_stock';

      this.saveItem(businessId, item);
      updatedItems.push(item);

      const movement: InventoryMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        businessId,
        productId: item.id,
        productName: item.nameEn,
        type: adj.type,
        quantityChange: delta,
        unit: item.unit,
        previousPhysicalStock: previousPhysical,
        newPhysicalStock: newPhysical,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        reason: adj.reason,
        referenceId: adj.referenceId,
      };

      this.recordMovement(movement);
      recordedMovements.push(movement);
    }

    if (idempotencyKey) {
      this.appliedIdempotencyKeys.add(idempotencyKey);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY_IDEMPOTENCY, JSON.stringify([...this.appliedIdempotencyKeys]));
        } catch (e) {
          console.warn('[InventoryService] Error saving idempotency keys:', e);
        }
      }
    }

    return { success: true, updatedItems, movements: recordedMovements };
  }

  // Safe Reservation for P2P Marketplace
  public reserveStock(
    businessId: string,
    productId: string,
    quantity: number,
    inquiryId: string
  ): { success: boolean; error?: string } {
    const item = this.getItem(businessId, productId);
    if (!item) return { success: false, error: 'Item not found' };

    if (item.stock.availableStock < quantity) {
      return { 
        success: false, 
        error: `Insufficient available stock to reserve. Available: ${item.stock.availableStock} ${item.unit}, Requested: ${quantity} ${item.unit}` 
      };
    }

    item.stock.reservedStock += quantity;
    item.stock.availableStock = Math.max(0, item.stock.physicalStock - item.stock.reservedStock);
    this.saveItem(businessId, item);

    this.recordMovement({
      id: `mov-res-${Date.now()}`,
      businessId,
      productId: item.id,
      productName: item.nameEn,
      type: 'p2p_reserved',
      quantityChange: 0, // Physical stock unchanged, reserved increased
      unit: item.unit,
      previousPhysicalStock: item.stock.physicalStock,
      newPhysicalStock: item.stock.physicalStock,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reason: `Reserved for accepted P2P inquiry #${inquiryId}`,
      referenceId: inquiryId,
    });

    return { success: true };
  }

  // Release reservation on P2P cancellation or rejection
  public releaseReservation(
    businessId: string,
    productId: string,
    quantity: number,
    inquiryId: string
  ): boolean {
    const item = this.getItem(businessId, productId);
    if (!item) return false;

    item.stock.reservedStock = Math.max(0, item.stock.reservedStock - quantity);
    item.stock.availableStock = Math.max(0, item.stock.physicalStock - item.stock.reservedStock);
    this.saveItem(businessId, item);

    this.recordMovement({
      id: `mov-rel-${Date.now()}`,
      businessId,
      productId: item.id,
      productName: item.nameEn,
      type: 'p2p_release',
      quantityChange: 0,
      unit: item.unit,
      previousPhysicalStock: item.stock.physicalStock,
      newPhysicalStock: item.stock.physicalStock,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reason: `Released reservation from cancelled/rejected P2P inquiry #${inquiryId}`,
      referenceId: inquiryId,
    });

    return true;
  }

  // Deduct upon P2P Handover Completion
  public finalizeTradeDeduction(
    businessId: string,
    productId: string,
    quantity: number,
    tradeId: string
  ): boolean {
    const item = this.getItem(businessId, productId);
    if (!item) return false;

    const previousPhysical = item.stock.physicalStock;
    item.stock.physicalStock = Math.max(0, item.stock.physicalStock - quantity);
    item.stock.reservedStock = Math.max(0, item.stock.reservedStock - quantity);
    item.stock.availableStock = Math.max(0, item.stock.physicalStock - item.stock.reservedStock);

    if (item.stock.availableStock === 0) item.status = 'out_of_stock';
    else if (item.stock.availableStock <= item.reorderThreshold) item.status = 'low_stock';

    this.saveItem(businessId, item);

    this.recordMovement({
      id: `mov-trade-${Date.now()}`,
      businessId,
      productId: item.id,
      productName: item.nameEn,
      type: 'p2p_trade_deduction',
      quantityChange: -quantity,
      unit: item.unit,
      previousPhysicalStock: previousPhysical,
      newPhysicalStock: item.stock.physicalStock,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reason: `P2P handover confirmed for Trade #${tradeId}`,
      referenceId: tradeId,
    });

    return true;
  }

  // Record movement audit
  public recordMovement(movement: InventoryMovement): void {
    this.movements.unshift(movement);
    this.saveMovements();
  }

  public getMovements(businessId: string): InventoryMovement[] {
    return this.movements.filter(m => m.businessId === businessId);
  }

  // Reset to sample data
  public resetToSample(): void {
    this.inventory.set('biz-supermarket-1', JSON.parse(JSON.stringify(SUPERMARKET_SAMPLE_INVENTORY)));
    this.saveSMInventory();
  }
}

export const inventoryService = new InventoryService();
