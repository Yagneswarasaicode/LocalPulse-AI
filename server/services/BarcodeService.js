import { config } from '../config.js';
import { cacheService } from './CacheService.js';

/**
 * Open Food Facts Barcode Product Lookup Service
 * Read-only public product registry.
 * Strictly enforces that external barcode data NEVER overwrites store purchase costs,
 * selling prices, supplier details, or physical stock levels.
 */
class BarcodeService {
  constructor() {
    this.cacheTtlSeconds = 86400; // 24 hours
  }

  /**
   * Normalize Open Food Facts raw product record
   */
  normalizeProduct(rawProduct, barcode) {
    if (!rawProduct) return null;

    const name = rawProduct.product_name || rawProduct.product_name_en || '';
    const brand = rawProduct.brands || rawProduct.brand_owner || 'Unbranded';
    const categoriesStr = rawProduct.categories || rawProduct.categories_tags?.join(', ') || '';
    const quantity = rawProduct.quantity || rawProduct.product_quantity || '';
    const imageUrl = rawProduct.image_url || rawProduct.image_front_url || null;
    const ingredients = rawProduct.ingredients_text || rawProduct.ingredients_text_en || null;

    // Detect retail category mapping
    let category = 'Packaged food';
    const lowerCat = categoriesStr.toLowerCase();
    if (lowerCat.includes('beverage') || lowerCat.includes('drink') || lowerCat.includes('juice') || lowerCat.includes('water')) {
      category = 'Beverages';
    } else if (lowerCat.includes('dairy') || lowerCat.includes('milk') || lowerCat.includes('cheese') || lowerCat.includes('yogurt')) {
      category = 'Dairy';
    } else if (lowerCat.includes('vegetable') || lowerCat.includes('legume')) {
      category = 'Vegetables';
    } else if (lowerCat.includes('fruit')) {
      category = 'Fruits';
    } else if (lowerCat.includes('cereal') || lowerCat.includes('grain') || lowerCat.includes('rice')) {
      category = 'Rice and grains';
    } else if (lowerCat.includes('cleaning') || lowerCat.includes('household') || lowerCat.includes('detergent')) {
      category = 'Household products';
    }

    return {
      barcode: rawProduct.code || barcode,
      productName: name || `Product (${barcode})`,
      brand,
      category,
      packSize: quantity,
      imageUrl,
      ingredients,
      source: 'Open Food Facts v3',
      disclaimer: 'Public catalog information only. Store purchase cost, selling price, and stock quantities must be configured by store manager.',
    };
  }

  /**
   * Look up product details by barcode
   */
  async lookupBarcode(barcode) {
    const cleanBarcode = String(barcode || '').trim().replace(/[^0-9]/g, '');

    if (!cleanBarcode || cleanBarcode.length < 8) {
      return {
        success: false,
        status: 'INVALID_BARCODE',
        message: 'Invalid barcode. Must be at least 8 numerical digits (e.g. EAN-8, EAN-13, UPC).',
        data: null,
      };
    }

    const cacheKey = `barcode_${cleanBarcode}`;

    return cacheService.wrap(cacheKey, this.cacheTtlSeconds, async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const url = `https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(cleanBarcode)}.json?fields=code,product_name,product_name_en,brands,brand_owner,categories,categories_tags,quantity,image_url,image_front_url,ingredients_text,ingredients_text_en`;

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': config.userAgent,
          },
        });

        clearTimeout(timeoutId);

        if (response.status === 404) {
          return {
            success: true,
            status: 'LIVE',
            found: false,
            barcode: cleanBarcode,
            message: `Barcode ${cleanBarcode} was not found in Open Food Facts registry. Please enter product details manually.`,
            data: null,
          };
        }

        if (!response.ok) {
          throw new Error(`Open Food Facts returned HTTP ${response.status}: ${response.statusText}`);
        }

        const raw = await response.json();

        if (raw.status === 'product_not_found' || !raw.product) {
          return {
            success: true,
            status: 'LIVE',
            found: false,
            barcode: cleanBarcode,
            message: `Barcode ${cleanBarcode} was not found in Open Food Facts registry. Please enter product details manually.`,
            data: null,
          };
        }

        const normalized = this.normalizeProduct(raw.product, cleanBarcode);

        return {
          success: true,
          status: 'LIVE',
          found: true,
          barcode: cleanBarcode,
          data: normalized,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    });
  }
}

export const barcodeService = new BarcodeService();
