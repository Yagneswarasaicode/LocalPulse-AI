export type PriorityLevel = 'HIGH' | 'MED' | 'SKIP';

export interface VegetableItem {
  id: string;
  nameEn: string;
  nameTe: string;
  category?: string;
  remainingKg: number;
  pricePerKg: number;      // wholesale mandi purchase price
  dailySalesKg: number;    // expected daily sales rate
  shelfLifeDays: number;   // typical shelf life before spoilage
  isSample?: boolean;
}

export interface PurchaseRecommendation {
  item: VegetableItem;
  daysLeft: number;        // remainingKg / dailySalesKg
  priority: PriorityLevel;
  recommendedBuyKg: number;
  estimatedCost: number;   // recommendedBuyKg * pricePerKg
  urgencyScore: number;
  reasonTe: string;
  reasonEn: string;
  spoilageRisk: 'High' | 'Moderate' | 'Low' | 'None';
}

export interface ProcurementPlan {
  totalBudget: number;
  totalCost: number;
  remainingCash: number;
  totalBuyKg: number;
  items: PurchaseRecommendation[];
  zeroBudgetOverrun: boolean;
  spoilageAvoidedKg: number;
  calculatedAt: string;
}

export interface GeminiExplanationResponse {
  telugu_audio_script: string;
  english_explanation: string;
  key_actions: Array<{
    item: string;
    item_te: string;
    quantity_kg: number;
    cost_inr: number;
    priority: PriorityLevel;
    reason: string;
  }>;
  items_to_skip: Array<{
    item: string;
    item_te: string;
    reason: string;
    reason_te: string;
  }>;
  remaining_cash_advice: {
    telugu: string;
    english: string;
  };
  mandi_tip: {
    telugu: string;
    english: string;
  };
  budget_stats: {
    total_budget: number;
    total_cost: number;
    remaining_cash: number;
    zero_overrun_verified: boolean;
  };
}

export type ActiveScreen = 'morning-check' | 'smart-plan' | 'ai-copilot' | 'about';
export type Language = 'en' | 'te';
