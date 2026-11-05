import { calculateProcurementPlan } from '../src/utils/procurementMath.ts';
import { INITIAL_SAMPLE_VEGETABLES } from '../src/sampleData.ts';
import { inventoryService } from '../src/services/InventoryService.ts';
import { procurementService } from '../src/services/ProcurementService.ts';
import { salesAnalyticsService } from '../src/services/SalesAnalyticsService.ts';
import { supplierService } from '../src/services/SupplierService.ts';
import { marketplaceService } from '../src/services/MarketplaceService.ts';
import { vendorAdapter } from '../src/services/VendorAdapter.ts';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('LOCALPULSE AI — COMPREHENSIVE PLATFORM TEST SUITE');
console.log('====================================================\n');

// 1. REGRESSION & VENDOR OPTIMIZER TESTS
console.log('Suite 1: Vendor Regression & Zero-Budget-Overrun Math');
const vendorPlan2000 = calculateProcurementPlan(INITIAL_SAMPLE_VEGETABLES, 2000);
assert(vendorPlan2000.totalCost <= 2000, 'Total cost <= ₹2,000 budget cap (Strict Zero Overrun)');
assert(vendorPlan2000.totalCost === 1940, `Exact benchmark sample cost is ₹1,940 (Actual: ₹${vendorPlan2000.totalCost})`);
assert(vendorPlan2000.remainingCash === 60, `Remaining cash is ₹60 (Actual: ₹${vendorPlan2000.remainingCash})`);
assert(vendorPlan2000.zeroBudgetOverrun === true, 'zeroBudgetOverrun flag is true');

const vendorPlan1000 = calculateProcurementPlan(INITIAL_SAMPLE_VEGETABLES, 1000);
assert(vendorPlan1000.totalCost <= 1000, `Total cost under tight ₹1,000 budget cap (Actual: ₹${vendorPlan1000.totalCost})`);
assert(vendorPlan1000.zeroBudgetOverrun === true, 'Zero budget overrun verified under tight budget');

// 2. SUPERMARKET INVENTORY & CRUD TESTS
console.log('\nSuite 2: Supermarket Inventory & Non-Negative Stock Enforcement');
const smInventory = inventoryService.getInventory('biz-supermarket-1');
assert(smInventory.length >= 8, `Supermarket has preloaded SKUs across categories (Count: ${smInventory.length})`);

const tomato = inventoryService.getItem('biz-supermarket-1', 'sm-item-1');
assert(Boolean(tomato), 'Hybrid Tomato SKU found in inventory');
if (tomato) {
  const initialStock = tomato.stock.physicalStock;
  
  // Test adjustment +10 (receipt)
  const addRes = inventoryService.adjustStock('biz-supermarket-1', tomato.id, 10, 'supplier_receipt', 'Test delivery');
  assert(addRes.success === true, 'Successfully added 10 units via receipt');
  assert(tomato.stock.physicalStock === initialStock + 10, 'Physical stock increased by 10');

  // Test negative inventory prevention
  const failRes = inventoryService.adjustStock('biz-supermarket-1', tomato.id, -99999, 'sale', 'Invalid huge reduction');
  assert(failRes.success === false, 'Blocked reduction that would result in negative inventory');
  assert(Boolean(failRes.error), `Error returned: "${failRes.error}"`);

  // Restore stock
  inventoryService.adjustStock('biz-supermarket-1', tomato.id, -10, 'sale', 'Restore test');
}

// 3. SUPERMARKET PROCUREMENT BUDGET CONSTRAINT TESTS
console.log('\nSuite 3: Supermarket Smart Procurement Engine');
const smPlan = procurementService.calculateSupermarketPlan('biz-supermarket-1', 25000, 7);
assert(smPlan.totalEstimatedSpending <= 25000, `Total estimated spend (₹${smPlan.totalEstimatedSpending}) <= approved budget (₹25,000)`);
assert(smPlan.recommendations.length > 0, 'Generated itemized replenishment recommendations');
assert(smPlan.recommendations.every(r => r.suggestedReorderQty % (r.packSize || 1) === 0), 'All reorders rounded to valid supplier pack sizes');

const lowBudgetSMPlan = procurementService.calculateSupermarketPlan('biz-supermarket-1', 500, 7);
assert(lowBudgetSMPlan.totalEstimatedSpending <= 500, `Low budget spend (₹${lowBudgetSMPlan.totalEstimatedSpending}) <= approved budget (₹500)`);

