import React, { useState } from 'react';
import { MarketplaceListing, Language } from '../../types';
import { marketplaceService } from '../../services/MarketplaceService';
import { 
  Package, 
  MapPin, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  PauseCircle, 
  XCircle, 
  Plus 
} from 'lucide-react';

interface P2PMyListingsProps {
  currentSellerId: string;
  onNavigateTab: (tab: string) => void;
  language: Language;
}

export const P2PMyListings: React.FC<P2PMyListingsProps> = ({
  currentSellerId,
  onNavigateTab,
  language,
}) => {
  const [listings, setListings] = useState<MarketplaceListing[]>(() => 
    marketplaceService.getListings().filter(l => l.sellerBusinessId === currentSellerId)
  );

  const refreshListings = () => {
    setListings(marketplaceService.getListings().filter(l => l.sellerBusinessId === currentSellerId));
  };

  const handleCancel = (id: string) => {
    const listing = marketplaceService.getListing(id);
    if (!listing) return;
    if (listing.reservedQuantity > 0) {
      alert(`Cannot cancel listing. There is currently ${listing.reservedQuantity} ${listing.unit} reserved for pending trade requests. Please resolve the inquiries first.`);
      return;
    }
    listing.status = 'cancelled';
    refreshListings();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            My Published Marketplace Listings
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Manage your active offers, track stock reserved for buyer inquiries, and monitor liquidation rates.
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('sell')}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Listing</span>
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="bg-surface-card rounded-2xl p-12 border border-surface-border text-center space-y-3">
          <Package className="w-12 h-12 text-navy-300 mx-auto" />
          <h3 className="font-bold text-base text-navy-900">No active listings created</h3>
          <p className="text-xs text-navy-500 max-w-sm mx-auto">
            You have not listed any surplus lots yet. Check "AI Surplus Suggestions" for automatic liquidation recommendations.
          </p>
          <button
            onClick={() => onNavigateTab('surplus')}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            View AI Surplus Suggestions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(l => (
            <div key={l.id} className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-navy-400">ID: {l.id}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                    l.status === 'listed' ? 'bg-emerald-100 text-emerald-800' :
                    l.status === 'reserved' ? 'bg-amber-100 text-amber-800' :
                    l.status === 'completed' ? 'bg-navy-100 text-navy-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {l.status}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-navy-900">{l.productName}</h4>
                <div className="text-lg font-extrabold text-emerald-700 font-mono mt-1">
                  ₹{l.askingPricePerUnit} <span className="text-xs text-navy-500 font-normal">/ {l.unit}</span>
                </div>

                <div className="bg-navy-50/70 p-3 rounded-xl text-xs space-y-1 my-3">
                  <div className="flex justify-between">
                    <span className="text-navy-500">Initial Listed:</span>
                    <span className="font-mono">{l.initialQuantity} {l.unit}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-navy-700">Available:</span>
                    <span className="text-emerald-700 font-mono">{l.availableQuantity} {l.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-500">Reserved for Buyers:</span>
                    <span className="text-amber-700 font-mono font-semibold">{l.reservedQuantity} {l.unit}</span>
                  </div>
                </div>

                <div className="text-[11px] text-navy-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{l.pickupLocality}</span>
                </div>
              </div>

              {l.status === 'listed' && (
                <div className="pt-2 border-t border-surface-border flex justify-end">
                  <button
                    onClick={() => handleCancel(l.id)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                  >
                    Cancel Listing
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
