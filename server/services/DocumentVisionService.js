/**
 * DocumentVisionService.js
 * Multimodal Gemini Vision extractor & deterministic mathematical validator.
 * Extracts structured invoice/receipt line items from images (JPG, PNG) and PDFs.
 * Supports printed and handwritten English and Telugu text with zero hallucination.
 */

import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

export class DocumentVisionService {
  constructor(aiClient = null, options = {}) {
    this.ai = aiClient || (config.geminiApiKey ? new GoogleGenAI({ apiKey: config.geminiApiKey }) : null);
    this.modelName = options.modelName || process.env.GEMINI_VISION_MODEL || 'gemini-2.5-flash';
    this.mockExtractor = options.mockExtractor || null;
  }

  /**
   * Set a mock extractor for unit tests
   */
  setMockExtractor(fn) {
    this.mockExtractor = fn;
  }

  /**
   * Generate SHA-256 fingerprint for duplicate detection
   */
  generateFingerprint(data, fileBuffer = null) {
    const raw = [
      (data.supplierName || '').trim().toLowerCase(),
      (data.invoiceNumber || '').trim().toLowerCase(),
      (data.invoiceDate || '').trim(),
      Number(data.grandTotal || 0).toFixed(2),
      data.lineItems?.length || 0,
    ].join('::');

    if (fileBuffer) {
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex').substring(0, 16);
      return `${crypto.createHash('sha256').update(raw).digest('hex')}:${fileHash}`;
    }

    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Deterministic mathematical validation and audit
   */
  validateExtractedDocument(data, fileBuffer = null) {
    const warnings = [...(data.warnings || [])];
    const missingFields = [...(data.missingFields || [])];
    const fieldsNeedingReview = [...(data.fieldsNeedingReview || [])];

    // 1. Mandatory metadata checks
    if (!data.supplierName) {
      missingFields.push('supplierName');
      warnings.push('Supplier name could not be identified from document header.');
    }
    if (!data.invoiceNumber) {
      missingFields.push('invoiceNumber');
      warnings.push('Invoice number is missing or unreadable.');
    }
    if (!data.invoiceDate) {
      missingFields.push('invoiceDate');
      warnings.push('Invoice date is missing or unreadable.');
    }

    // 2. Line Items Verification
    const validatedItems = [];
    let calculatedSubtotal = 0;
    const seenProductNames = new Set();

    const rawItems = Array.isArray(data.lineItems) ? data.lineItems : [];

    if (rawItems.length === 0) {
      warnings.push('No product line items were detected in this document.');
    }

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      let itemStatus = 'valid';
      const itemIssues = [];

      // Product Name check
      const name = (item.productName || '').trim();
      if (!name) {
        itemStatus = 'error';
        itemIssues.push('Missing product name');
        fieldsNeedingReview.push(`lineItems[${i}].productName`);
      } else {
        const lowerName = name.toLowerCase();
        if (seenProductNames.has(lowerName)) {
          warnings.push(`Duplicate line item found: "${name}" appears more than once.`);
        }
        seenProductNames.add(lowerName);
      }

      // Quantity check
      const qty = typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity);
      if (isNaN(qty) || qty === null || item.quantity === null || item.quantity === undefined) {
        itemStatus = 'error';
        itemIssues.push('Missing or unreadable quantity');
        fieldsNeedingReview.push(`lineItems[${i}].quantity`);
      } else if (qty <= 0) {
        itemStatus = 'error';
        itemIssues.push(`Invalid non-positive quantity (${qty})`);
        fieldsNeedingReview.push(`lineItems[${i}].quantity`);
      }

      // Unit Price check
      const price = typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice);
      if (isNaN(price) || price === null || item.unitPrice === null || item.unitPrice === undefined) {
        itemStatus = 'error';
        itemIssues.push('Missing or unreadable unit price');
        fieldsNeedingReview.push(`lineItems[${i}].unitPrice`);
      } else if (price < 0) {
        itemStatus = 'error';
        itemIssues.push(`Negative unit price (${price})`);
        fieldsNeedingReview.push(`lineItems[${i}].unitPrice`);
      }

