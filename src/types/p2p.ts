import { UnitOfMeasure, ProductCategory, BusinessType } from './shared.ts';

export type ProductCondition = 'fresh_grade_a' | 'ripe_immediate_use' | 'surplus_sealed_batch' | 'near_expiry_sound';

export type ListingStatus = 'draft' | 'listed' | 'paused' | 'reserved' | 'completed' | 'cancelled' | 'expired';

export type InquiryStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'handover_completed';

export interface SurplusSuggestion {
  id: string;
  sourceBusinessId: string;
  sourceBusinessType: BusinessType;
  productId: string;
  productName: string;
  category: ProductCategory;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  dailyDemandRate: number;
  daysOfBuffer: number;
  suggestedSurplusQty: number;
  unit: UnitOfMeasure;
  originalCostPerUnit: number;
  suggestedMinPrice: number;
  suggestedMaxPrice: number;
  estimatedGrossRecovery: number;
  expiryDate?: string;
  urgency: 'HIGH' | 'MED' | 'LOW';
  rationale: string;
  rationaleTe?: string;
}

export interface MarketplaceListing {
  id: string;
  sellerBusinessId: string;
  sellerBusinessName: string;
  sellerType: BusinessType;
  productId: string;
  productName: string;
  productNameTe?: string;
  category: ProductCategory;
  initialQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  unit: UnitOfMeasure;
  originalCost?: number;
  askingPricePerUnit: number; // in INR
  condition: ProductCondition;
  expiryDate?: string;
  pickupLocality: string; // e.g. "MVP Rythu Bazaar Shed 4", "Poorna Market Gate 2"
  pickupTiming: string;   // e.g. "Morning 7:00 AM - 11:00 AM"
  status: ListingStatus;
  listedAt: string;
  expiresAt: string;
  notes?: string;
  isDemo?: boolean;
}

export interface StockReservation {
  id: string;
  listingId: string;
  sellerBusinessId: string;
  buyerBusinessId: string;
  productId: string;
  reservedQuantity: number;
  unit: UnitOfMeasure;
  status: 'active' | 'released' | 'finalized_trade';
  createdAt: string;
}

export interface BuyerInquiry {
  id: string;
  listingId: string;
  productName: string;
  sellerBusinessId: string;
  sellerBusinessName: string;
  buyerBusinessId: string;
  buyerBusinessName: string;
  buyerType: BusinessType;
  requestedQuantity: number;
  unit: UnitOfMeasure;
  agreedPricePerUnit: number;
  totalOfferAmount: number;
  status: InquiryStatus;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
  rejectedReason?: string;
  reservationId?: string;
}

export interface TradeRecord {
  id: string;
  inquiryId: string;
  listingId: string;
  sellerBusinessId: string;
  sellerBusinessName: string;
  buyerBusinessId: string;
  buyerBusinessName: string;
  productName: string;
  quantity: number;
  unit: UnitOfMeasure;
  pricePerUnit: number;
  totalTradeValue: number;
  originalCostTotal?: number;
  grossRecoveryAmount: number;
  completedAt: string;
  pickupLocation: string;
  sellerRating?: number;
  buyerFeedback?: string;
}
