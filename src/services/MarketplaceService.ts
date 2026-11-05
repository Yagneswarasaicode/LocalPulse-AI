import { 
  MarketplaceListing, 
  BuyerInquiry, 
  TradeRecord, 
  SurplusSuggestion, 
  ListingStatus 
} from '../types/p2p.ts';
import { BusinessType } from '../types/shared.ts';
import { P2P_SAMPLE_LISTINGS, P2P_SAMPLE_INQUIRIES, P2P_SAMPLE_TRADES } from '../sampleData/p2pSamples.ts';
import { inventoryService } from './InventoryService.ts';
import { vendorAdapter } from './VendorAdapter.ts';

const STORAGE_KEY_LISTINGS = 'localpulse_p2p_listings_v1';
const STORAGE_KEY_INQUIRIES = 'localpulse_p2p_inquiries_v1';
const STORAGE_KEY_TRADES = 'localpulse_p2p_trades_v1';

class MarketplaceService {
  private listings: MarketplaceListing[] = [];
  private inquiries: BuyerInquiry[] = [];
  private trades: TradeRecord[] = [];

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    if (typeof window === 'undefined') {
      this.listings = P2P_SAMPLE_LISTINGS;
      this.inquiries = P2P_SAMPLE_INQUIRIES;
      this.trades = P2P_SAMPLE_TRADES;
      return;
    }

