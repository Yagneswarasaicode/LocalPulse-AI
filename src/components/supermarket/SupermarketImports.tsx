import React, { useState } from 'react';
import { 
  ImportDocument, 
  ImportLineItem, 
  Language, 
  DocumentOperationType,
  ExtractedLineItem,
  DocumentExtractionResult,
  UnitOfMeasure
} from '../../types';
import { inventoryService } from '../../services/InventoryService';
import { salesAnalyticsService } from '../../services/SalesAnalyticsService';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  RefreshCw, 
  FileSpreadsheet, 
  Clock, 
  Layers,
  Database,
  Camera,
  ShoppingBag,
  TrendingDown,
  Trash2,
  Plus,
  ShieldCheck,
  Sparkles,
  Edit3
} from 'lucide-react';

interface SupermarketImportsProps {
  businessId: string;
  language: Language;
}

export const SupermarketImports: React.FC<SupermarketImportsProps> = ({
  businessId,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'ai_vision' | 'csv' | 'history'>('ai_vision');
  const [operationType, setOperationType] = useState<DocumentOperationType>('BUY');
  
  // AI Vision Scanner State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<DocumentExtractionResult | null>(null);
  const [editableLines, setEditableLines] = useState<ExtractedLineItem[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  // Existing CSV State (100% Preserved)
  const [docType, setDocType] = useState<'sales_statement' | 'supplier_invoice' | 'inventory_sheet'>('sales_statement');
  const [parsedDoc, setParsedDoc] = useState<ImportDocument | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  
  // Feedback & History
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importHistory, setImportHistory] = useState<ImportDocument[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('localpulse_import_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const supermarketInventory = inventoryService.getInventory(businessId);

  const sampleCsvTemplates = {
    sales: `SKU,ProductName,Quantity,Unit,UnitPrice,Date\nVEG-TOM-01,Grade-A Fresh Hybrid Tomato,15,kg,32,2026-11-05\nDAI-MLK-01,Vijaya Toned Milk Pouch,20,pack,30,2026-11-05\nPKG-OIL-01,Freedom Refined Sunflower Oil,8,pack,140,2026-11-05\nUNKNOWN-01,Organic Quinoa Grain,5,kg,180,2026-11-05`,
    invoice: `SKU,ProductName,Quantity,Unit,UnitPrice,Date\nVEG-TOM-01,Grade-A Fresh Hybrid Tomato,40,kg,22,2026-11-05\nGRN-RIC-01,BPT 5204 Sona Masoori Raw Rice,10,bag,1450,2026-11-05\nPKG-OIL-01,Freedom Refined Sunflower Oil,24,pack,122,2026-11-05`,
    reconcile: `SKU,ProductName,PhysicalCount,Unit,Note\nVEG-TOM-01,Grade-A Fresh Hybrid Tomato,60,kg,Morning physical audit\nVEG-ONI-02,Nasik Red Onion,118,kg,2kg shrinkage variance\nDAI-MLK-01,Vijaya Toned Milk Pouch,42,pack,Count verified`
  };

  // Match product name against existing store inventory
  const matchProductToInventory = (name: string): { sku: string; item: any } | null => {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    // 1. Exact match on English or Telugu name
    const exact = supermarketInventory.find(i => 
      i.nameEn.toLowerCase() === lower || 
      (i.nameTe && i.nameTe.toLowerCase() === lower) ||
      i.sku.toLowerCase() === lower
    );
    if (exact) return { sku: exact.sku, item: exact };

    // 2. Contains match
    const partial = supermarketInventory.find(i => 
      lower.includes(i.nameEn.toLowerCase()) || 
      i.nameEn.toLowerCase().includes(lower)
    );
    if (partial) return { sku: partial.sku, item: partial };

    return null;
  };

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

  // Execute Gemini Vision Extraction
  const handleExtractWithGemini = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setExtractionError(null);
    setImportSuccessMsg('');

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

      // Map line items to current stock and compute stock previews
      const mappedLines: ExtractedLineItem[] = extracted.lineItems.map(item => {
        const match = matchProductToInventory(item.productName);
        const currentStock = match?.item.stock.physicalStock || 0;
        const availableStock = match?.item.stock.availableStock || 0;
        
        let newStock = currentStock;
        let lineStatus = item.status;
        let validationMsg = item.validationMessage || '';

        if (operationType === 'BUY') {
          newStock = currentStock + (item.quantity || 0);
        } else {
          newStock = currentStock - (item.quantity || 0);
          if (item.quantity > availableStock) {
            lineStatus = 'error';
            validationMsg = `Cannot SELL: Requested (${item.quantity} ${item.unit}) exceeds available stock (${availableStock} ${item.unit}).`;
          }
        }

        return {
          ...item,
          skuMatched: match?.sku || null,
          currentStock,
          newStockPreview: newStock,
          status: lineStatus,
          validationMessage: validationMsg,
        };
      });

      setEditableLines(mappedLines);

    } catch (err: any) {
      console.error('Vision extraction error:', err);
      setExtractionError(err.message || 'Failed to extract document. Please check connection and try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Recalculate line and stock preview when user edits field
  const handleUpdateLine = (index: number, field: keyof ExtractedLineItem, value: any) => {
    setEditableLines(prev => {
      const updated = [...prev];
      const line = { ...updated[index], [field]: value };

      if (field === 'quantity' || field === 'unitPrice') {
        const q = parseFloat(field === 'quantity' ? value : line.quantity) || 0;
        const p = parseFloat(field === 'unitPrice' ? value : line.unitPrice) || 0;
        line.lineTotal = Math.round(q * p * 100) / 100;
      }

      if (field === 'productName' || field === 'skuMatched') {
        const match = field === 'skuMatched' 
          ? { sku: value, item: supermarketInventory.find(i => i.sku === value) }
          : matchProductToInventory(value);
        if (match?.item) {
          line.skuMatched = match.sku;
          line.currentStock = match.item.stock.physicalStock;
        }
      }

      // Recompute stock preview & validation status
      const current = line.currentStock || 0;
      const matchedItem = supermarketInventory.find(i => i.sku === line.skuMatched);
      const available = matchedItem ? matchedItem.stock.availableStock : current;

      if (operationType === 'BUY') {
        line.newStockPreview = current + (line.quantity || 0);
        line.status = line.quantity <= 0 ? 'error' : 'valid';
      } else {
        line.newStockPreview = current - (line.quantity || 0);
        if (line.quantity > available) {
          line.status = 'error';
          line.validationMessage = `Exceeds available stock (${available} ${line.unit})`;
        } else if (line.quantity <= 0) {
          line.status = 'error';
          line.validationMessage = 'Quantity must be greater than zero';
        } else {
          line.status = 'valid';
          line.validationMessage = 'Verified clean';
        }
      }

      updated[index] = line;
      return updated;
    });
  };

  // Switch BUY vs SELL and recompute line previews
  const handleToggleOperationType = (op: DocumentOperationType) => {
    setOperationType(op);
    setEditableLines(prev => prev.map(line => {
      const current = line.currentStock || 0;
      const matchedItem = supermarketInventory.find(i => i.sku === line.skuMatched);
      const available = matchedItem ? matchedItem.stock.availableStock : current;

      let newStock = current;
      let status = line.status;
      let validationMessage = line.validationMessage;

      if (op === 'BUY') {
        newStock = current + (line.quantity || 0);
        status = line.quantity <= 0 ? 'error' : 'valid';
        validationMessage = status === 'error' ? 'Invalid quantity' : 'Verified clean';
      } else {
        newStock = current - (line.quantity || 0);
        if (line.quantity > available) {
          status = 'error';
          validationMessage = `Cannot SELL: Requested (${line.quantity}) exceeds available stock (${available})`;
        } else if (line.quantity <= 0) {
          status = 'error';
          validationMessage = 'Invalid quantity';
        } else {
          status = 'valid';
          validationMessage = 'Verified clean';
        }
      }

      return {
        ...line,
        newStockPreview: newStock,
        status,
        validationMessage,
      };
    }));
  };

  // Confirm and Apply Document Updates Atomically
  const handleConfirmAiDocument = () => {
    if (!extractionResult || editableLines.length === 0) return;

    // Check for blocking errors
    const hasErrors = editableLines.some(l => l.status === 'error');
    if (hasErrors) {
      alert('Please resolve all highlighted errors before applying inventory updates.');
      return;
    }

    setIsApplying(true);

    const adjustments = editableLines.map(line => {
      const delta = operationType === 'BUY' ? line.quantity : -line.quantity;
      const movType = operationType === 'BUY' ? 'PURCHASE_IN' : 'SALE_OUT';
      const reason = operationType === 'BUY' 
        ? `AI Invoice Receipt #${extractionResult.invoiceNumber || 'INV'} from ${extractionResult.supplierName || 'Supplier'}`
        : `AI Bill Sale #${extractionResult.invoiceNumber || 'BILL'} to ${extractionResult.buyerName || 'Customer'}`;

      return {
        productId: line.skuMatched || line.productName,
        productName: line.productName,
        delta,
        type: movType as any,
        unitCost: operationType === 'BUY' ? line.unitPrice : undefined,
        sellingPrice: operationType === 'SELL' ? line.unitPrice : undefined,
        reason,
        referenceId: extractionResult.invoiceNumber || extractionResult.fingerprint,
      };
    });

    const result = inventoryService.applyBatchAdjustment(
      businessId,
      adjustments,
      extractionResult.fingerprint
    );

    setIsApplying(false);

    if (!result.success) {
      alert(`Import Failed: ${result.error}`);
      return;
    }

    // Record in history audit
    const completedDoc: ImportDocument = {
      id: `imp-${Date.now()}`,
      businessId,
      fileName: selectedFile?.name || 'scanned_invoice.png',
      fileType: operationType === 'BUY' ? 'supplier_invoice' : 'sales_statement',
      sourceFormat: selectedFile?.type === 'application/pdf' ? 'pdf' : 'image',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'applied',
      totalLines: editableLines.length,
      validLines: editableLines.length,
      totalAmount: editableLines.reduce((sum, l) => sum + l.lineTotal, 0),
      extractedRecords: editableLines.map(l => ({
        skuMatched: l.skuMatched || undefined,
        productName: l.productName,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        totalAmount: l.lineTotal,
        status: 'valid',
      })),
      appliedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      auditNote: `Applied ${editableLines.length} items via AI Vision (${operationType}). Ref: ${extractionResult.invoiceNumber || 'N/A'}.`,
    };

    const newHistory = [completedDoc, ...importHistory];
    setImportHistory(newHistory);
    try {
      localStorage.setItem('localpulse_import_history_v1', JSON.stringify(newHistory));
    } catch (e) {
      console.warn(e);
    }

    setImportSuccessMsg(
      `Successfully applied ${editableLines.length} items to inventory via ${operationType} operation! (${result.movements?.length || 0} movements audited)`
    );

    // Reset current form
    setSelectedFile(null);
    setFilePreview(null);
    setExtractionResult(null);
    setEditableLines([]);
  };

  // CSV Parsing Logic (100% Preserved)
  const handleParseCsvText = (csvContent: string, fileName: string) => {
    setIsParsing(true);
    setImportSuccessMsg('');

    setTimeout(() => {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        setIsParsing(false);
        return;
      }

      const existingInventory = inventoryService.getInventory(businessId);
      const lineItems: ImportLineItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(r => r.trim());
        if (row.length < 3) continue;

        const sku = row[0] || '';
        const name = row[1] || '';
        const qty = parseFloat(row[2]) || 0;
        const unit = (row[3] || 'kg') as any;
        const price = parseFloat(row[4]) || 0;
        const date = row[5] || new Date().toISOString().substring(0, 10);

        const matchedItem = existingInventory.find(item => 
          item.sku.toLowerCase() === sku.toLowerCase() || 
          item.nameEn.toLowerCase() === name.toLowerCase()
        );

        let status: 'valid' | 'warning' | 'error' = 'valid';
        let validationMessage = '';

        if (!matchedItem) {
          status = 'warning';
          validationMessage = `Unknown SKU "${sku}". Will create new inventory entry upon import.`;
        } else if (matchedItem.unit !== unit) {
          status = 'warning';
          validationMessage = `Unit mismatch: Document has "${unit}", database has "${matchedItem.unit}".`;
        } else if (price === 0 && docType !== 'inventory_sheet') {
          status = 'error';
          validationMessage = 'Missing unit price.';
        }

        lineItems.push({
          rawText: lines[i],
          skuMatched: matchedItem ? matchedItem.sku : sku,
          productName: name || (matchedItem ? matchedItem.nameEn : 'Unknown'),
          quantity: qty,
          unit,
          unitPrice: price,
          totalAmount: qty * price,
          date,
          status,
          validationMessage,
        });
      }

      const totalAmount = lineItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const validCount = lineItems.filter(l => l.status === 'valid').length;

      const newDoc: ImportDocument = {
        id: `imp-${Date.now()}`,
        businessId,
        fileName,
        fileType: docType,
        sourceFormat: 'csv',
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'validated',
        totalLines: lineItems.length,
        validLines: validCount,
        totalAmount,
        extractedRecords: lineItems,
      };

      setParsedDoc(newDoc);
      setIsParsing(false);
    }, 500);
  };

  const handleApplyCsvDocument = () => {
    if (!parsedDoc) return;

    if (parsedDoc.fileType === 'sales_statement') {
      const salesToRecord = parsedDoc.extractedRecords.map(line => ({
        id: `sale-imp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        businessId,
        productId: line.skuMatched || 'unknown',
        productName: line.productName,
        category: 'Vegetables' as any,
        quantitySold: line.quantity,
        unit: line.unit,
        unitPrice: line.unitPrice || 0,
        totalRevenue: line.totalAmount || 0,
        grossMarginAmount: Math.round((line.totalAmount || 0) * 0.25),
        timestamp: `${line.date || '2026-11-05'} 18:00`,
        importBatchId: parsedDoc.id,
      }));

      salesAnalyticsService.recordBatchSales(salesToRecord);

      for (const line of parsedDoc.extractedRecords) {
        inventoryService.adjustStock(
          businessId,
          line.skuMatched || line.productName,
          -line.quantity,
          'sale',
          `Imported Sales Statement #${parsedDoc.id}`,
          parsedDoc.id
        );
      }
    } else if (parsedDoc.fileType === 'supplier_invoice') {
      for (const line of parsedDoc.extractedRecords) {
        inventoryService.adjustStock(
          businessId,
          line.skuMatched || line.productName,
          line.quantity,
          'supplier_receipt',
          `Supplier Invoice Receipt #${parsedDoc.id}`,
          parsedDoc.id
        );
      }
    } else if (parsedDoc.fileType === 'inventory_sheet') {
      for (const line of parsedDoc.extractedRecords) {
        const item = inventoryService.getItem(businessId, line.skuMatched || line.productName);
        if (item) {
          const delta = line.quantity - item.stock.physicalStock;
          if (delta !== 0) {
            inventoryService.adjustStock(
              businessId,
              item.id,
              delta,
              'inventory_count',
              `Stocktake Reconciliation #${parsedDoc.id}`,
              parsedDoc.id
            );
          }
        }
      }
    }

    const completedDoc: ImportDocument = {
      ...parsedDoc,
      status: 'applied',
      appliedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      auditNote: `Applied ${parsedDoc.extractedRecords.length} records to ${parsedDoc.fileType}.`,
    };

    const newHistory = [completedDoc, ...importHistory];
    setImportHistory(newHistory);
    try {
      localStorage.setItem('localpulse_import_history_v1', JSON.stringify(newHistory));
    } catch (e) {
      console.warn(e);
    }

    setImportSuccessMsg(`Successfully imported and applied ${parsedDoc.extractedRecords.length} items from ${parsedDoc.fileName}!`);
    setParsedDoc(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Stage 2.5 • AI Vision & Document Intake
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Document & Invoice Scanner
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Extract handwritten or printed bills with Gemini Vision, verify quantities, and atomically update BUY/SELL stock.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-navy-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('ai_vision')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'ai_vision' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600 hover:text-navy-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Bill Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'csv' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600 hover:text-navy-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-navy-600" />
            <span>CSV Import</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600 hover:text-navy-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-navy-500" />
            <span>Audit History ({importHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
          <button onClick={() => setImportSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: AI Vision Scanner */}
      {activeTab === 'ai_vision' && (
        <div className="space-y-6">
          {/* Operation Selector: BUY vs SELL */}
          <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-4">
            <div>
              <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
                1. Select Inventory Movement Intent:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                <button
                  type="button"
                  onClick={() => handleToggleOperationType('BUY')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    operationType === 'BUY'
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-navy-200 bg-white hover:bg-navy-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${operationType === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-navy-100 text-navy-600'}`}>
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-navy-900">BUY (+) Supplier Purchase</div>
                    <p className="text-xs text-navy-500 mt-0.5">Increases stock from wholesale receipts & mandi invoices</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleOperationType('SELL')}
                  className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    operationType === 'SELL'
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-navy-200 bg-white hover:bg-navy-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${operationType === 'SELL' ? 'bg-amber-600 text-white' : 'bg-navy-100 text-navy-600'}`}>
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-navy-900">SELL (−) Customer Bill</div>
                    <p className="text-xs text-navy-500 mt-0.5">Deducts sold stock safely; blocks negative inventory</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Document Upload & Camera Trigger */}
            <div>
              <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
                2. Capture or Upload Invoice (JPG, PNG, PDF):
              </label>

              <div className="border-2 border-dashed border-navy-200 hover:border-emerald-500 rounded-2xl p-6 text-center space-y-4 bg-navy-50/20 transition-colors">
                <input
                  id="camera-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <input
                  id="file-upload-input"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label
                    htmlFor="camera-upload-input"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white text-xs sm:text-sm font-bold cursor-pointer shadow-sm transition-all"
                  >
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span>Take Photo (Camera)</span>
                  </label>

                  <label
                    htmlFor="file-upload-input"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-navy-800 border border-navy-300 hover:border-emerald-500 text-xs sm:text-sm font-bold cursor-pointer shadow-xs transition-all"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span>Browse File (PNG / JPG / PDF)</span>
                  </label>
                </div>

                {/* Selected File Details */}
                {selectedFile ? (
                  <div className="bg-white p-4 rounded-xl border border-emerald-300 max-w-md mx-auto text-left shadow-xs flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-navy-200" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-xs uppercase">
                          {selectedFile.name.split('.').pop()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="font-bold text-xs sm:text-sm text-navy-900 truncate">{selectedFile.name}</div>
                        <div className="text-[11px] text-navy-500 font-mono">
                          {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); setFilePreview(null); setExtractionResult(null); }}
                      className="text-navy-400 hover:text-rose-600 p-1"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-navy-500">
                    Supports high-resolution camera photos, scanned receipts, and invoices up to 10 MB (max 5 pages for PDF).
                  </p>
                )}

                {/* Scan Action Button */}
                {selectedFile && !extractionResult && (
                  <div>
                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={handleExtractWithGemini}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all mx-auto"
                    >
                      {isExtracting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Extracting with Gemini Vision...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Extract Invoice with Gemini Vision</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {extractionError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs sm:text-sm text-rose-800 font-semibold flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Extraction Issue:</div>
                  <p className="mt-0.5 text-xs text-rose-700">{extractionError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Document Summary & Editable Preview Table */}
          {extractionResult && (
            <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden space-y-4 animate-fadeIn">
              {/* Document Metadata Banner */}
              <div className="p-5 bg-navy-50/60 border-b border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-navy-900">
                      {extractionResult.supplierName || 'Unknown Supplier'}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                      {extractionResult.documentType.replace('_', ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      operationType === 'BUY' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {operationType} MODE
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-navy-600 mt-1 font-medium">
                    <span><strong>Bill #:</strong> {extractionResult.invoiceNumber || 'N/A'}</span>
                    <span><strong>Date:</strong> {extractionResult.invoiceDate || 'N/A'}</span>
                    <span><strong>Buyer:</strong> {extractionResult.buyerName || 'N/A'}</span>
                    <span><strong>Language:</strong> {extractionResult.sourceLanguage.toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setExtractionResult(null); setEditableLines([]); }}
                    className="px-3.5 py-2 rounded-xl border border-navy-200 text-xs font-bold text-navy-700 hover:bg-navy-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    disabled={isApplying || editableLines.some(l => l.status === 'error')}
                    onClick={handleConfirmAiDocument}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
                  >
                    {isApplying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Apply ({operationType})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Warnings List */}
              {extractionResult.warnings.length > 0 && (
                <div className="px-5 py-3 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Audit Discrepancies & Warnings ({extractionResult.warnings.length}):</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-800">
                    {extractionResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Editable Line Items Table */}
              <div className="overflow-x-auto px-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-navy-50 text-navy-700 font-bold uppercase text-[11px] border-b border-surface-border">
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2 min-w-[160px]">Product Name</th>
                      <th className="py-2.5 px-2 min-w-[140px]">Matched Store SKU</th>
                      <th className="py-2.5 px-2 text-right">Current Stock</th>
                      <th className="py-2.5 px-2 text-right">Qty</th>
                      <th className="py-2.5 px-2">Unit</th>
                      <th className="py-2.5 px-2 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-2 text-right">Total (₹)</th>
                      <th className="py-2.5 px-3 min-w-[130px]">New Stock Preview</th>
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {editableLines.map((line, idx) => (
                      <tr key={idx} className={line.status === 'error' ? 'bg-rose-50/40' : 'hover:bg-navy-50/40'}>
                        {/* Status */}
                        <td className="py-2 px-2">
                          {line.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </span>
                          )}
                          {line.status === 'warning' && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[10px]" title={line.validationMessage}>
                              <AlertTriangle className="w-3 h-3" /> Check
                            </span>
                          )}
                          {line.status === 'error' && (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[10px]" title={line.validationMessage}>
                              <XCircle className="w-3 h-3" /> Error
                            </span>
                          )}
                        </td>

                        {/* Product Name (Editable) */}
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={line.productName}
                            onChange={(e) => handleUpdateLine(idx, 'productName', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-navy-200 rounded font-semibold text-navy-900 focus:border-emerald-500"
                          />
                        </td>

                        {/* Matched Store SKU (Dropdown) */}
                        <td className="py-2 px-2">
                          <select
                            value={line.skuMatched || ''}
                            onChange={(e) => handleUpdateLine(idx, 'skuMatched', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-navy-200 rounded font-mono text-navy-900 focus:border-emerald-500"
                          >
                            <option value="">-- Select SKU --</option>
                            {supermarketInventory.map(item => (
                              <option key={item.sku} value={item.sku}>
                                {item.sku} ({item.nameEn})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Current Stock */}
                        <td className="py-2 px-2 text-right font-mono text-navy-600">
                          {line.currentStock || 0} {line.unit}
                        </td>

                        {/* Quantity (Editable) */}
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0.1"
                            step="0.5"
                            value={line.quantity}
                            onChange={(e) => handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-xs text-right border border-navy-200 rounded font-bold text-navy-900 focus:border-emerald-500"
                          />
                        </td>

                        {/* Unit (Editable) */}
                        <td className="py-2 px-2">
                          <select
                            value={line.unit}
                            onChange={(e) => handleUpdateLine(idx, 'unit', e.target.value)}
                            className="px-1.5 py-1 text-xs border border-navy-200 rounded text-navy-800"
                          >
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="litre">litre</option>
                            <option value="pack">pack</option>
                            <option value="bag">bag</option>
                            <option value="piece">piece</option>
                            <option value="crate">crate</option>
                          </select>
                        </td>

                        {/* Unit Price (Editable) */}
                        <td className="py-2 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={line.unitPrice}
                            onChange={(e) => handleUpdateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-xs text-right border border-navy-200 rounded font-mono text-navy-900 focus:border-emerald-500"
                          />
                        </td>

                        {/* Line Total */}
                        <td className="py-2 px-2 text-right font-mono font-bold text-navy-900">
                          ₹{line.lineTotal}
                        </td>

                        {/* Stock Preview */}
                        <td className="py-2 px-3">
                          <div className={`font-mono text-xs font-bold ${
                            line.status === 'error' 
                              ? 'text-rose-700' 
                              : operationType === 'BUY' 
                              ? 'text-emerald-700' 
                              : 'text-amber-700'
                          }`}>
                            {operationType === 'BUY' ? `+${line.quantity}` : `-${line.quantity}`} → {line.newStockPreview} {line.unit}
                          </div>
                          {line.validationMessage && line.validationMessage !== 'Verified clean' && (
                            <div className="text-[10px] text-rose-600 leading-tight mt-0.5">{line.validationMessage}</div>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setEditableLines(prev => prev.filter((_, i) => i !== idx))}
                            className="text-navy-400 hover:text-rose-600 p-1 rounded"
                            title="Remove line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Footer */}
              <div className="p-4 bg-navy-50/80 border-t border-surface-border flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4 text-navy-700">
                  <span><strong>Total Items:</strong> {editableLines.length}</span>
                  <span><strong>Subtotal:</strong> ₹{editableLines.reduce((s, l) => s + l.lineTotal, 0).toLocaleString('en-IN')}</span>
                  {extractionResult.taxAmount ? <span><strong>Tax / GST:</strong> ₹{extractionResult.taxAmount}</span> : null}
                  <span><strong>Grand Total:</strong> ₹{extractionResult.grandTotal || editableLines.reduce((s, l) => s + l.lineTotal, 0)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditableLines(prev => [
                        ...prev,
                        {
                          id: `item-${prev.length + 1}-${Date.now()}`,
                          productName: 'New Item',
                          quantity: 1,
                          unit: 'kg',
                          unitPrice: 10,
                          lineTotal: 10,
                          status: 'valid',
                          currentStock: 0,
                          newStockPreview: operationType === 'BUY' ? 1 : -1,
                        }
                      ]);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-navy-300 text-xs font-semibold text-navy-700 hover:bg-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Existing CSV Import (100% Preserved) */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-5">
            <div>
              <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
                1. Select CSV Document Statement Type:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setDocType('sales_statement'); setParsedDoc(null); }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    docType === 'sales_statement'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-navy-200 bg-white hover:bg-navy-50'
                  }`}
                >
                  <div className="font-bold text-sm text-navy-900">Sales Statement</div>
                  <p className="text-xs text-navy-500 mt-1">Registers sales revenue & decrements stock</p>
                </button>

                <button
                  type="button"
                  onClick={() => { setDocType('supplier_invoice'); setParsedDoc(null); }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    docType === 'supplier_invoice'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-navy-200 bg-white hover:bg-navy-50'
                  }`}
                >
                  <div className="font-bold text-sm text-navy-900">Supplier Receipt Invoice</div>
                  <p className="text-xs text-navy-500 mt-1">Confirms delivery & increases physical stock</p>
                </button>

                <button
                  type="button"
                  onClick={() => { setDocType('inventory_sheet'); setParsedDoc(null); }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    docType === 'inventory_sheet'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-navy-200 bg-white hover:bg-navy-50'
                  }`}
                >
                  <div className="font-bold text-sm text-navy-900">Stocktake Count Sheet</div>
                  <p className="text-xs text-navy-500 mt-1">Reconciles variance into movement audit</p>
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
                2. Test with 1-Click Demo CSV:
              </label>
              
              <div className="border-2 border-dashed border-navy-200 rounded-2xl p-6 text-center space-y-3 bg-navy-50/30">
                <div className="w-12 h-12 rounded-2xl bg-white border border-navy-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-navy-900">Load Demo CSV Template</h4>
                  <p className="text-xs text-navy-500 mt-0.5">Supports standard comma-delimited columns</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleParseCsvText(sampleCsvTemplates.sales, 'daily_pos_sales_report.csv')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-navy-200 hover:border-emerald-500 text-xs font-semibold text-navy-700 shadow-xs"
                  >
                    Load Sample Sales CSV (4 items)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleParseCsvText(sampleCsvTemplates.invoice, 'mandi_supplier_invoice_042.csv')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-navy-200 hover:border-emerald-500 text-xs font-semibold text-navy-700 shadow-xs"
                  >
                    Load Sample Invoice CSV (3 items)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleParseCsvText(sampleCsvTemplates.reconcile, 'physical_audit_nov05.csv')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-navy-200 hover:border-emerald-500 text-xs font-semibold text-navy-700 shadow-xs"
                  >
                    Load Stock Audit CSV (3 items)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="bg-surface-card rounded-2xl p-8 border border-surface-border text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-navy-900">Matching SKUs and validating unit prices...</p>
            </div>
          )}

          {/* CSV Preview Table */}
          {parsedDoc && !isParsing && (
            <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card overflow-hidden space-y-4">
              <div className="p-5 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-navy-900">{parsedDoc.fileName}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                      {parsedDoc.status}
                    </span>
                  </div>
                  <p className="text-xs text-navy-500 mt-0.5">
                    Total Extracted: {parsedDoc.totalLines} lines • Valid: {parsedDoc.validLines} • Total: ₹{parsedDoc.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setParsedDoc(null)}
                    className="px-3 py-2 rounded-xl border border-navy-200 text-xs font-bold text-navy-700"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyCsvDocument}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Apply to System</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-navy-50 text-navy-700 font-bold uppercase text-[11px] border-b border-surface-border">
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-3">SKU Matched</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-3">Total (₹)</th>
                      <th className="py-2.5 px-4">Validation Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {parsedDoc.extractedRecords.map((line, idx) => (
                      <tr key={idx} className="hover:bg-navy-50/40">
                        <td className="py-2.5 px-4">
                          {line.status === 'valid' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          )}
                          {line.status === 'warning' && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5" /> Warning
                            </span>
                          )}
                          {line.status === 'error' && (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" /> Error
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-navy-900">{line.skuMatched}</td>
                        <td className="py-2.5 px-3 font-medium text-navy-800">{line.productName}</td>
                        <td className="py-2.5 px-3 font-mono">{line.quantity} {line.unit}</td>
                        <td className="py-2.5 px-3 font-mono">₹{line.unitPrice}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-navy-900">₹{line.totalAmount}</td>
                        <td className="py-2.5 px-4 text-xs text-navy-500">{line.validationMessage || 'All fields clean'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: History Audit */}
      {activeTab === 'history' && (
        <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-6">
          <h3 className="font-bold text-base text-navy-900 mb-4">Past Import Runs</h3>
          {importHistory.length === 0 ? (
            <p className="text-xs text-navy-500 py-6 text-center">No import runs recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {importHistory.map(doc => (
                <div key={doc.id} className="p-4 rounded-xl border border-surface-border flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-sm text-navy-900 flex items-center gap-2">
                      <span>{doc.fileName}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded uppercase">
                        {doc.fileType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] bg-navy-100 text-navy-700 font-bold px-1.5 py-0.2 rounded uppercase">
                        {doc.sourceFormat}
                      </span>
                    </div>
                    <p className="text-navy-500 mt-1">{doc.auditNote}</p>
                    <span className="text-[10px] text-navy-400 font-mono">Applied: {doc.appliedAt}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-extrabold text-sm text-navy-900">
                      ₹{doc.totalAmount.toLocaleString('en-IN')}
                    </span>
                    <div className="text-[11px] text-navy-500">{doc.validLines} of {doc.totalLines} lines</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
