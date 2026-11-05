import React, { useState } from 'react';
import { MarketplaceListing, Language } from '../../types';
import { marketplaceService } from '../../services/MarketplaceService';
import { 
  Search, 
  MapPin, 
  Tag, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ShoppingBag, 
  AlertCircle, 
  CheckCircle2, 
  X 
} from 'lucide-react';

interface P2PDiscoverProps {
  currentBuyerId: string;
  currentBuyerName: string;
  currentBuyerType: any;
  onNavigateTab: (tab: string) => void;
  language: Language;
}

export const P2PDiscover: React.FC<P2PDiscoverProps> = ({
  currentBuyerId,
  currentBuyerName,
  currentBuyerType,
  onNavigateTab,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sellerTypeFilter, setSellerTypeFilter] = useState('ALL');
  const [inquiryListing, setInquiryListing] = useState<MarketplaceListing | null>(null);
  const [requestQty, setRequestQty] = useState<number>(5);
  const [inquiryError, setInquiryError] = useState('');
  const [inquirySuccess, setInquirySuccess] = useState('');

  const listings = marketplaceService.getListings({
    category: categoryFilter,
    sellerType: sellerTypeFilter,
    search: searchQuery,
  });

  const handleOpenInquiry = (listing: MarketplaceListing) => {
    setInquiryListing(listing);
    setRequestQty(Math.min(listing.availableQuantity, 10));
    setInquiryError('');
    setInquirySuccess('');
  };

  const handleConfirmInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryListing) return;

    const res = marketplaceService.createInquiry(
      inquiryListing.id,
      currentBuyerId,
      currentBuyerName,
      currentBuyerType,
      requestQty
    );

    if (!res.success) {
      setInquiryError(res.error || 'Failed to submit inquiry');
      return;
    }

    setInquirySuccess(`Request submitted to ${inquiryListing.sellerBusinessName}! Check "Buy Requests" tab.`);
    setTimeout(() => {
      setInquiryListing(null);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Hyperlocal Surplus Recovery
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Discover Nearby Verified Produce & Surplus
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Recovered lots from local Visakhapatnam Rythu Bazaars, mandi stalls, and supermarkets at wholesale discount.
          </p>
        </div>

        <div className="bg-navy-50 border border-navy-200 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
          <span className="text-navy-500">Browsing as:</span>
          <span className="font-bold text-navy-900">{currentBuyerName}</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search produce, milk, grains, or locality..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-navy-200 focus:border-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-navy-200 text-xs font-semibold bg-white text-navy-800"
          >
            <option value="ALL">All Categories</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Dairy">Dairy</option>
            <option value="Rice and grains">Rice and grains</option>
          </select>

          <select
            value={sellerTypeFilter}
            onChange={(e) => setSellerTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-navy-200 text-xs font-semibold bg-white text-navy-800"
          >
            <option value="ALL">All Seller Types</option>
            <option value="vendor">Street Vendors</option>
            <option value="supermarket">Supermarkets</option>
            <option value="wholesaler">Mandi Wholesalers</option>
          </select>
        </div>
      </div>

      {/* Listings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map(listing => {
          const isSelf = listing.sellerBusinessId === currentBuyerId;

          return (
            <div
              key={listing.id}
              className={`bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card flex flex-col justify-between hover:border-emerald-400 hover:shadow-elevated transition-all ${
                listing.status === 'reserved' ? 'opacity-80' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold bg-navy-100 text-navy-800 px-2 py-0.5 rounded uppercase font-mono">
                    {listing.sellerType}
                  </span>
                  {listing.status === 'listed' ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      AVAILABLE
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      PARTIALLY RESERVED
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base text-navy-900">{listing.productName}</h3>
                {listing.productNameTe && (
                  <p className="text-xs text-navy-500 telugu-text">{listing.productNameTe}</p>
                )}

                <div className="flex items-baseline gap-2 mt-2 mb-3">
                  <span className="text-2xl font-extrabold text-emerald-700 font-mono">
                    ₹{listing.askingPricePerUnit}
                  </span>
                  <span className="text-xs text-navy-500">/ {listing.unit}</span>
                  {listing.originalCost && (
                    <span className="text-xs text-navy-400 line-through font-mono">
                      ₹{listing.originalCost}
                    </span>
                  )}
                </div>

                <div className="bg-navy-50/70 p-3 rounded-xl text-xs space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-navy-500">Available Stock:</span>
                    <span className="font-bold text-navy-900">{listing.availableQuantity} {listing.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-500">Condition:</span>
                    <span className="font-semibold text-navy-800 capitalize">{listing.condition.replace(/_/g, ' ')}</span>
                  </div>
                  {listing.expiryDate && (
                    <div className="flex justify-between text-rose-700 font-semibold">
                      <span>Expires:</span>
                      <span>{listing.expiryDate}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-navy-500 space-y-1 mb-4">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{listing.pickupLocality}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-navy-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Pickup: {listing.pickupTiming}</span>
                  </div>
                </div>
              </div>

              <div>
                {isSelf ? (
                  <button
                    disabled
                    className="w-full py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed"
                  >
                    Your Own Listing (Self-Purchase Prevented)
                  </button>
                ) : (
                  <button
                    onClick={() => handleOpenInquiry(listing)}
                    disabled={listing.availableQuantity <= 0}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
                  >
                    Request to Buy Lot
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Inquiry Submission Modal */}
      {inquiryListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 border border-surface-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="font-bold text-base text-navy-900">Request to Purchase Surplus Lot</h3>
                <p className="text-xs text-navy-500">{inquiryListing.sellerBusinessName}</p>
              </div>
              <button onClick={() => setInquiryListing(null)} className="text-navy-400 hover:text-navy-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-bold">
                {inquirySuccess}
              </div>
            ) : (
              <form onSubmit={handleConfirmInquiry} className="space-y-4">
                <div className="bg-navy-50 p-3.5 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-sm text-navy-900">{inquiryListing.productName}</div>
                  <div className="flex justify-between pt-1">
                    <span className="text-navy-500">Asking Price:</span>
                    <span className="font-bold text-emerald-700 font-mono">₹{inquiryListing.askingPricePerUnit} / {inquiryListing.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-500">Maximum Available:</span>
                    <span className="font-bold text-navy-900 font-mono">{inquiryListing.availableQuantity} {inquiryListing.unit}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-navy-700 uppercase block mb-1">
                    Requested Quantity ({inquiryListing.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={inquiryListing.availableQuantity}
                    value={requestQty}
                    onChange={(e) => setRequestQty(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-bold font-mono rounded-xl border border-navy-200 focus:border-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-navy-500 mt-1 font-mono">
                    <span>Total Estimated Payment:</span>
                    <strong className="text-navy-900 text-sm">₹{requestQty * inquiryListing.askingPricePerUnit}</strong>
                  </div>
                </div>

                {inquiryError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                <div className="text-[11px] text-navy-500 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <strong>Trade Rule:</strong> Submitting this request does not deduct your money or inventory yet. The seller must first review and accept your request to reserve the stock.
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setInquiryListing(null)}
                    className="flex-1 py-2 text-xs font-bold rounded-xl border border-navy-200 text-navy-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-xs"
                  >
                    Submit Purchase Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