// 4. SALES ANALYTICS & MARGIN TESTS
console.log('\nSuite 4: Sales History & Margin Calculations');
const metrics = salesAnalyticsService.calculateMetrics('biz-supermarket-1');
assert(metrics.totalRevenue > 0, `Total revenue calculated from transactions: ₹${metrics.totalRevenue}`);
assert(metrics.totalMargin > 0, `Gross margin calculated: ₹${metrics.totalMargin}`);
assert(metrics.marginPercent > 0 && metrics.marginPercent < 100, `Margin percentage valid: ${metrics.marginPercent}%`);
assert(metrics.categories.length > 0, 'Category breakdown calculated');

// 5. P2P SURPLUS DETECTION & LISTING TESTS
console.log('\nSuite 5: P2P Surplus Detection & Self-Purchase Prevention');
const vendorSurplus = marketplaceService.detectSurplusSuggestions('biz-vendor-1', 'vendor');
assert(vendorSurplus.length > 0, `Vendor surplus detected for buffer > 2 days (Found: ${vendorSurplus.length})`);
const potatoSurplus = vendorSurplus.find(s => s.productName.includes('Potato') || s.productId.includes('sample-3'));
assert(Boolean(potatoSurplus), 'Potato 20kg identified as prime liquidation candidate');

// Test self-purchase prevention
const sampleListing = marketplaceService.getListings()[0];
const selfPurchaseRes = marketplaceService.createInquiry(
  sampleListing.id,
  sampleListing.sellerBusinessId,
  sampleListing.sellerBusinessName,
  sampleListing.sellerType,
  2
);
assert(selfPurchaseRes.success === false, 'Self-purchase blocked: cannot buy from own business listing');

// 6. P2P TRADE LIFECYCLE: INQUIRY -> ACCEPT -> RESERVE -> HANDOVER
console.log('\nSuite 6: P2P Full Trade Lifecycle & Idempotent Stock Reservation');
// Create a new fresh listing to test complete lifecycle
const createRes = marketplaceService.createListing({
  sellerBusinessId: 'biz-supermarket-1',
  sellerBusinessName: 'Poorna Fresh Supermarket',
  sellerType: 'supermarket',
  productId: 'sm-item-2',
  productName: 'Nasik Red Onion (Test Lot)',
  category: 'Vegetables',
  initialQuantity: 25,
  availableQuantity: 25,
  unit: 'kg',
  originalCost: 28,
  askingPricePerUnit: 24,
  condition: 'fresh_grade_a',
  pickupLocality: 'Sector 4 Dock',
  pickupTiming: 'Today 3:00 PM',
});
assert(createRes.success === true, 'Created test marketplace listing of 25kg Onions');
const testListing = createRes.listing!;

// Buyer submits inquiry for 10kg
const buyerInquiryRes = marketplaceService.createInquiry(
  testListing.id,
  'biz-vendor-1',
  'Rythu Bazaar Stall #42',
  'vendor',
  10
);
assert(buyerInquiryRes.success === true, 'Buyer successfully submitted inquiry for 10kg');
const inq = buyerInquiryRes.inquiry!;

// Seller accepts inquiry: must reserve 10kg
const acceptRes = marketplaceService.acceptInquiry(inq.id);
assert(acceptRes.success === true, 'Seller accepted inquiry');
const updatedListing = marketplaceService.getListing(testListing.id)!;
assert(updatedListing.reservedQuantity === 10, `Listing reservedQuantity is 10 (Actual: ${updatedListing.reservedQuantity})`);
assert(updatedListing.availableQuantity === 15, `Listing availableQuantity is 15 (Actual: ${updatedListing.availableQuantity})`);

// Duplicate acceptance test
const dupAcceptRes = marketplaceService.acceptInquiry(inq.id);
assert(dupAcceptRes.success === false, 'Duplicate acceptance safely prevented');

// Seller confirms physical handover & trade completion
const handoverRes = marketplaceService.confirmHandoverAndComplete(inq.id);
assert(handoverRes.success === true, 'Handover confirmed and trade completed');
assert(Boolean(handoverRes.trade), 'Immutable TradeRecord generated');
assert(handoverRes.trade?.totalTradeValue === 240, 'Trade value is 10kg * ₹24 = ₹240');

// Verify trade is logged in Trade History
const tradeHistory = marketplaceService.getTradeHistory();
assert(tradeHistory.some(t => t.id === handoverRes.trade?.id), 'Completed trade recorded in global trade history');

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
