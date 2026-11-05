import React, { useState } from 'react';
import { InventoryItem, ProductCategory, UnitOfMeasure, StorageCategory, Language } from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';

interface SupermarketInventoryProps {
  businessId: string;
  language: Language;
}

export const SupermarketInventory: React.FC<SupermarketInventoryProps> = ({
  businessId,
  language,
}) => {
  const [items, setItems] = useState<InventoryItem[]>(() => inventoryService.getInventory(businessId));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterAlertOnly, setFilterAlertOnly] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjustmentError, setAdjustmentError] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // New item form state
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    nameEn: '',
    sku: '',
    category: 'Vegetables',
    unit: 'kg',
    packSize: 1,
    purchaseCost: 20,
    sellingPrice: 30,
    reorderThreshold: 20,
    safetyStock: 10,
    storageCategory: 'dry_pantry',
    stock: {
      physicalStock: 50,
      reservedStock: 0,
      availableStock: 50,
      incomingStock: 0,
      damagedStock: 0,
      expiredStock: 0,
    }
  });

  const refreshItems = () => {
    setItems([...inventoryService.getInventory(businessId)]);
  };

  const categories: Array<ProductCategory | 'ALL'> = [
    'ALL',
    'Vegetables',
    'Fruits',
    'Rice and grains',
    'Pulses',
    'Dairy',
    'Packaged food',
    'Beverages',
    'Household products'
  ];

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesQuery = item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesAlert = !filterAlertOnly || (item.status === 'low_stock' || item.status === 'near_expiry' || item.status === 'out_of_stock');
    return matchesQuery && matchesCategory && matchesAlert;
  });

  // Handle stock adjustment
  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || adjustmentDelta === 0) return;
    setAdjustmentError('');

    const res = inventoryService.adjustStock(
      businessId,
      adjustingItem.id,
      adjustmentDelta,
      adjustmentDelta > 0 ? 'supplier_receipt' : 'sale',
      adjustmentReason.trim() || 'Manual stock count adjustment'
    );

    if (!res.success) {
      setAdjustmentError(res.error || 'Failed to adjust stock');
      return;
    }

    setAdjustingItem(null);
    setAdjustmentDelta(0);
    setAdjustmentReason('');
    refreshItems();
  };

  // Handle Save New Item
  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.nameEn || !newItem.sku) return;

    const itemToSave: InventoryItem = {
      id: `sm-item-${Date.now()}`,
      sku: newItem.sku.trim().toUpperCase(),
      nameEn: newItem.nameEn.trim(),
      nameTe: newItem.nameTe?.trim(),
      brand: newItem.brand?.trim(),
      barcode: newItem.barcode?.trim(),
      category: newItem.category as ProductCategory || 'Vegetables',
      unit: newItem.unit as UnitOfMeasure || 'kg',
      packSize: Number(newItem.packSize) || 1,
      isPerishable: newItem.category === 'Vegetables' || newItem.category === 'Fruits' || newItem.category === 'Dairy',
      typicalShelfLifeDays: Number(newItem.typicalShelfLifeDays) || 7,
      businessId,
      stock: {
        physicalStock: Number(newItem.stock?.physicalStock) || 0,
        reservedStock: 0,
        availableStock: Number(newItem.stock?.physicalStock) || 0,
        incomingStock: 0,
        damagedStock: 0,
        expiredStock: 0,
      },
      reorderThreshold: Number(newItem.reorderThreshold) || 10,
      safetyStock: Number(newItem.safetyStock) || 5,
      purchaseCost: Number(newItem.purchaseCost) || 10,
      sellingPrice: Number(newItem.sellingPrice) || 15,
      storageCategory: newItem.storageCategory as StorageCategory || 'dry_pantry',
      batchNumber: newItem.batchNumber?.trim(),
      expiryDate: newItem.expiryDate,
      lastCountedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: (Number(newItem.stock?.physicalStock) || 0) <= (Number(newItem.reorderThreshold) || 10) ? 'low_stock' : 'in_stock',
    };

    inventoryService.saveItem(businessId, itemToSave);
    setShowAddModal(false);
    refreshItems();
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Delete this product from supermarket inventory?')) {
      inventoryService.deleteItem(businessId, id);
      refreshItems();
    }
  };

  const movements = inventoryService.getMovements(businessId);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Supermarket Inventory Management
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Real-time multi-category tracking, stock movements audit, and non-negative stock enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-700 border border-navy-200 font-semibold text-xs transition-colors"
          >
            <History className="w-4 h-4 text-navy-600" />
            <span>Audit History ({movements.length})</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-navy-200 focus:border-emerald-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-navy-200 text-xs font-semibold bg-white text-navy-800 focus:border-emerald-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => setFilterAlertOnly(!filterAlertOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              filterAlertOnly 
                ? 'bg-rose-50 border-rose-300 text-rose-700 ring-1 ring-rose-300' 
                : 'bg-white border-navy-200 text-navy-700 hover:bg-navy-50'
            }`}
          >
            Alerts Only ({items.filter(i => i.status !== 'in_stock').length})
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-navy-50/80 text-navy-700 font-bold uppercase tracking-wider text-[11px] border-b border-surface-border">
                <th className="py-3 px-4">SKU / Product</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Physical Stock</th>
                <th className="py-3 px-3">Reserved</th>
                <th className="py-3 px-3">Available</th>
                <th className="py-3 px-3">Cost / Retail</th>
                <th className="py-3 px-3">Expiry</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-navy-50/40 transition-colors">
                  {/* Name and SKU */}
                  <td className="py-3 px-4 font-bold text-navy-900">
                    <div>
                      <span>{item.nameEn}</span>
                      <div className="text-[11px] text-navy-400 font-mono font-normal">
                        {item.sku} {item.brand ? `• ${item.brand}` : ''}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3 text-navy-600 font-medium whitespace-nowrap">
                    {item.category}
                  </td>

                  {/* Physical Stock */}
                  <td className="py-3 px-3 font-mono font-bold text-navy-900">
                    {item.stock.physicalStock} {item.unit}
                  </td>

                  {/* Reserved */}
                  <td className="py-3 px-3 font-mono text-amber-700 font-semibold">
                    {item.stock.reservedStock > 0 ? `${item.stock.reservedStock} ${item.unit}` : '-'}
                  </td>

                  {/* Available */}
                  <td className="py-3 px-3 font-mono font-extrabold text-emerald-700">
                    {item.stock.availableStock} {item.unit}
                  </td>

                  {/* Cost / Retail */}
                  <td className="py-3 px-3 font-mono text-navy-700 whitespace-nowrap">
                    ₹{item.purchaseCost} / <strong className="text-navy-900">₹{item.sellingPrice}</strong>
                  </td>

                  {/* Expiry */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {item.expiryDate ? (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        item.status === 'near_expiry' ? 'bg-rose-100 text-rose-800' : 'text-navy-600'
                      }`}>
                        {item.expiryDate}
                      </span>
                    ) : (
                      <span className="text-[11px] text-navy-400">Non-perishable</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {item.status === 'in_stock' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        IN STOCK
                      </span>
                    )}
                    {item.status === 'low_stock' && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        LOW STOCK
                      </span>
                    )}
                    {item.status === 'near_expiry' && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        NEAR EXPIRY
                      </span>
                    )}
                    {item.status === 'out_of_stock' && (
                      <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                        OUT OF STOCK
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        setAdjustingItem(item);
                        setAdjustmentDelta(0);
                        setAdjustmentReason('');
                        setAdjustmentError('');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-navy-50 hover:bg-navy-100 text-navy-800 font-semibold text-xs border border-navy-200 mr-1.5"
                    >
                      Adjust
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 rounded-lg text-navy-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete SKU"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 border border-surface-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="font-bold text-base text-navy-900">Adjust Stock Quantity</h3>
                <p className="text-xs text-navy-500">{adjustingItem.nameEn} ({adjustingItem.sku})</p>
              </div>
              <button onClick={() => setAdjustingItem(null)} className="text-navy-400 hover:text-navy-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4">
              <div className="bg-navy-50 p-3 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-navy-500">Current Physical Stock:</span>
                  <span className="font-bold text-navy-900">{adjustingItem.stock.physicalStock} {adjustingItem.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy-500">Reserved for P2P Inquiries:</span>
                  <span className="font-bold text-amber-700">{adjustingItem.stock.reservedStock} {adjustingItem.unit}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-navy-200">
                  <span className="text-navy-700 font-semibold">Available for Sale:</span>
                  <span className="font-bold text-emerald-700">{adjustingItem.stock.availableStock} {adjustingItem.unit}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 uppercase block mb-1">
                  Quantity Adjustment Delta (+ or -)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={adjustmentDelta || ''}
                  onChange={(e) => setAdjustmentDelta(Number(e.target.value))}
                  placeholder="e.g. +10 (receipt) or -5 (correction)"
                  className="w-full px-3 py-2 rounded-xl border border-navy-200 text-sm font-mono font-bold focus:border-emerald-500"
                />
                <span className="text-[11px] text-navy-400 mt-1 block">
                  New Physical Stock will be: {adjustingItem.stock.physicalStock + adjustmentDelta} {adjustingItem.unit}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-navy-700 uppercase block mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supplier delivery receipt, physical recount"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-navy-200 text-xs focus:border-emerald-500"
                />
              </div>

              {adjustmentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{adjustmentError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="flex-1 py-2 rounded-xl border border-navy-200 text-xs font-bold text-navy-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Audit History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card rounded-2xl max-w-2xl w-full p-6 border border-surface-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-navy-900">Inventory Movement Audit Trail</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-navy-400 hover:text-navy-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
              {movements.length === 0 ? (
                <p className="text-xs text-navy-500 text-center py-8">No movements recorded yet.</p>
              ) : (
                movements.map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-navy-50/60 border border-navy-100 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-navy-900 flex items-center gap-2">
                        <span>{m.productName}</span>
                        <span className="text-[10px] bg-navy-200 text-navy-800 font-mono px-1.5 rounded uppercase">
                          {m.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-navy-500 mt-0.5">{m.reason}</p>
                      <span className="text-[10px] text-navy-400 font-mono">{m.timestamp}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-mono font-extrabold ${m.quantityChange > 0 ? 'text-emerald-700' : m.quantityChange < 0 ? 'text-rose-700' : 'text-navy-700'}`}>
                        {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} {m.unit}
                      </span>
                      <div className="text-[10px] text-navy-400">
                        {m.previousPhysicalStock} → {m.newPhysicalStock} {m.unit}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add SKU Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card rounded-2xl max-w-lg w-full p-6 border border-surface-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="font-bold text-base text-navy-900">Add New Supermarket SKU</h3>
              <button onClick={() => setShowAddModal(false)} className="text-navy-400 hover:text-navy-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">SKU Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GRN-BAS-01"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                  >
                    {categories.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Product Name (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice Royal Heritage"
                  value={newItem.nameEn}
                  onChange={(e) => setNewItem({ ...newItem, nameEn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Unit</label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as UnitOfMeasure })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="litre">litre</option>
                    <option value="pack">pack</option>
                    <option value="bag">bag</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Purchase Cost</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.purchaseCost}
                    onChange={(e) => setNewItem({ ...newItem, purchaseCost: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Selling Price</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.sellingPrice}
                    onChange={(e) => setNewItem({ ...newItem, sellingPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Initial Physical Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.stock?.physicalStock}
                    onChange={(e) => setNewItem({ 
                      ...newItem, 
                      stock: { ...newItem.stock!, physicalStock: Number(e.target.value), availableStock: Number(e.target.value) } 
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy-700 uppercase block mb-1">Reorder Point</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.reorderThreshold}
                    onChange={(e) => setNewItem({ ...newItem, reorderThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-navy-200"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-navy-200 text-navy-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
