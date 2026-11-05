import React, { useState } from 'react';
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  RefreshCw, 
  X, 
  Sparkles, 
  Layers, 
  Plus, 
  TrendingDown, 
  AlertTriangle, 
  Trash2,
  FileText,
  UploadCloud,
  XCircle,
  ShoppingBag
} from 'lucide-react';
import { Language, VegetableItem, DocumentExtractionResult, DocumentOperationType, ExtractedLineItem } from '../types';

interface PhotoScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyInventoryUpdates: (updates: Array<{ nameEn: string; remainingKg: number }>) => void;
  items?: VegetableItem[];
  onApplyBatchBuySell?: (
    operation: DocumentOperationType,
    lines: Array<{ nameEn: string; nameTe?: string; quantity: number; unitPrice?: number }>,
    idempotencyKey?: string
  ) => void;
  language: Language;
}

export const PhotoScanModal: React.FC<PhotoScanModalProps> = ({
  isOpen,
  onClose,
  onApplyInventoryUpdates,
  items = [],
  onApplyBatchBuySell,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'ai_bill' | 'crate_demo'>('ai_bill');
  const [operationType, setOperationType] = useState<DocumentOperationType>('BUY');

  // AI Vision Scanner State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<DocumentExtractionResult | null>(null);
  const [editableLines, setEditableLines] = useState<Array<{
    nameEn: string;
    nameTe: string;
    quantity: number;
    unitPrice: number;
    currentKg: number;
    newKgPreview: number;
    status: 'valid' | 'warning' | 'error';
    errorMsg?: string;
  }>>([]);

  // Existing Crate Simulation State (Preserved and explicitly marked DEMO)
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'crate1' | 'crate2'>('crate1');
  const [detectedItems, setDetectedItems] = useState<Array<{ nameEn: string; nameTe: string; remainingKg: number; confidence: number }>>([
    { nameEn: 'Tomato (Fresh)', nameTe: 'టమాటాలు', remainingKg: 8, confidence: 96 },
    { nameEn: 'Onion', nameTe: 'ఉల్లిపాయలు', remainingKg: 15, confidence: 94 },
    { nameEn: 'Green Chilli', nameTe: 'పచ్చిమిర్చి', remainingKg: 2, confidence: 91 },
  ]);

  const presetPhotos = [
    {
      id: 'crate1' as const,
      title: 'Poorna Market Crate Stack (Morning Batch)',
      titleTe: 'పూర్ణా మార్కెట్ క్రేట్ స్టాక్',
      items: [
        { nameEn: 'Tomato (Fresh)', nameTe: 'టమాటాలు', remainingKg: 8, confidence: 96 },
        { nameEn: 'Onion', nameTe: 'ఉల్లిపాయలు', remainingKg: 15, confidence: 94 },
        { nameEn: 'Green Chilli', nameTe: 'పచ్చిమిర్చి', remainingKg: 2, confidence: 91 },
      ],
      description: 'Morning inspection crates from MVP Rythu Bazaar vendor stall.'
    },
    {
      id: 'crate2' as const,
      title: 'MVP Rythu Bazaar Stall Crates (Grounded)',
      titleTe: 'MVP రైతు బజార్ స్టాల్ నిల్వ',
      items: [
        { nameEn: 'Brinjal', nameTe: 'వంకాయలు', remainingKg: 5, confidence: 95 },
        { nameEn: 'Ladies Finger', nameTe: 'బెండకాయలు', remainingKg: 3, confidence: 93 },
        { nameEn: 'Carrot', nameTe: 'క్యారెట్', remainingKg: 4, confidence: 90 },
      ],
      description: 'Mixed vegetable basket before morning mandi procurement trip.'
    }
  ];

  if (!isOpen) return null;

  // Handle file selection (Photo / Upload)
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setExtractionError(null);
    setExtractionResult(null);
    setEditableLines([]);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Find existing cart vegetable
  const findCartItem = (name: string): VegetableItem | undefined => {
    if (!name) return undefined;
    const lower = name.toLowerCase().trim();
    return items.find(i => 
      i.nameEn.toLowerCase() === lower || 
      (i.nameTe && i.nameTe.toLowerCase() === lower) ||
      lower.includes(i.nameEn.toLowerCase()) ||
      i.nameEn.toLowerCase().includes(lower)
    );
  };

  // Run Gemini Vision extraction
  const handleRunAiExtraction = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('language', language);

      const response = await fetch(`/api/extract-document?lang=${language}`, {
        method: 'POST',
        body: formData,
      });

      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || `Server extraction failed (${response.status})`);
      }

      const extracted: DocumentExtractionResult = resJson.data;
      setExtractionResult(extracted);

      // Map line items to vendor cart items
      const mapped = extracted.lineItems.map(line => {
        const cartItem = findCartItem(line.productName);
        const currentKg = cartItem ? cartItem.remainingKg : 0;
        let newKg = currentKg;
        let status: 'valid' | 'warning' | 'error' = line.status;
        let errorMsg = line.validationMessage;

        if (operationType === 'BUY') {
          newKg = currentKg + (line.quantity || 0);
          if (line.quantity <= 0) {
            status = 'error';
            errorMsg = 'Invalid purchase quantity';
          }
        } else {
          newKg = currentKg - (line.quantity || 0);
          if (line.quantity > currentKg) {
            status = 'error';
            errorMsg = `Cannot SELL ${line.quantity} kg: Only ${currentKg} kg in cart.`;
          } else if (line.quantity <= 0) {
            status = 'error';
            errorMsg = 'Invalid sale quantity';
          }
        }

        return {
          nameEn: line.productName,
          nameTe: cartItem?.nameTe || line.productName,
          quantity: line.quantity || 0,
          unitPrice: line.unitPrice || 0,
          currentKg,
          newKgPreview: Math.round(newKg * 100) / 100,
          status,
          errorMsg,
        };
      });

      setEditableLines(mapped);

    } catch (err: any) {
      console.error('Vendor Vision extraction error:', err);
      setExtractionError(err.message || 'Failed to extract bill. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Re-calculate vendor stock preview on row edit
  const handleUpdateLine = (index: number, field: string, val: any) => {
    setEditableLines(prev => {
      const updated = [...prev];
      const row = { ...updated[index], [field]: val };

      if (field === 'nameEn') {
        const match = findCartItem(val);
        if (match) {
          row.currentKg = match.remainingKg;
          row.nameTe = match.nameTe;
        }
      }

      const current = row.currentKg;
      const qty = parseFloat(field === 'quantity' ? val : row.quantity) || 0;

      if (operationType === 'BUY') {
        row.newKgPreview = Math.round((current + qty) * 100) / 100;
        row.status = qty <= 0 ? 'error' : 'valid';
        row.errorMsg = qty <= 0 ? 'Invalid quantity' : undefined;
      } else {
        row.newKgPreview = Math.round((current - qty) * 100) / 100;
        if (qty > current) {
          row.status = 'error';
          row.errorMsg = `Cannot SELL ${qty} kg: only ${current} kg in cart`;
        } else if (qty <= 0) {
          row.status = 'error';
          row.errorMsg = 'Invalid quantity';
        } else {
          row.status = 'valid';
          row.errorMsg = undefined;
        }
      }

      updated[index] = row;
      return updated;
    });
  };

  // Switch BUY vs SELL
  const handleToggleOperationType = (op: DocumentOperationType) => {
    setOperationType(op);
    setEditableLines(prev => prev.map(row => {
      const current = row.currentKg;
      const qty = row.quantity;
      let newKg = current;
      let status = row.status;
      let errorMsg = row.errorMsg;

      if (op === 'BUY') {
        newKg = current + qty;
        status = qty <= 0 ? 'error' : 'valid';
        errorMsg = qty <= 0 ? 'Invalid quantity' : undefined;
      } else {
        newKg = current - qty;
        if (qty > current) {
          status = 'error';
          errorMsg = `Cannot SELL: Requested (${qty} kg) exceeds cart stock (${current} kg)`;
        } else if (qty <= 0) {
          status = 'error';
          errorMsg = 'Invalid quantity';
        } else {
          status = 'valid';
          errorMsg = undefined;
        }
      }

      return {
        ...row,
        newKgPreview: Math.round(newKg * 100) / 100,
        status,
        errorMsg,
      };
    }));
  };

  // Confirm and apply updates to vendor inventory
  const handleConfirmAiBill = () => {
    if (!extractionResult || editableLines.length === 0) return;

    const hasErrors = editableLines.some(l => l.status === 'error');
    if (hasErrors) {
      alert('Please correct highlighted errors before applying stock updates.');
      return;
    }

    if (onApplyBatchBuySell) {
      onApplyBatchBuySell(
        operationType,
        editableLines.map(l => ({
          nameEn: l.nameEn,
          nameTe: l.nameTe,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        extractionResult.fingerprint
      );
    } else {
      // Fallback to legacy single updates
      const legacyUpdates = editableLines.map(l => ({
        nameEn: l.nameEn,
        remainingKg: l.newKgPreview,
      }));
      onApplyInventoryUpdates(legacyUpdates);
    }

    onClose();
  };

  // Preset Crate Scan Handler (Demo Only)
  const handleRunCrateScan = (presetId: 'crate1' | 'crate2') => {
    setSelectedPreset(presetId);
    setIsScanning(true);
    setTimeout(() => {
      const match = presetPhotos.find(p => p.id === presetId);
      if (match) {
        setDetectedItems(match.items);
      }
      setIsScanning(false);
    }, 1200);
  };

  const handleApplyCrateDemo = () => {
    onApplyInventoryUpdates(detectedItems);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-card rounded-2xl max-w-2xl w-full border border-surface-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {language === 'te' ? 'ఫోటో & బిల్లు స్కానర్ (AI Vision)' : 'Vendor AI Photo & Bill Scanner'}
              </h3>
              <p className="text-xs text-navy-300">
                {language === 'te' ? 'కూరగాయల బిల్లును స్కాన్ చేయండి లేదా క్రేట్ డెమో చూడండి' : 'Scan wholesale procurement bills with Gemini Vision or test crate demo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-navy-300 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 bg-surface-bg border-b border-surface-border flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('ai_bill')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'ai_bill'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Bill & Invoice Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('crate_demo')}
            className={`flex items-center gap-1.5 px-4 py-2 border-b-2 text-xs font-bold transition-all ${
              activeTab === 'crate_demo'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg'
                : 'border-transparent text-navy-500 hover:text-navy-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-navy-500" />
            <span>Crate Vision (DEMO ONLY)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: Real AI Vision Bill Scanner */}
          {activeTab === 'ai_bill' && (
            <div className="space-y-5">
              {/* Operation Mode Selector: BUY vs SELL */}
              <div>
                <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-1.5">
                  1. Select Cart Operation:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleOperationType('BUY')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      operationType === 'BUY'
                        ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-navy-200 bg-white hover:bg-navy-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${operationType === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-navy-100 text-navy-600'}`}>
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-navy-900">BUY (+) Mandi Purchase</div>
                      <div className="text-[10px] text-navy-500">Adds purchased stock to cart</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleOperationType('SELL')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      operationType === 'SELL'
                        ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20'
                        : 'border-navy-200 bg-white hover:bg-navy-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${operationType === 'SELL' ? 'bg-amber-600 text-white' : 'bg-navy-100 text-navy-600'}`}>
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-navy-900">SELL (−) Customer Sale</div>
                      <div className="text-[10px] text-navy-500">Deducts stock; enforces non-negative</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Document Capture & Upload */}
              <div>
                <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-1.5">
                  2. Capture or Upload Bill:
                </label>

                <div className="border-2 border-dashed border-navy-200 hover:border-emerald-500 rounded-2xl p-5 text-center space-y-3 bg-navy-50/20 transition-colors">
                  <input
                    id="vendor-camera-input"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <input
                    id="vendor-file-input"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <label
                      htmlFor="vendor-camera-input"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold cursor-pointer shadow-sm"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>Take Photo</span>
                    </label>

                    <label
                      htmlFor="vendor-file-input"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-navy-800 border border-navy-300 hover:border-emerald-500 text-xs font-bold cursor-pointer shadow-xs"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-600" />
                      <span>Upload Bill</span>
                    </label>
                  </div>

                  {selectedFile ? (
                    <div className="bg-white p-3 rounded-xl border border-emerald-300 max-w-sm mx-auto text-left shadow-xs flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {filePreview ? (
                          <img src={filePreview} alt="Bill Preview" className="w-10 h-10 object-cover rounded-md border" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-navy-100 flex items-center justify-center font-bold text-xs uppercase">
                            {selectedFile.name.split('.').pop()}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <div className="font-bold text-xs text-navy-900 truncate">{selectedFile.name}</div>
                          <div className="text-[10px] text-navy-500">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedFile(null); setFilePreview(null); setExtractionResult(null); }}
                        className="text-navy-400 hover:text-rose-600 p-1"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-navy-500">
                      Snap handwritten or printed bills from Poorna Market or Rythu Bazaar wholesalers.
                    </p>
                  )}

                  {selectedFile && !extractionResult && (
                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={handleRunAiExtraction}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all mx-auto"
                    >
                      {isExtracting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Extracting with Gemini Vision...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Extract Products with Gemini Vision</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {extractionError && (
                  <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Extraction Error: </span>
                      <span>{extractionError}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Bill Review Table */}
              {extractionResult && (
                <div className="border border-surface-border rounded-xl bg-white overflow-hidden space-y-3 animate-fadeIn">
                  <div className="bg-navy-50 p-3 flex flex-wrap items-center justify-between gap-2 border-b border-surface-border text-xs">
                    <div>
                      <span className="font-extrabold text-navy-900">{extractionResult.supplierName || 'Wholesale Bill'}</span>
                      <span className="text-navy-500 ml-2">#{extractionResult.invoiceNumber || 'N/A'}</span>
                    </div>
                    <div className="font-bold text-navy-800">
                      Total: ₹{extractionResult.grandTotal || 0}
                    </div>
                  </div>

                  {/* Warning Messages */}
                  {extractionResult.warnings.length > 0 && (
                    <div className="px-3 py-1.5 bg-amber-50 text-[11px] text-amber-800 border-b border-amber-200">
                      <strong>Check: </strong> {extractionResult.warnings.join(' • ')}
                    </div>
                  )}

                  {/* Line Items */}
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-navy-600 uppercase border-b pb-1">
                      <div className="col-span-4">Vegetable</div>
                      <div className="col-span-2 text-right">Qty (kg)</div>
                      <div className="col-span-2 text-right">Price (₹)</div>
                      <div className="col-span-3 text-right">New Stock</div>
                      <div className="col-span-1 text-center">✕</div>
                    </div>

                    {editableLines.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs py-1">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={row.nameEn}
                            onChange={(e) => handleUpdateLine(idx, 'nameEn', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-navy-200 rounded font-semibold text-navy-900 focus:border-emerald-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0.1"
                            step="0.5"
                            value={row.quantity}
                            onChange={(e) => handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 text-xs text-right border border-navy-200 rounded font-bold text-navy-900 focus:border-emerald-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={row.unitPrice}
                            onChange={(e) => handleUpdateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 text-xs text-right border border-navy-200 rounded text-navy-700 focus:border-emerald-500"
                          />
                        </div>
                        <div className="col-span-3 text-right">
                          <span className={`font-mono font-bold ${
                            row.status === 'error' 
                              ? 'text-rose-700' 
                              : operationType === 'BUY' 
                              ? 'text-emerald-700' 
                              : 'text-amber-700'
                          }`}>
                            {operationType === 'BUY' ? `+${row.quantity}` : `-${row.quantity}`} → {row.newKgPreview} kg
                          </span>
                          {row.errorMsg && (
                            <div className="text-[10px] text-rose-600 truncate">{row.errorMsg}</div>
                          )}
                        </div>
                        <div className="col-span-1 text-center">
                          <button
                            type="button"
                            onClick={() => setEditableLines(prev => prev.filter((_, i) => i !== idx))}
                            className="text-navy-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Crate Simulation (DEMO ONLY) */}
          {activeTab === 'crate_demo' && (
            <div className="space-y-4">
              {/* Disclaimer Notice */}
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Synthetic Demonstration Notice: </span>
                  Visual crate weight scanning is an interactive demonstration. Vegetable weights cannot be certified solely by RGB photography without a calibrated physical scale.
                </div>
              </div>

              {/* Preset Selector */}
              <div>
                <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
                  Select Vizag Mandi Crate Photo to scan (DEMO):
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {presetPhotos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleRunCrateScan(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPreset === p.id
                          ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                          : 'border-navy-200 hover:border-navy-400 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-navy-900">{language === 'te' ? p.titleTe : p.title}</span>
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <p className="text-[11px] text-navy-500 line-clamp-1">{p.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Viewfinder */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-emerald-400 bg-navy-950 h-52 flex items-center justify-center text-white">
                <div className="absolute inset-0 bg-gradient-to-tr from-navy-900 via-navy-950 to-slate-900 opacity-90"></div>

                <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
                  <div className="flex justify-between items-start">
                    <span className="bg-emerald-500/80 text-white font-mono text-[10px] px-2 py-0.5 rounded tracking-wide">
                      DEMO CRATE FEED • VISAKHAPATNAM
                    </span>
                    <span className="bg-navy-900/90 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/40">
                      {isScanning ? 'SCANNING CRATE...' : 'OBJECTS DETECTED: 3'}
                    </span>
                  </div>

                  {!isScanning && (
                    <div className="grid grid-cols-3 gap-2 h-24 my-auto">
                      {detectedItems.map((item, idx) => (
                        <div key={idx} className="relative border-2 border-emerald-400 bg-emerald-500/15 rounded-lg flex flex-col justify-between p-1.5 backdrop-blur-2xs animate-fadeIn">
                          <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded w-fit">
                            {item.nameEn} ({item.confidence}%)
                          </span>
                          <span className="text-xs font-extrabold text-emerald-200">
                            ~{item.remainingKg} kg
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#008F80] animate-bounce"></div>
                  )}

                  <div className="flex justify-between items-end text-[10px] text-navy-400 font-mono">
                    <span>STALL: POORNA MKT #42</span>
                    <span>VOLUMETRIC DEMO ENGINE</span>
                  </div>
                </div>

                {isScanning && (
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                    <span className="text-xs font-semibold text-emerald-200">
                      {language === 'te' ? 'క్రేట్ పరిమాణం విశ్లేషిస్తోంది...' : 'Calculating crate vegetable weights...'}
                    </span>
                  </div>
                )}
              </div>

              {!isScanning && (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3">
                  <div className="grid grid-cols-3 gap-2">
                    {detectedItems.map((item, idx) => (
                      <div key={idx} className="bg-white p-2 rounded-lg border border-emerald-200 text-center shadow-xs">
                        <div className="text-xs font-bold text-navy-900">{item.nameEn}</div>
                        <div className="text-[11px] text-navy-500">{item.nameTe}</div>
                        <div className="text-sm font-extrabold text-emerald-700 mt-0.5">{item.remainingKg} kg</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-surface-bg px-6 py-4 border-t border-surface-border flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-navy-600 hover:text-navy-900"
          >
            {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
          </button>

          {activeTab === 'ai_bill' ? (
            <button
              type="button"
              disabled={!extractionResult || editableLines.length === 0 || editableLines.some(l => l.status === 'error')}
              onClick={handleConfirmAiBill}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply to Cart ({operationType})</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isScanning}
              onClick={handleApplyCrateDemo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Demo Weights</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
