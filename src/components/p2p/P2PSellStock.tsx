import React, { useState } from 'react';
import { MarketplaceListing, ProductCondition, UnitOfMeasure, Language } from '../../types';
import { marketplaceService } from '../../services/MarketplaceService';
import { inventoryService } from '../../services/InventoryService';
import { vendorAdapter } from '../../services/VendorAdapter';
import { 
  Tag, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign 
} from 'lucide-react';

interface P2PSellStockProps {
  currentSellerId: string;
  currentSellerName: string;
  currentSellerType: any;
  onNavigateTab: (tab: string) => void;
  language: Language;
}

export const P2PSellStock: React.FC<P2PSellStockProps> = ({
  currentSellerId,
  currentSellerName,
  currentSellerType,
  onNavigateTab,
  language,
}) => {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState<any>('Vegetables');
  const [quantity, setQuantity] = useState(10);
  const [unit, setUnit] = useState<UnitOfMeasure>('kg');
  const [askingPrice, setAskingPrice] = useState(20);
  const [originalCost, setOriginalCost] = useState(25);
  const [condition, setCondition] = useState<ProductCondition>('fresh_grade_a');
  const [pickupLocality, setPickupLocality] = useState('MVP Rythu Bazaar Shed #4');
  const [pickupTiming, setPickupTiming] = useState('Today 2:00 PM - 6:00 PM');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!productName.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    const res = marketplaceService.createListing({
      sellerBusinessId: currentSellerId,
      sellerBusinessName: currentSellerName,
      sellerType: currentSellerType,
      productId: `prod-${Date.now()}`,
      productName: productName.trim(),
      category,
      initialQuantity: Number(quantity),
      availableQuantity: Number(quantity),
      unit,
      originalCost: Number(originalCost) || undefined,
      askingPricePerUnit: Number(askingPrice),
      condition,
      expiryDate: expiryDate || undefined,
      pickupLocality: pickupLocality.trim(),
      pickupTiming: pickupTiming.trim(),
      notes: notes.trim(),
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to create listing');
      return;
    }

    setSuccessMsg(`Listing published successfully! It is now visible to nearby buyers in "Discover Nearby".`);
    setTimeout(() => {
      onNavigateTab('my-listings');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card">
        <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
          Create Hyperlocal Surplus Listing
        </h2>
        <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
          List sound excess inventory for quick same-day pickup by local street vendors or food businesses.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Product Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Farm Fresh Tomatoes (Surplus Crate)"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm"
            >
              <option value="Vegetables">Vegetables</option>
              <option value="Fruits">Fruits</option>
              <option value="Dairy">Dairy</option>
              <option value="Rice and grains">Rice and grains</option>
              <option value="Pulses">Pulses</option>
              <option value="Packaged food">Packaged food</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Quantity to List</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm"
            >
              <option value="kg">kg</option>
              <option value="pack">pack</option>
              <option value="bag">bag</option>
              <option value="litre">litre</option>
              <option value="piece">piece</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Original Wholesale Cost (₹)</label>
            <input
              type="number"
              min="1"
              value={originalCost}
              onChange={(e) => setOriginalCost(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Asking Price (₹ / unit)</label>
            <input
              type="number"
              min="1"
              required
              value={askingPrice}
              onChange={(e) => setAskingPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm font-mono font-extrabold text-emerald-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Product Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as ProductCondition)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm"
            >
              <option value="fresh_grade_a">Fresh Grade A (Sound)</option>
              <option value="ripe_immediate_use">Ripe (Immediate Consumption)</option>
              <option value="surplus_sealed_batch">Surplus Sealed Batch</option>
              <option value="near_expiry_sound">Near Expiry Sound Batch</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Expiry Date (Optional)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Pickup Locality</label>
            <input
              type="text"
              required
              placeholder="e.g. Poorna Market Gate 2"
              value={pickupLocality}
              onChange={(e) => setPickupLocality(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-navy-700 uppercase block mb-1">Pickup Timing & Notes</label>
          <input
            type="text"
            placeholder="e.g. Today between 1:00 PM and 5:00 PM before afternoon rush"
            value={pickupTiming}
            onChange={(e) => setPickupTiming(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-navy-200 text-sm"
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('discover')}
            className="px-5 py-2.5 rounded-xl border border-navy-200 text-xs font-bold text-navy-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20"
          >
            Publish Listing
          </button>
        </div>
      </form>
    </div>
  );
};
