import { InventoryItem, UnitOfMeasure, ProductCategory } from './shared.ts';

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  locality: string;
  leadTimeDays: number;
  rating: number; // 1-5
  categoriesSupplied: ProductCategory[];
  isDemo?: boolean;
}

export interface SupplierQuote {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  quotePrice: number;
  packSize: number;
  minimumOrderQty: number; // in packs or units
  unit: UnitOfMeasure;
  validUntil: string;
  quoteDate: string;
}

export interface SalesRecord {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  quantitySold: number;
  unit: UnitOfMeasure;
  unitPrice: number;
  totalRevenue: number;
  grossMarginAmount: number;
  timestamp: string;
  importBatchId?: string;
}

export interface PurchaseOrderLineItem {
  productId: string;
  productName: string;
  quantityOrdered: number;
  packSize: number;
  unit: UnitOfMeasure;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  businessId: string;
  supplierId: string;
  supplierName: string;
  status: 'draft' | 'approved' | 'sent' | 'partially_received' | 'received' | 'cancelled';
  items: PurchaseOrderLineItem[];
  totalCost: number;
  createdDate: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  notes?: string;
}

export interface ImportLineItem {
  rawText?: string;
  skuMatched?: string;
  productName: string;
  quantity: number;
  unit: UnitOfMeasure;
  unitPrice?: number;
  totalAmount?: number;
  date?: string;
  status: 'valid' | 'warning' | 'error';
  validationMessage?: string;
}

export interface ImportDocument {
  id: string;
  businessId: string;
  fileName: string;
  fileType: 'sales_statement' | 'supplier_invoice' | 'inventory_sheet';
  sourceFormat: 'csv' | 'json' | 'excel' | 'pdf' | 'image';
  uploadedAt: string;
  status: 'uploaded' | 'parsed' | 'validated' | 'applied' | 'rejected';
  totalLines: number;
  validLines: number;
  totalAmount: number;
  extractedRecords: ImportLineItem[];
  appliedAt?: string;
  auditNote?: string;
}

export interface SupermarketPurchaseRecommendation {
  product: InventoryItem;
  expectedDemand7Days: number;
  targetStock: number;
  suggestedReorderQty: number;
  chosenSupplierId?: string;
  chosenSupplierName?: string;
  packSize: number;
  unitCost: number;
  estimatedCost: number;
  priority: 'HIGH' | 'MED' | 'LOW' | 'SKIP';
  reason: string;
  hasQuote: boolean;
}

export interface SupermarketProcurementPlan {
  planningHorizonDays: number;
  approvedBudget: number;
  totalEstimatedSpending: number;
  remainingBudget: number;
  budgetUtilizationPercent: number;
  recommendations: SupermarketPurchaseRecommendation[];
  warnings: string[];
  calculatedAt: string;
}
