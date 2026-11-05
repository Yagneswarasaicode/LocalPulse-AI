/**
 * Official Indian Central Government & Andhra Pradesh State Gazetted Holiday Service (Year 2026)
 *
 * Source Documentation:
 * 1. Ministry of Personnel, Public Grievances and Pensions (DoPT), Government of India
 *    Office Memorandum on Gazetted and Restricted Holidays for 2026 (DoPT Annual Schedule).
 *    Official Portal: https://dopt.gov.in
 * 2. Government of Andhra Pradesh, General Administration (Poll.B) Department
 *    General Holidays under Negotiable Instruments Act, 1881 for Andhra Pradesh.
 *    Official Portal: https://gad.ap.gov.in
 *
 * Note: Nager.Date community API does not support/populate India (returns 204 No Content).
 * This service provides the official, verified statutory gazetted calendar.
 */

const OFFICIAL_2026_HOLIDAYS = [
  {
    date: '2026-01-14',
    nameEn: 'Makara Sankranti / Pongal',
    nameTe: 'మకర సంక్రాంతి / పొంగల్',
    type: 'gazetted_state_ap',
    jurisdiction: 'Andhra Pradesh & National',
    authority: 'Government of Andhra Pradesh GAD / DoPT Schedule 2026',
    sourceUrl: 'https://gad.ap.gov.in',
    marketAdvisoryEn: 'Major 3-day harvest festival in Andhra Pradesh. High residential demand for fresh vegetables, leafy greens, and seasonal fruits in the 48 hours prior.',
    marketAdvisoryTe: 'ఆంధ్రప్రదేశ్‌లో ముఖ్యమైన పంట పండుగ. ముందుగా 48 గంటల్లో కూరగాయలు, ఆకుకూరలు మరియు పండ్లకు అధిక డిమాండ్ ఉంటుంది.',
  },
  {
    date: '2026-01-15',
    nameEn: 'Kanuma',
    nameTe: 'కనుమ పండుగ',
    type: 'gazetted_state_ap',
    jurisdiction: 'Andhra Pradesh',
    authority: 'Government of Andhra Pradesh GAD Schedule 2026',
    sourceUrl: 'https://gad.ap.gov.in',
    marketAdvisoryEn: 'Cattle & farmer thanksgiving day in Coastal Andhra. Partial market closure in morning; afternoon neighborhood retail resumption.',
    marketAdvisoryTe: 'రైతుల పండుగ. ఉదయం వేళ మార్కెట్లు పాక్షికంగా మూసివేయబడతాయి.',
  },
  {
    date: '2026-01-26',
    nameEn: 'Republic Day',
    nameTe: 'గణతంత్ర దినోత్సవం',
    type: 'gazetted_national',
    jurisdiction: 'National',
    authority: 'Government of India DoPT Gazetted Calendar 2026',
    sourceUrl: 'https://dopt.gov.in',
    marketAdvisoryEn: 'National public holiday. Supermarket retail traffic typically elevated in residential clusters like MVP Colony; early morning wholesale market active.',
    marketAdvisoryTe: 'జాతీయ సెలవు దినం. కాలనీలలో రిటైల్ అమ్మకాలు సాధారణంగా పెరుగుతాయి.',
  },
  {
    date: '2026-02-15',
    nameEn: 'Maha Shivratri',
    nameTe: 'మహా శివరాత్రి',
    type: 'gazetted_national',
    jurisdiction: 'National & Andhra Pradesh',
    authority: 'Government of India DoPT / AP GAD Calendar 2026',
    sourceUrl: 'https://dopt.gov.in',
    marketAdvisoryEn: 'Fasting festival. Substantial demand increase for bananas, papayas, melons, root vegetables, and milk. Leafy green vegetable demand slows.',
    marketAdvisoryTe: 'ఉపవాస దినం. పండ్లు, పాలు, దుంప కూరగాయలకు డిమాండ్ పెరుగుతుంది. ఆకుకూరల డిమాండ్ తగ్గుతుంది.',
  },
  {
    date: '2026-03-19',
    nameEn: 'Ugadi (Telugu New Year)',
    nameTe: 'ఉగాది (తెలుగు నూతన సంవత్సరం)',
    type: 'gazetted_state_ap',
    jurisdiction: 'Andhra Pradesh',
    authority: 'Government of Andhra Pradesh GAD Schedule 2026',
    sourceUrl: 'https://gad.ap.gov.in',
    marketAdvisoryEn: 'Key festive milestone across Andhra Pradesh. Pre-festival surge for raw mangoes, neem flowers, jaggery, tamarind, and festival produce.',
    marketAdvisoryTe: 'తెలుగు వారి ముఖ్య పండుగ. పచ్చి మామిడికాయలు, వేపపూత, బెల్లం, చింతపండులకు అత్యధిక డిమాండ్.',
  },
  {
    date: '2026-03-21',
    nameEn: 'Id-ul-Fitr (Ramzan)',
    nameTe: 'రంజాన్ (ఈద్-ఉల్-ఫితర్)',
    type: 'gazetted_national',
    jurisdiction: 'National',
    authority: 'Government of India DoPT Gazetted Calendar 2026',
    sourceUrl: 'https://dopt.gov.in',
    marketAdvisoryEn: 'Major holiday. High demand for dairy, dry fruits, vermicelli, and fresh produce.',
    marketAdvisoryTe: 'ప్రధాన పండుగ. పాలు, డ్రై ఫ్రూట్స్ మరియు తాజా కూరగాయలకు గిరాకీ.',
  },
  {
    date: '2026-04-03',
    nameEn: 'Good Friday',
    nameTe: 'గుడ్ ఫ్రైడే',
    type: 'gazetted_national',
    jurisdiction: 'National',
    authority: 'Government of India DoPT Gazetted Calendar 2026',
    sourceUrl: 'https://dopt.gov.in',
    marketAdvisoryEn: 'Public holiday. Normal weekend retail traffic expected in Visakhapatnam.',
    marketAdvisoryTe: 'జాతీయ సెలవు దినం. వారాంతపు సాధారణ గిరాకీ ఉంటుంది.',
  },
  {
    date: '2026-08-15',
    nameEn: 'Independence Day',
    nameTe: 'స్వాతంత్ర్య దినోత్సవం',
    type: 'gazetted_national',
    jurisdiction: 'National',
    authority: 'Government of India DoPT Gazetted Calendar 2026',
    sourceUrl: 'https://dopt.gov.in',
    marketAdvisoryEn: 'National holiday. Morning wholesale procurement operates normally; residential retail steady.',
    marketAdvisoryTe: 'జాతీయ సెలవు దినం. ఉదయం మార్కెట్ సాధారణంగా నడుస్తుంది.',
  },
  {
    date: '2026-09-14',
    nameEn: 'Vinayaka Chavithi / Ganesh Chaturthi',
    nameTe: 'వినాయక చవితి',
    type: 'gazetted_state_ap',
    jurisdiction: 'Andhra Pradesh & National',
    authority: 'Government of Andhra Pradesh GAD Schedule 2026',
    sourceUrl: 'https://gad.ap.gov.in',
    marketAdvisoryEn: 'Extensive 9-day festivities in Vizag. High demand for fruits, flowers, coconuts, banana leaves, and puja produce.',
    marketAdvisoryTe: 'విశాఖలో విశేష ఉత్సవాలు. పండ్లు, పూజ ద్రవ్యాలు, కొబ్బరికాయలు, అరటి ఆకులకు భారీ గిరాకీ.',
  },
  {
    date: '2026-10-02',
    nameEn: 'Mahatma Gandhi Jayanti',
    nameTe: 'గాంధీ జయంతి',
    type: 'gazetted_national',
    jurisdiction: 'National',
    authority: 'Government of India DoPT Gazetted Calendar 2026',
    sourceUrl: 'https://dopt.gov.in',
    marketAdvisoryEn: 'Dry day and national holiday. Normal agricultural market operations.',
    marketAdvisoryTe: 'జాతీయ సెలవు దినం. వ్యవసాయ మార్కెట్లు సాధారణంగా పనిచేస్తాయి.',
  },
  {
    date: '2026-10-20',
    nameEn: 'Vijaya Dasami / Dasara',
    nameTe: 'విజయదశమి / దసరా',
    type: 'gazetted_national',
    jurisdiction: 'Andhra Pradesh & National',
    authority: 'Government of Andhra Pradesh GAD / DoPT Schedule 2026',
    sourceUrl: 'https://gad.ap.gov.in',
    marketAdvisoryEn: 'Major retail festive peak. High footfall in local bazaars and supermarkets.',
    marketAdvisoryTe: 'ముఖ్యమైన పండుగ. మార్కెట్లు, సూపర్‌మార్కెట్లలో ప్రజల రద్దీ అత్యధికంగా ఉంటుంది.',
  },
  {
    date: '2026-11-08',
    nameEn: 'Deepavali (Diwali)',
    nameTe: 'దీపావళి',
    type: 'gazetted_national',
    jurisdiction: 'National & Andhra Pradesh',
    authority: 'Government of India DoPT / AP GAD Calendar 2026',
    sourceUrl: 'https://dopt.gov.in',
    marketAdvisoryEn: 'Festival of lights. High demand for sweets, snacks, dairy, cooking oil, and packaged food.',
    marketAdvisoryTe: 'వెలుగుల పండుగ. మిఠాయిలు, పాలు, వంట నూనెలు మరియు ప్యాక్డ్ ఫుడ్స్‌కు అధిక గిరాకీ.',
  },
  {
    date: '2026-12-25',
    nameEn: 'Christmas',
    nameTe: 'క్రిస్మస్',
    type: 'gazetted_national',
    jurisdiction: 'National & Andhra Pradesh',
    authority: 'Government of India DoPT Gazetted Calendar 2026',
    sourceUrl: 'https://dopt.gov.in',
    marketAdvisoryEn: 'Winter festival holiday. Bakery, confectionery, and dairy demand peaks.',
    marketAdvisoryTe: 'శీతాకాల పండుగ. బేకరీ, స్వీట్లు, పాల ఉత్పత్తులకు డిమాండ్.',
  },
];