    try {
      const savedListings = localStorage.getItem(STORAGE_KEY_LISTINGS);
      this.listings = savedListings ? JSON.parse(savedListings) : P2P_SAMPLE_LISTINGS;

      const savedInquiries = localStorage.getItem(STORAGE_KEY_INQUIRIES);
      this.inquiries = savedInquiries ? JSON.parse(savedInquiries) : P2P_SAMPLE_INQUIRIES;

      const savedTrades = localStorage.getItem(STORAGE_KEY_TRADES);
      this.trades = savedTrades ? JSON.parse(savedTrades) : P2P_SAMPLE_TRADES;
    } catch (e) {
      console.warn('[MarketplaceService] Error loading localStorage:', e);
      this.listings = P2P_SAMPLE_LISTINGS;
      this.inquiries = P2P_SAMPLE_INQUIRIES;
      this.trades = P2P_SAMPLE_TRADES;
    }
  }

  private saveListings(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(this.listings));
    } catch (e) {
      console.warn('[MarketplaceService] Error saving listings:', e);
    }
  }

  private saveInquiries(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(this.inquiries));
    } catch (e) {
      console.warn('[MarketplaceService] Error saving inquiries:', e);
    }
  }

  private saveTrades(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_TRADES, JSON.stringify(this.trades));
    } catch (e) {
      console.warn('[MarketplaceService] Error saving trades:', e);
    }
  }

  // 1. AI SURPLUS DETECTION (Section 9)
  public detectSurplusSuggestions(businessId: string, businessType: BusinessType): SurplusSuggestion[] {
    const suggestions: SurplusSuggestion[] = [];

    if (businessType === 'vendor') {
      // Connect to Vendor inventory via VendorAdapter
      const vendorItems = vendorAdapter.getVendorRawItems();
      const reservations = vendorAdapter.getVendorReservations();

      for (const item of vendorItems) {
        const itemRes = reservations
          .filter(r => r.vegetableId === item.id)
          .reduce((sum, r) => sum + r.reservedKg, 0);

        const available = Math.max(0, item.remainingKg - itemRes);
        const dailyRate = Math.max(0.1, item.dailySalesKg);
        const daysOfBuffer = available / dailyRate;

        // Surplus condition: > 2.0 days of buffer (especially potatoes, cabbage, garlic)
        if (daysOfBuffer >= 2.0 && available >= 5) {
          const neededBuffer = dailyRate * 1.5; // keep 1.5 days safe buffer
          const potentialSurplus = Math.round((available - neededBuffer) * 10) / 10;

          if (potentialSurplus >= 3) {
            const minPrice = Math.round(item.pricePerKg * 0.7); // 30% discount for recovery
            const maxPrice = Math.round(item.pricePerKg * 0.85);
            suggestions.push({
              id: `surplus-vnd-${item.id}`,
              sourceBusinessId: businessId,
              sourceBusinessType: 'vendor',
              productId: item.id,
              productName: item.nameEn,
              category: 'Vegetables',
              physicalStock: item.remainingKg,
              reservedStock: itemRes,
              availableStock: available,
              dailyDemandRate: dailyRate,
              daysOfBuffer: Math.round(daysOfBuffer * 10) / 10,
              suggestedSurplusQty: potentialSurplus,
              unit: 'kg',
              originalCostPerUnit: item.pricePerKg,
              suggestedMinPrice: minPrice,
              suggestedMaxPrice: maxPrice,
              estimatedGrossRecovery: potentialSurplus * minPrice,
              urgency: daysOfBuffer > 3.0 ? 'HIGH' : 'MED',
              rationale: `You have ${Math.round(daysOfBuffer * 10) / 10} days of stock (${available}kg). Normal daily sales is ${dailyRate}kg. Selling ${potentialSurplus}kg recovers capital before perishables rot.`,
              rationaleTe: `మీ వద్ద ${Math.round(daysOfBuffer * 10) / 10} రోజులకు సరిపడా సరుకు ఉంది. కుళ్ళిపోకముందే ${potentialSurplus} కేజీలను సమీప వ్యాపారులకు విక్రయించి డబ్బు ఆదా చేసుకోండి.`,
            });
          }
        }
      }
    } else {
      // Supermarket Surplus Detection
      const smItems = inventoryService.getInventory(businessId);
      const today = new Date();

      for (const item of smItems) {
        const available = item.stock.availableStock;
        if (available <= 0) continue;

        const dailyRate = Math.max(0.5, item.reorderThreshold / 3);
        const daysOfBuffer = available / dailyRate;

        // Check for near expiry (< 3 days) or large excess (> 3.5 days buffer)
        let isNearExpiry = false;
        let daysToExpiry = 999;
        if (item.expiryDate) {
          const expDate = new Date(item.expiryDate);
          daysToExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysToExpiry <= 3 && daysToExpiry >= 0) isNearExpiry = true;
        }

        const isExcess = daysOfBuffer >= 3.0;

        if (isNearExpiry || isExcess) {
          const surplusQty = isNearExpiry 
            ? Math.round(available * 0.7) 
            : Math.max(1, Math.round(available - dailyRate * 2));

          const discountRate = isNearExpiry ? 0.6 : 0.75;
          const minPrice = Math.round(item.purchaseCost * discountRate);
          const maxPrice = Math.round(item.purchaseCost * 0.9);

          suggestions.push({
            id: `surplus-sm-${item.id}`,
            sourceBusinessId: businessId,
            sourceBusinessType: 'supermarket',
            productId: item.id,
            productName: item.nameEn,
            category: item.category,
            physicalStock: item.stock.physicalStock,
            reservedStock: item.stock.reservedStock,
            availableStock: available,
            dailyDemandRate: Math.round(dailyRate * 10) / 10,
            daysOfBuffer: Math.round(daysOfBuffer * 10) / 10,
            suggestedSurplusQty: surplusQty,
            unit: item.unit,
            originalCostPerUnit: item.purchaseCost,
            suggestedMinPrice: minPrice,
            suggestedMaxPrice: maxPrice,
            estimatedGrossRecovery: surplusQty * minPrice,
            expiryDate: item.expiryDate,
            urgency: isNearExpiry ? 'HIGH' : 'MED',
            rationale: isNearExpiry 
              ? `Expiry in ${daysToExpiry} days! Liquidate ${surplusQty} ${item.unit} to local vendors at ₹${minPrice}/unit to avoid 100% write-off.`
              : `Stock buffer covers ${Math.round(daysOfBuffer)} days (${available} ${item.unit}). Liquidate excess to free cash.`,
          });
        }
      }
    }

    return suggestions;
  }

  // 2. LISTINGS MANAGEMENT (Sections 11 & 12)
  public getListings(filter?: { category?: string; sellerType?: string; maxPrice?: number; search?: string }): MarketplaceListing[] {
    let list = [...this.listings];

    if (filter) {
      if (filter.category && filter.category !== 'ALL') {
        list = list.filter(l => l.category === filter.category);
      }
      if (filter.sellerType && filter.sellerType !== 'ALL') {
        list = list.filter(l => l.sellerType === filter.sellerType);
      }
      if (filter.maxPrice) {
        list = list.filter(l => l.askingPricePerUnit <= filter.maxPrice!);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(l => l.productName.toLowerCase().includes(q) || l.pickupLocality.toLowerCase().includes(q));
      }
    }

    return list;
  }

  public getListing(id: string): MarketplaceListing | undefined {
    return this.listings.find(l => l.id === id);
  }

  // Create Listing (Validates available stock)
  public createListing(listingData: Omit<MarketplaceListing, 'id' | 'reservedQuantity' | 'status' | 'listedAt'>): { success: boolean; error?: string; listing?: MarketplaceListing } {
    // Validate quantity doesn't exceed eligible stock
    let maxAvailable = 9999;
    if (listingData.sellerType === 'vendor') {
      const vItems = vendorAdapter.getUnifiedVendorInventory();
      const matched = vItems.find(v => v.id === listingData.productId);
      if (matched) maxAvailable = matched.stock.availableStock;
    } else if (listingData.sellerType === 'supermarket') {
      const smItem = inventoryService.getItem(listingData.sellerBusinessId, listingData.productId);
      if (smItem) maxAvailable = smItem.stock.availableStock;
    }

    if (listingData.initialQuantity > maxAvailable) {
      return {
        success: false,
        error: `Cannot list ${listingData.initialQuantity} ${listingData.unit}. Only ${maxAvailable} ${listingData.unit} is available in unreserved inventory.`
      };
    }

    const newListing: MarketplaceListing = {
      ...listingData,
      id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      availableQuantity: listingData.initialQuantity,
      reservedQuantity: 0,
      status: 'listed',
      listedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isDemo: true,
    };

    this.listings.unshift(newListing);
    this.saveListings();
    return { success: true, listing: newListing };
  }

  // 3. INQUIRIES & TRADE WORKFLOW (Section 13)
  // Transitions: DRAFT -> LISTED -> INQUIRY -> ACCEPTED / REJECTED -> RESERVED -> COMPLETED / CANCELLED / EXPIRED

  public getInquiries(): BuyerInquiry[] {
    return [...this.inquiries];
  }

  public getInquiriesForSeller(sellerBusinessId: string): BuyerInquiry[] {
    return this.inquiries.filter(i => i.sellerBusinessId === sellerBusinessId);
  }

  public getInquiriesForBuyer(buyerBusinessId: string): BuyerInquiry[] {
    return this.inquiries.filter(i => i.buyerBusinessId === buyerBusinessId);
  }

  // Buyer submits purchase inquiry (Validates listing availability, prevents self-purchase)
  public createInquiry(
    listingId: string,
    buyerBusinessId: string,
    buyerBusinessName: string,
    buyerType: BusinessType,
    requestedQuantity: number
  ): { success: boolean; error?: string; inquiry?: BuyerInquiry } {
    const listing = this.getListing(listingId);
    if (!listing) return { success: false, error: 'Listing not found' };

    // Prevent self-purchase
    if (listing.sellerBusinessId === buyerBusinessId) {
      return { success: false, error: 'Self-purchase is not permitted. You cannot buy from your own business listing.' };
    }

    if (listing.status !== 'listed' && listing.status !== 'reserved') {
      return { success: false, error: `Listing is currently ${listing.status} and not accepting inquiries.` };
    }

    if (requestedQuantity > listing.availableQuantity) {
      return { 
        success: false, 
        error: `Requested quantity (${requestedQuantity} ${listing.unit}) exceeds currently available listing stock (${listing.availableQuantity} ${listing.unit}).` 
      };
    }

    const inquiry: BuyerInquiry = {
      id: `inq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      listingId: listing.id,
      productName: listing.productName,
      sellerBusinessId: listing.sellerBusinessId,
      sellerBusinessName: listing.sellerBusinessName,
      buyerBusinessId,
      buyerBusinessName,
      buyerType,
      requestedQuantity,
      unit: listing.unit,
      agreedPricePerUnit: listing.askingPricePerUnit,
      totalOfferAmount: requestedQuantity * listing.askingPricePerUnit,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    this.inquiries.unshift(inquiry);
    this.saveInquiries();
    return { success: true, inquiry };
  }

  // Seller accepts inquiry: Checks availability, creates reservation, updates listing status
  public acceptInquiry(inquiryId: string): { success: boolean; error?: string } {
    const inquiry = this.inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return { success: false, error: 'Inquiry not found' };

    if (inquiry.status !== 'pending') {
      return { success: false, error: `Inquiry is already ${inquiry.status}. Duplicate acceptance prevented.` };
    }

    const listing = this.getListing(inquiry.listingId);
    if (!listing) return { success: false, error: 'Associated listing not found' };

    if (listing.availableQuantity < inquiry.requestedQuantity) {
      return { success: false, error: 'Stock no longer available on this listing.' };
    }

    // Perform reservation on seller's underlying inventory
    let reservationSuccess = false;
    if (listing.sellerType === 'vendor') {
      reservationSuccess = vendorAdapter.reserveVendorStock(listing.productId, inquiry.requestedQuantity, inquiry.id);
    } else {
      const res = inventoryService.reserveStock(listing.sellerBusinessId, listing.productId, inquiry.requestedQuantity, inquiry.id);
      reservationSuccess = res.success;
      if (!res.success) return { success: false, error: res.error };
    }

    if (!reservationSuccess) {
      return { success: false, error: 'Failed to reserve underlying inventory stock.' };
    }

    // Update listing quantities and status
    listing.availableQuantity -= inquiry.requestedQuantity;
    listing.reservedQuantity += inquiry.requestedQuantity;
    if (listing.availableQuantity === 0) {
      listing.status = 'reserved';
    }
    this.saveListings();

    inquiry.status = 'accepted';
    inquiry.acceptedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.saveInquiries();

    return { success: true };
  }

  // Seller rejects inquiry
  public rejectInquiry(inquiryId: string, reason: string): { success: boolean } {
    const inquiry = this.inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return { success: false };

    inquiry.status = 'rejected';
    inquiry.rejectedReason = reason;
    this.saveInquiries();
    return { success: true };
  }

  // Confirm Handover: Completes trade, deducts seller inventory, credits buyer inventory, records trade
  public confirmHandoverAndComplete(inquiryId: string): { success: boolean; error?: string; trade?: TradeRecord } {
    const inquiry = this.inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return { success: false, error: 'Inquiry not found' };

    if (inquiry.status !== 'accepted') {
      return { success: false, error: `Cannot complete trade. Inquiry is currently ${inquiry.status}.` };
    }

    const listing = this.getListing(inquiry.listingId);
    if (!listing) return { success: false, error: 'Listing not found' };

    // 1. Deduct seller inventory once (idempotent)
    if (listing.sellerType === 'vendor') {
      vendorAdapter.completeVendorTradeHandover(listing.productId, inquiry.requestedQuantity, inquiry.id);
    } else {
      inventoryService.finalizeTradeDeduction(listing.sellerBusinessId, listing.productId, inquiry.requestedQuantity, inquiry.id);
    }

    // 2. Credit buyer inventory where supported (if buyer is Vendor)
    if (inquiry.buyerType === 'vendor') {
      vendorAdapter.creditVendorPurchasedStock(inquiry.productName, inquiry.requestedQuantity, inquiry.agreedPricePerUnit);
    }

    // 3. Update listing
    listing.reservedQuantity = Math.max(0, listing.reservedQuantity - inquiry.requestedQuantity);
    if (listing.availableQuantity === 0 && listing.reservedQuantity === 0) {
      listing.status = 'completed';
    }
    this.saveListings();

    // 4. Update inquiry
    inquiry.status = 'handover_completed';
    inquiry.completedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.saveInquiries();

    // 5. Create immutable TradeRecord
    const trade: TradeRecord = {
      id: `trade-${Date.now()}`,
      inquiryId: inquiry.id,
      listingId: listing.id,
      sellerBusinessId: inquiry.sellerBusinessId,
      sellerBusinessName: inquiry.sellerBusinessName,
      buyerBusinessId: inquiry.buyerBusinessId,
      buyerBusinessName: inquiry.buyerBusinessName,
      productName: inquiry.productName,
      quantity: inquiry.requestedQuantity,
      unit: inquiry.unit,
      pricePerUnit: inquiry.agreedPricePerUnit,
      totalTradeValue: inquiry.totalOfferAmount,
      originalCostTotal: listing.originalCost ? listing.originalCost * inquiry.requestedQuantity : undefined,
      grossRecoveryAmount: inquiry.totalOfferAmount,
      completedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      pickupLocation: listing.pickupLocality,
      sellerRating: 5,
      buyerFeedback: 'Handover verified and recorded in LocalPulse ledger.',
    };

    this.trades.unshift(trade);
    this.saveTrades();

    return { success: true, trade };
  }

  // Cancel inquiry and release reservation safely
  public cancelInquiry(inquiryId: string): { success: boolean } {
    const inquiry = this.inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return { success: false };

    const listing = this.getListing(inquiry.listingId);

    if (inquiry.status === 'accepted' && listing) {
      // Release reservation
      if (listing.sellerType === 'vendor') {
        vendorAdapter.releaseVendorReservation(inquiry.id);
      } else {
        inventoryService.releaseReservation(listing.sellerBusinessId, listing.productId, inquiry.requestedQuantity, inquiry.id);
      }
      listing.availableQuantity += inquiry.requestedQuantity;
      listing.reservedQuantity = Math.max(0, listing.reservedQuantity - inquiry.requestedQuantity);
      if (listing.status === 'reserved') listing.status = 'listed';
      this.saveListings();
    }

    inquiry.status = 'cancelled';
    this.saveInquiries();
    return { success: true };
  }

  public getTradeHistory(): TradeRecord[] {
    return [...this.trades];
  }

  // Marketplace Analytics (Section 15)
  public getAnalytics() {
    const activeListings = this.listings.filter(l => l.status === 'listed' || l.status === 'reserved');
    const completedTrades = this.trades;

    const totalQuantityListed = this.listings.reduce((sum, l) => sum + l.initialQuantity, 0);
    const totalQuantityReserved = this.listings.reduce((sum, l) => sum + l.reservedQuantity, 0);
    const totalTradeValue = completedTrades.reduce((sum, t) => sum + t.totalTradeValue, 0);
    const totalRecovered = completedTrades.reduce((sum, t) => sum + t.grossRecoveryAmount, 0);

    return {
      activeListingCount: activeListings.length,
      totalQuantityListed,
      totalQuantityReserved,
      completedTradesCount: completedTrades.length,
      totalTradeValue,
      totalRecovered,
    };
  }
}

export const marketplaceService = new MarketplaceService();
