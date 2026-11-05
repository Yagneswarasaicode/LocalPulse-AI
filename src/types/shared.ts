// Shared Data Models across Vendor, Supermarket, and P2P Local Market

export type BusinessType = 'vendor' | 'supermarket' | 'wholesaler' | 'p2p_participant';

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  locality: string; // e.g. "MVP Rythu Bazaar", "Poorna Market", "Jagadamba", "Gajuwaka"
  contactPhone?: string;
  isDemo?: boolean;
}

export type Workspace = 'vendor' | 'supermarket' | 'p2p';

export type UnitOfMeasure = 'kg' | 'g' | 'litre' | 'ml' | 'piece' | 'pack' | 'bag' | 'crate';

export interface UnitQuantity {
  value: number;
  unit: UnitOfMeasure;
  packageMultiplier?: number; // e.g. 1 crate = 25 kg, 1 pack = 500 g
}

export type StorageCategory = 'ambient' | 'cold_storage' | 'dry_pantry' | 'aerated_basket';

export type ProductCategory = 
  | 'Vegetables'
  | 'Fruits'
  | 'Rice and grains'
  | 'Pulses'
  | 'Dairy'
  | 'Packaged food'
  | 'Beverages'
  | 'Household products';

export interface Product {
  id: string;
  sku: string;
  nameEn: string;
  nameTe?: string;
  brand?: string;
  barcode?: string;
  category: ProductCategory;
  unit: UnitOfMeasure;
  packSize: number; // e.g. 1, 5, 25
  isPerishable: boolean;
  typicalShelfLifeDays?: number;
}

// Distinction between stock states to prevent double-counting or negative inventory
export interface StockLevels {
  physicalStock: number;   // Total stock physically on site
  reservedStock: number;   // Stock earmarked for accepted P2P orders or pending handover
  availableStock: number;  // physicalStock - reservedStock (can be sold or listed)
  incomingStock: number;   // Expected from approved supplier orders
  damagedStock: number;    // Damaged/rotted stock set aside for disposal
  expiredStock: number;    // Expired non-usable stock
}

export interface InventoryItem extends Product {
  businessId: string;
  stock: StockLevels;
  reorderThreshold: number; // Low stock alert trigger
  safetyStock: number;      // Minimum buffer
  purchaseCost: number;     // Cost price per unit
  sellingPrice: number;     // Retail selling price per unit
  defaultSupplierId?: string;
  storageCategory: StorageCategory;
  batchNumber?: string;
  expiryDate?: string;      // YYYY-MM-DD, optional for non-perishables
  lastCountedAt: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'near_expiry';
}

export interface InventoryMovement {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'supplier_receipt' | 'inventory_count' | 'p2p_reserved' | 'p2p_release' | 'p2p_trade_deduction' | 'damage_writeoff' | 'PURCHASE_IN' | 'SALE_OUT';
  quantityChange: number; // positive or negative
  unit: UnitOfMeasure;
  previousPhysicalStock: number;
  newPhysicalStock: number;
  timestamp: string;
  reason: string;
  referenceId?: string; // e.g. PO id, Trade id, or Invoice id
}

export interface MarketPriceObservation {
  id: string;
  productName: string;
  mandiName: string; // e.g. "Poorna Market", "MVP Rythu Bazaar"
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  unit: UnitOfMeasure;
  observationDate: string;
  source: 'verified' | 'cached' | 'demo' | 'manual';
}

export interface WeatherObservation {
  location: string;
  temperatureC: number;
  humidityPercent: number;
  condition: string;
  spoilageAdvisory: string;
  timestamp: string;
  isDemo: boolean;
}

export interface LiveWeatherReport {
  provider: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    locality: string;
    timezone: string;
    isDemoLocation: boolean;
  };
  current: {
    temperatureC: number | null;
    relativeHumidityPercent: number | null;
    precipitationMm: number;
    windSpeedKmH: number;
    weatherCode: number;
    isDay: boolean;
    observedAt: string;
  };
  dailyForecast: Array<{
    date: string;
    maxTemp: number | null;
    minTemp: number | null;
    precipitationSum: number;
    precipitationProbability: number;
  }>;
  advisories: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    textEn: string;
    textTe: string;
  }>;
  attribution: string;
}

export interface LiveMandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  commodityTe?: string;
  variety?: string;
  grade?: string;
  arrivalDate: string;
  minPricePerQuintal: number;
  maxPricePerQuintal: number;
  modalPricePerQuintal: number;
  minPricePerKg: number;
  maxPricePerKg: number;
  modalPricePerKg: number;
  rawUnit: string;
  normalizedUnit: string;
  source: string;
  isDemoOnly: boolean;
}