      // Unit of measure normalization
      let unit = (item.unit || '').trim().toLowerCase();
      if (!unit) {
        unit = 'kg'; // safe default with warning
        warnings.push(`Line item "${name || `Item #${i + 1}`}" did not specify a unit; defaulted to "kg".`);
        fieldsNeedingReview.push(`lineItems[${i}].unit`);
      } else if (unit === 'ltr' || unit === 'ltrs' || unit === 'liter' || unit === 'liters') {
        unit = 'litre';
      } else if (unit === 'l') {
        unit = 'litre';
      } else if (unit === 'kgs' || unit === 'kilo' || unit === 'kilos') {
        unit = 'kg';
      } else if (unit === 'gm' || unit === 'gms' || unit === 'grams') {
        unit = 'g';
      } else if (unit === 'pcs' || unit === 'nos') {
        unit = 'piece';
      }

      // Mathematical Line Total Check: lineTotal = qty * price
      const expectedLineTotal = (!isNaN(qty) && !isNaN(price)) ? Math.round(qty * price * 100) / 100 : 0;
      const printedLineTotal = typeof item.lineTotal === 'number' ? item.lineTotal : parseFloat(item.lineTotal);

      let finalLineTotal = expectedLineTotal;

      if (!isNaN(printedLineTotal) && printedLineTotal > 0) {
        finalLineTotal = printedLineTotal;
        if (!isNaN(expectedLineTotal) && Math.abs(printedLineTotal - expectedLineTotal) > 0.05) {
          itemStatus = itemStatus === 'error' ? 'error' : 'warning';
          itemIssues.push(`Printed amount (₹${printedLineTotal}) differs from Qty × Rate (₹${expectedLineTotal})`);
          fieldsNeedingReview.push(`lineItems[${i}].lineTotal`);
          warnings.push(`Mathematical discrepancy on "${name}": printed ₹${printedLineTotal} vs calculated ₹${expectedLineTotal}.`);
        }
      }

      calculatedSubtotal += finalLineTotal;

      validatedItems.push({
        id: `item-${i + 1}-${Date.now()}`,
        productName: name || 'Unknown Produce',
        sku: item.sku || null,
        skuMatched: item.skuMatched || null,
        quantity: isNaN(qty) ? 0 : qty,
        unit,
        unitPrice: isNaN(price) ? 0 : price,
        lineTotal: Math.round(finalLineTotal * 100) / 100,
        status: itemStatus,
        validationMessage: itemIssues.length > 0 ? itemIssues.join(' • ') : 'Verified clean',
      });
    }

    calculatedSubtotal = Math.round(calculatedSubtotal * 100) / 100;

    // 3. Subtotal check
    const printedSubtotal = typeof data.subtotal === 'number' ? data.subtotal : parseFloat(data.subtotal);
    if (!isNaN(printedSubtotal) && Math.abs(printedSubtotal - calculatedSubtotal) > 0.05) {
      warnings.push(`Invoice printed subtotal (₹${printedSubtotal}) differs from sum of line items (₹${calculatedSubtotal}).`);
      fieldsNeedingReview.push('subtotal');
    }

    const effectiveSubtotal = !isNaN(printedSubtotal) && printedSubtotal > 0 ? printedSubtotal : calculatedSubtotal;

    // 4. Grand Total Check: grandTotal = subtotal + tax + otherCharges - discount
    const tax = typeof data.taxAmount === 'number' ? data.taxAmount : parseFloat(data.taxAmount) || 0;
    const discount = typeof data.discountAmount === 'number' ? data.discountAmount : parseFloat(data.discountAmount) || 0;
    const other = typeof data.otherCharges === 'number' ? data.otherCharges : parseFloat(data.otherCharges) || 0;

    const expectedGrandTotal = Math.round((effectiveSubtotal + tax + other - discount) * 100) / 100;
    const printedGrandTotal = typeof data.grandTotal === 'number' ? data.grandTotal : parseFloat(data.grandTotal);

    if (!isNaN(printedGrandTotal) && Math.abs(printedGrandTotal - expectedGrandTotal) > 0.05) {
      warnings.push(`Invoice printed grand total (₹${printedGrandTotal}) differs from calculated total (₹${expectedGrandTotal}).`);
      fieldsNeedingReview.push('grandTotal');
    }

    const fingerprint = this.generateFingerprint({
      supplierName: data.supplierName,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: data.invoiceDate,
      grandTotal: !isNaN(printedGrandTotal) ? printedGrandTotal : expectedGrandTotal,
      lineItems: validatedItems,
    }, fileBuffer);

