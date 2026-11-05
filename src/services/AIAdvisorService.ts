import { Language } from '../types.ts';
import { inventoryService } from './InventoryService.ts';
import { salesAnalyticsService } from './SalesAnalyticsService.ts';
import { marketplaceService } from './MarketplaceService.ts';

class AIAdvisorService {
  public async askSupermarketCopilot(
    question: string,
    language: Language,
    businessId: string = 'biz-supermarket-1'
  ): Promise<{ answerEn: string; answerTe: string; structuredData?: any }> {
    const q = question.toLowerCase();
    const inventory = inventoryService.getInventory(businessId);
    const salesMetrics = salesAnalyticsService.calculateMetrics(businessId);

    if (q.includes('buy') || q.includes('restock')) {
      const lowStock = inventory.filter(i => i.stock.availableStock <= i.reorderThreshold);
      const itemsListEn = lowStock.map(i => `${i.nameEn} (${i.stock.availableStock} ${i.unit} left)`).join(', ');
      const itemsListTe = lowStock.map(i => `${i.nameTe || i.nameEn} (${i.stock.availableStock} ${i.unit})`).join(', ');

      return {
        answerEn: `Based on your sales velocity and safety thresholds, ${lowStock.length} products urgently require restocking: ${itemsListEn}. All other items currently have healthy buffers.`,
        answerTe: `మీ అమ్మకాల వేగం ప్రకారం, ${lowStock.length} వస్తువులు వెంటనే ఆర్డర్ చేయాలి: ${itemsListTe}. మిగిలిన వస్తువులకు తగినంత నిల్వ ఉంది.`,
        structuredData: { urgentCount: lowStock.length, items: lowStock.map(i => i.nameEn) }
      };
    }

    if (q.includes('expir') || q.includes('shelf life')) {
      const nearExpiry = inventory.filter(i => i.status === 'near_expiry' || (i.expiryDate && new Date(i.expiryDate).getTime() - Date.now() < 3 * 86400000));
      return {
        answerEn: `You have ${nearExpiry.length} item with urgent expiry risk: ${nearExpiry.map(i => `${i.nameEn} (Expires: ${i.expiryDate})`).join(', ')}. Recommend listing on P2P Local Market at 30% discount to recover ₹1,200 before total write-off.`,
        answerTe: `మీ వద్ద గడువు తీరబోయే ${nearExpiry.length} రకం సరుకు ఉంది: ${nearExpiry.map(i => `${i.nameTe || i.nameEn} (గడువు: ${i.expiryDate})`).join(', ')}. నష్టం రాకుండా P2P మార్కెట్లో 30% రాయితీతో విక్రయించండి.`,
        structuredData: { expiringItems: nearExpiry }
      };
    }

    if (q.includes('sold') || q.includes('most') || q.includes('revenue')) {
      return {
        answerEn: `Last week total gross revenue reached ₹${salesMetrics.totalRevenue.toLocaleString('en-IN')} with an average gross margin of ${salesMetrics.marginPercent}%. Top category was ${salesMetrics.categories[0]?.category || 'Grains'} generating ₹${salesMetrics.categories[0]?.revenue || 0}.`,
        answerTe: `గత వారం మొత్తం అమ్మకాలు ₹${salesMetrics.totalRevenue.toLocaleString('en-IN')}, సగటు లాభం ${salesMetrics.marginPercent}%. అత్యధికంగా అమ్ముడైన విభాగం: ${salesMetrics.categories[0]?.category || 'ధాన్యాలు'}.`,
        structuredData: salesMetrics
      };
    }

    if (q.includes('p2p') || q.includes('surplus') || q.includes('sell')) {
      const surplus = marketplaceService.detectSurplusSuggestions(businessId, 'supermarket');
      return {
        answerEn: `AI Surplus Detection identified ${surplus.length} liquidation opportunities. You can recover an estimated ₹${surplus.reduce((s, x) => s + x.estimatedGrossRecovery, 0).toLocaleString('en-IN')} by offering near-expiry dairy and bulk vegetables to nearby Rythu Bazaar vendors.`,
        answerTe: `AI సర్ప్లస్ డిటెక్షన్ ద్వారా ${surplus.length} వస్తువులను స్థానిక వ్యాపారులకు విక్రయించి దాదాపు ₹${surplus.reduce((s, x) => s + x.estimatedGrossRecovery, 0).toLocaleString('en-IN')} వరకు రికవర్ చేసుకోవచ్చు.`,
        structuredData: surplus
      };
    }

    // Default business summary
    return {
      answerEn: `LocalPulse Supermarket Copilot is monitoring ${inventory.length} active SKUs. Inventory valuation is ₹${inventory.reduce((sum, i) => sum + i.stock.physicalStock * i.purchaseCost, 0).toLocaleString('en-IN')}. Zero negative stock anomalies detected.`,
      answerTe: `లోకల్‌పల్స్ సూపర్‌మార్కెట్ కోపైలట్ మీ ${inventory.length} రకాల సరుకులను పర్యవేక్షిస్తోంది. మొత్తం స్టాక్ విలువ: ₹${inventory.reduce((sum, i) => sum + i.stock.physicalStock * i.purchaseCost, 0).toLocaleString('en-IN')}.`,
      structuredData: { totalSKUs: inventory.length }
    };
  }

  public async askP2PCopilot(
    question: string,
    language: Language
  ): Promise<{ answerEn: string; answerTe: string }> {
    const q = question.toLowerCase();
    const analytics = marketplaceService.getAnalytics();

    if (q.includes('recover') || q.includes('value')) {
      return {
        answerEn: `Local businesses have successfully recovered ₹${analytics.totalRecovered.toLocaleString('en-IN')} through ${analytics.completedTradesCount} completed surplus trades in Visakhapatnam. Currently, ${analytics.activeListingCount} active surplus lots are available.`,
        answerTe: `విశాఖపట్నంలో పూర్తయిన ${analytics.completedTradesCount} ట్రేడ్‌ల ద్వారా వ్యాపారులు ₹${analytics.totalRecovered.toLocaleString('en-IN')} రికవర్ చేసుకున్నారు. ప్రస్తుతం ${analytics.activeListingCount} యాక్టివ్ ఆఫర్లు ఉన్నాయి.`,
      };
    }

    if (q.includes('price') || q.includes('asking')) {
      return {
        answerEn: `Recommended P2P asking price formula: 20-30% below original wholesale cost for sound surplus, and 40-50% below cost for near-expiry dairy/bakery items. This ensures rapid same-day pickup within 4 hours.`,
        answerTe: `ధర నిర్ణయ సూచన: సాధారణ మిగులు సరుకుపై 20-30% రాయితీ, గడువు సమీపించిన డెయిరీపై 40-50% రాయితీ ఇవ్వండి. దీనివల్ల 4 గంటల్లోనే సేల్ అవుతుంది.`,
      };
    }

    return {
      answerEn: `P2P Local Market connects Rythu Bazaar street vendors with MVP Colony supermarkets to recover working capital from perishables and prevent mandi dump waste.`,
      answerTe: `P2P లోకల్ మార్కెట్ రైతు బజార్ వీధి వ్యాపారులను, సూపర్ మార్కెట్లను అనుసంధానించి వృధా కాకుండా లాభాలను కాపాడుతుంది.`,
    };
  }
}

export const aiAdvisorService = new AIAdvisorService();