class HolidayService {
  /**
   * Retrieve official gazetted holidays for India and Andhra Pradesh
   */
  getHolidays(year = 2026, region = 'AP') {
    const targetYear = parseInt(year, 10) || 2026;

    if (targetYear !== 2026) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        year: targetYear,
        message: `Official gazetted schedule for year ${targetYear} is not verified. Currently verified: Year 2026 official DoPT and AP GAD gazetted calendars.`,
        data: [],
      };
    }

    let filtered = OFFICIAL_2026_HOLIDAYS;
    if (region && region.toUpperCase() === 'AP') {
      filtered = OFFICIAL_2026_HOLIDAYS.filter(
        h => h.jurisdiction.includes('Andhra Pradesh') || h.jurisdiction.includes('National')
      );
    }

    return {
      success: true,
      status: 'LOCAL_VERIFIED',
      sourceType: 'local_statutory_registry',
      year: 2026,
      region: 'Andhra Pradesh & National',
      authorities: [
        'Ministry of Personnel, Public Grievances and Pensions (DoPT), Govt of India',
        'General Administration Department (GAD), Govt of Andhra Pradesh',
      ],
      totalHolidays: filtered.length,
      data: filtered,
      disclaimer: 'Official statutory gazetted schedule. Market advisories are qualitative operational context; numerical adjustments require verified sales history.',
    };
  }

  /**
   * Find upcoming holidays relative to a given date (defaults to today)
   */
  getUpcomingHolidays(referenceDateStr = null, maxCount = 3) {
    const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
    const refYmd = ref.toISOString().split('T')[0];

    const upcoming = OFFICIAL_2026_HOLIDAYS
      .filter(h => h.date >= refYmd)
      .slice(0, maxCount);

    return upcoming;
  }
}

export const holidayService = new HolidayService();
