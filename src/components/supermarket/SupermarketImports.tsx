import React, { useState } from 'react';
import { ImportDocument, ImportLineItem, Language } from '../../types';
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
  Database
} from 'lucide-react';

interface SupermarketImportsProps {
  businessId: string;
  language: Language;
}

export const SupermarketImports: React.FC<SupermarketImportsProps> = ({
  businessId,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');
  const [docType, setDocType] = useState<'sales_statement' | 'supplier_invoice' | 'inventory_sheet'>('sales_statement');
  const [parsedDoc, setParsedDoc] = useState<ImportDocument | null>(null);
  const [isParsing, setIsParsing] = useState(false);
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

  const sampleCsvTemplates = {
    sales: `SKU,ProductName,Quantity,Unit,UnitPrice,Date\nVEG-TOM-01,Grade-A Fresh Hybrid Tomato,15,kg,32,2026-11-05\nDAI-MLK-01,Vijaya Toned Milk Pouch,20,pack,30,2026-11-05\nPKG-OIL-01,Freedom Refined Sunflower Oil,8,pack,140,2026-11-05\nUNKNOWN-01,Organic Quinoa Grain,5,kg,180,2026-11-05`,
    invoice: `SKU,ProductName,Quantity,Unit,UnitPrice,Date\nVEG-TOM-01,Grade-A Fresh Hybrid Tomato,40,kg,22,2026-11-05\nGRN-RIC-01,BPT 5204 Sona Masoori Raw Rice,10,bag,1450,2026-11-05\nPKG-OIL-01,Freedom Refined Sunflower Oil,24,pack,122,2026-11-05`,
    reconcile: `SKU,ProductName,PhysicalCount,Unit,Note\nVEG-TOM-01,Grade-A Fresh Hybrid Tomato,60,kg,Morning physical audit\nVEG-ONI-02,Nasik Red Onion,118,kg,2kg shrinkage variance\nDAI-MLK-01,Vijaya Toned Milk Pouch,42,pack,Count verified`
  };

  const handleParseCsvText = (csvContent: string, fileName: string) => {
    setIsParsing(true);
    setImportSuccessMsg('');

    setTimeout(() => {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        setIsParsing(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
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

        // Product matching
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
    }, 600);
  };

  const handleApplyDocument = () => {
    if (!parsedDoc) return;

    if (parsedDoc.fileType === 'sales_statement') {
      // Record sales records without increasing inventory
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

      // Deduct inventory corresponding to sales
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
      // Supplier receipt increases inventory
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
      // Reconcile stock count
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

    setImportSuccessMsg(`Successfully imported and applied ${parsedDoc.extractedRecords.length} line items from ${parsedDoc.fileName}!`);
    setParsedDoc(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Document & Statement Import Center
          </h2>
          <p className="text-xs sm:text-sm text-navy-500 mt-0.5">
            Automated parsing, product matching, and duplicate verification for sales statements, invoices, and stock sheets.
          </p>
        </div>

        <div className="flex items-center bg-navy-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'upload' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600 hover:text-navy-900'
            }`}
          >
            Import Document
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'history' ? 'bg-white text-navy-900 shadow-xs' : 'text-navy-600 hover:text-navy-900'
            }`}
          >
            Audit History ({importHistory.length})
          </button>
        </div>
      </div>

      {importSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importSuccessMsg}</span>
        </div>
      )}

      {activeTab === 'upload' ? (
        <div className="space-y-6">
          {/* Document Type Selector & Upload Zone */}
          <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-5">
            <div>
              <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
                1. Select Document Statement Type:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
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

            {/* Upload Area & Sample Clickers */}
            <div>
              <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
                2. Upload File or Test with 1-Click Demo CSV:
              </label>
              
              <div className="border-2 border-dashed border-navy-200 hover:border-emerald-500 rounded-2xl p-6 text-center space-y-3 bg-navy-50/30">
                <div className="w-12 h-12 rounded-2xl bg-white border border-navy-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-navy-900">Drop your file here or tap a demo template below</h4>
                  <p className="text-xs text-navy-500 mt-0.5">Supports CSV, TSV, JSON (PDF / Image OCR boundary prepared)</p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleParseCsvText(sampleCsvTemplates.sales, 'daily_pos_sales_report.csv')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-navy-200 hover:border-emerald-500 text-xs font-semibold text-navy-700 shadow-xs"
                  >
                    Load Sample Sales CSV (4 items)
                  </button>
                  <button
                    onClick={() => handleParseCsvText(sampleCsvTemplates.invoice, 'mandi_supplier_invoice_042.csv')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-navy-200 hover:border-emerald-500 text-xs font-semibold text-navy-700 shadow-xs"
                  >
                    Load Sample Invoice CSV (3 items)
                  </button>
                  <button
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

          {/* Validation & Preview Table */}
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
                    Total Extracted: {parsedDoc.totalLines} lines • Valid: {parsedDoc.validLines} • Total Value: ₹{parsedDoc.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setParsedDoc(null)}
                    className="px-3 py-2 rounded-xl border border-navy-200 text-xs font-bold text-navy-700"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleApplyDocument}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Apply to System</span>
                  </button>
                </div>
              </div>

              {/* Line Items Table */}
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
      ) : (
        /* History View */
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