    return {
      documentType: data.documentType || 'supplier_invoice',
      supplierName: data.supplierName || null,
      buyerName: data.buyerName || null,
      invoiceNumber: data.invoiceNumber || null,
      invoiceDate: data.invoiceDate || null,
      currency: data.currency || 'INR',
      subtotal: !isNaN(printedSubtotal) ? printedSubtotal : calculatedSubtotal,
      taxAmount: tax,
      discountAmount: discount,
      otherCharges: other,
      grandTotal: !isNaN(printedGrandTotal) ? printedGrandTotal : expectedGrandTotal,
      lineItems: validatedItems,
      warnings: [...new Set(warnings)],
      missingFields: [...new Set(missingFields)],
      fieldsNeedingReview: [...new Set(fieldsNeedingReview)],
      sourceLanguage: data.sourceLanguage || 'en',
      fingerprint,
    };
  }

  /**
   * Multimodal extraction using Gemini Vision
   */
  async extractDocument({ fileBuffer, mimeType, fileName = 'document', language = 'en' }) {
    if (this.mockExtractor) {
      const mockResult = await this.mockExtractor({ fileBuffer, mimeType, fileName, language });
      return this.validateExtractedDocument(mockResult, fileBuffer);
    }

    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured on the server. Please set GEMINI_API_KEY in .env to enable live Gemini Vision extraction.');
    }

    const systemPrompt = `You are LocalPulse AI Document Intelligence Engine, specialized in parsing retail Kirana store and street vendor wholesale invoices, receipts, and inventory count sheets in Visakhapatnam and Andhra Pradesh, India.

Your task is to accurately transcribe and extract structured invoice details from this document.
The document may contain English, Telugu (తెలుగు), or mixed bilingual text (e.g., "బియ్యం (Rice)", "శ్రీ లక్ష్మి హోల్ సేల్ సప్లైయర్స్", "రమణ కిరాణా స్టోర్").

CRITICAL ACCURACY RULES:
1. NEVER invent, hallucinate, or guess quantities, prices, dates, or product names.
2. If a field is illegible, torn, cut off, or missing, output null for that field.
3. For Telugu product names, provide the normalized English product name in "productName" and include Telugu script if recognizable.
4. Extract exact printed numbers:
   - "quantity": number (e.g., 50, 10, 2.5)
   - "unit": string (e.g., "kg", "g", "L", "litre", "pack", "bag")
   - "unitPrice": number (rate per unit in INR)
   - "lineTotal": number (printed line total)
5. Extract header details:
   - "supplierName": Seller/vendor business name (or null)
   - "buyerName": Store/buyer name (or null)
   - "invoiceNumber": Bill/Invoice reference number (or null)
   - "invoiceDate": Date formatted as YYYY-MM-DD if readable (or null)
   - "currency": "INR"
   - "subtotal": Sub Total before tax (number or null)
   - "taxAmount": GST / tax amount (number or 0)
   - "discountAmount": Discount amount (number or 0)
   - "otherCharges": Delivery / transport / packaging charges (number or 0)
   - "grandTotal": Final payable invoice total (number or null)
   - "documentType": "supplier_invoice" | "sales_statement" | "inventory_sheet" | "receipt" | "other"
   - "sourceLanguage": "en" | "te" | "mixed"
6. Output ONLY valid JSON matching the schema. No markdown backticks, no markdown formatting.`;

    const inlinePart = {
      inlineData: {
        data: fileBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: [
          inlinePart,
          { text: systemPrompt },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = (response.text || '').trim();
      if (!responseText) {
        throw new Error('Gemini Vision returned an empty extraction response.');
      }

      let parsed;
      try {
        parsed = JSON.parse(responseText.replace(/^```json/, '').replace(/```$/, '').trim());
      } catch (jsonErr) {
        console.error('[DocumentVisionService] JSON parse error:', jsonErr.message, responseText);
        throw new Error(`Failed to parse structured JSON from Gemini Vision output: ${jsonErr.message}`);
      }

      return this.validateExtractedDocument(parsed, fileBuffer);

    } catch (err) {
      if (err.message && err.message.includes('API_KEY')) {
        throw new Error('Invalid or unauthorized GEMINI_API_KEY. Please verify your Gemini API key in .env.');
      }
      throw err;
    }
  }
}

export const documentVisionService = new DocumentVisionService();
