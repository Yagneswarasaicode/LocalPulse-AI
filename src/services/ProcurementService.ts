import { InventoryItem } from '../types/shared.ts';
import { SupermarketProcurementPlan, SupermarketPurchaseRecommendation } from '../types/supermarket.ts';
import { supplierService } from './SupplierService.ts';
import { inventoryService } from './InventoryService.ts';

class ProcurementService {
  public calculateSupermarketPlan(
    businessId: string,
    approvedBudget: number,
    horizonDays: number = 7
  ): SupermarketProcurementPlan {
    const items = inventoryService.getInventory(businessId);
    const warnings: string[] = [];

    // Analyze candidate reorders
    const candidates: Array<{
      item: InventoryItem;
      expectedDemand: number;
      targetStock: number;
      deficit: number;
      rawSuggestedQty: number;
      packSize: number;
      unitCost: number;
      chosenSupplierId?: string;
      chosenSupplierName?: string;
      priority: 'HIGH' | 'MED' | 'LOW' | 'SKIP';
      urgencyScore: number;
      reason: string;
      hasQuote: boolean;
    }> = [];

    for (const item of items) {
      // Estimate daily sales velocity: based on reorder threshold or daily rate
      const dailyVelocity = Math.max(0.5, item.reorderThreshold / 3);
      const expectedDemand = Math.round(dailyVelocity * horizonDays);
      const targetStock = expectedDemand + item.safetyStock;
      const effectiveStock = item.stock.availableStock + item.stock.incomingStock;
      const deficit = targetStock - effectiveStock;

      // Find best supplier quote
      const quote = supplierService.getBestQuoteForProduct(item.id);
      const unitCost = quote ? quote.quotePrice : item.purchaseCost;
      const packSize = quote ? quote.packSize : (item.packSize || 1);
      const hasQuote = Boolean(quote);

      if (!hasQuote) {
        warnings.push(`No active supplier quotation for "${item.nameEn}". Using last recorded purchase cost (₹${item.purchaseCost}/${item.unit}).`);
      }

      let priority: 'HIGH' | 'MED' | 'LOW' | 'SKIP' = 'SKIP';
      let urgencyScore = 0;
      let reason = '';

      if (effectiveStock === 0) {
        priority = 'HIGH';
        urgencyScore = 200 + deficit;
        reason = `Stockout alert! 0 ${item.unit} available. Immediate replenishment required.`;
      } else if (effectiveStock <= item.safetyStock) {
        priority = 'HIGH';
        urgencyScore = 150 + (item.safetyStock - effectiveStock);
        reason = `Stock (${effectiveStock} ${item.unit}) below safety threshold (${item.safetyStock} ${item.unit}). Stockout risk within ${Math.round(effectiveStock / dailyVelocity)} days.`;
      } else if (effectiveStock <= item.reorderThreshold) {
        priority = 'MED';
        urgencyScore = 80 + (item.reorderThreshold - effectiveStock);
        reason = `Stock below reorder point (${item.reorderThreshold} ${item.unit}). Top-up to cover ${horizonDays}-day planning horizon.`;
      } else if (deficit > 0) {
        priority = 'LOW';
        urgencyScore = 20;
        reason = `Healthy buffer (${effectiveStock} ${item.unit}). Optional top-up.`;
      } else {
        priority = 'SKIP';
        urgencyScore = 0;
        reason = `Ample stock (${effectiveStock} ${item.unit}) covers ${Math.round(effectiveStock / dailyVelocity)} days. Do not reorder.`;
      }

      let rawSuggestedQty = 0;
      if (priority !== 'SKIP' && deficit > 0) {
        // Round to nearest supplier pack size
        const packsNeeded = Math.ceil(deficit / packSize);
        // Also respect minimum order quantity if specified
        const minPacks = quote ? Math.max(1, quote.minimumOrderQty) : 1;
        rawSuggestedQty = Math.max(packsNeeded, minPacks) * packSize;
      }

      candidates.push({
        item,
        expectedDemand,
        targetStock,
        deficit,
        rawSuggestedQty,
        packSize,
        unitCost,
        chosenSupplierId: quote?.supplierId || item.defaultSupplierId,
        chosenSupplierName: quote?.supplierName,
        priority,
        urgencyScore,
        reason,
        hasQuote,
      });
    }

    // Sort by urgency score descending (HIGH first)
    candidates.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // Enforce strict budget constraint: TOTAL ESTIMATED SPENDING <= APPROVED BUDGET
    let remainingBudget = Math.max(0, approvedBudget);
    let totalEstimatedSpending = 0;
    const recommendations: SupermarketPurchaseRecommendation[] = [];

    for (const c of candidates) {
      if (c.priority === 'SKIP' || c.rawSuggestedQty === 0) {
        recommendations.push({
          product: c.item,
          expectedDemand7Days: c.expectedDemand,
          targetStock: c.targetStock,
          suggestedReorderQty: 0,
          chosenSupplierId: c.chosenSupplierId,
          chosenSupplierName: c.chosenSupplierName,
          packSize: c.packSize,
          unitCost: c.unitCost,
          estimatedCost: 0,
          priority: 'SKIP',
          reason: c.reason,
          hasQuote: c.hasQuote,
        });
        continue;
      }

      const costForDesired = c.rawSuggestedQty * c.unitCost;

      if (costForDesired <= remainingBudget) {
        // Full reorder fits within budget
        recommendations.push({
          product: c.item,
          expectedDemand7Days: c.expectedDemand,
          targetStock: c.targetStock,
          suggestedReorderQty: c.rawSuggestedQty,
          chosenSupplierId: c.chosenSupplierId,
          chosenSupplierName: c.chosenSupplierName,
          packSize: c.packSize,
          unitCost: c.unitCost,
          estimatedCost: costForDesired,
          priority: c.priority,
          reason: c.reason,
          hasQuote: c.hasQuote,
        });
        remainingBudget -= costForDesired;
        totalEstimatedSpending += costForDesired;
      } else {
        // Partial allocation or skip due to budget limit
        const affordablePacks = Math.floor(remainingBudget / (c.packSize * c.unitCost));
        if (affordablePacks > 0) {
          const partialQty = affordablePacks * c.packSize;
          const partialCost = partialQty * c.unitCost;
          recommendations.push({
            product: c.item,
            expectedDemand7Days: c.expectedDemand,
            targetStock: c.targetStock,
            suggestedReorderQty: partialQty,
            chosenSupplierId: c.chosenSupplierId,
            chosenSupplierName: c.chosenSupplierName,
            packSize: c.packSize,
            unitCost: c.unitCost,
            estimatedCost: partialCost,
            priority: c.priority,
            reason: `${c.reason} (Scaled down from ${c.rawSuggestedQty} to ${partialQty} ${c.item.unit} to prevent budget overrun).`,
            hasQuote: c.hasQuote,
          });
          remainingBudget -= partialCost;
          totalEstimatedSpending += partialCost;
        } else {
          recommendations.push({
            product: c.item,
            expectedDemand7Days: c.expectedDemand,
            targetStock: c.targetStock,
            suggestedReorderQty: 0,
            chosenSupplierId: c.chosenSupplierId,
            chosenSupplierName: c.chosenSupplierName,
            packSize: c.packSize,
            unitCost: c.unitCost,
            estimatedCost: 0,
            priority: 'SKIP',
            reason: `Budget cap reached (Remaining: ₹${remainingBudget}). Cannot afford minimum pack of ${c.packSize} ${c.item.unit} (₹${c.packSize * c.unitCost}).`,
            hasQuote: c.hasQuote,
          });
        }
      }
    }

    const budgetUtilization = approvedBudget > 0 ? Math.round((totalEstimatedSpending / approvedBudget) * 100) : 0;

    return {
      planningHorizonDays: horizonDays,
      approvedBudget,
      totalEstimatedSpending,
      remainingBudget,
      budgetUtilizationPercent: budgetUtilization,
      recommendations,
      warnings,
      calculatedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export const procurementService = new ProcurementService();
