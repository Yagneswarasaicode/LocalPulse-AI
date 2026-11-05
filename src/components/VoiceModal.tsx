import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { Language, VegetableItem } from '../types';
import { createSpeechRecognizer } from '../utils/speechHelper';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyInventoryUpdates: (updates: Array<{ nameEn: string; remainingKg: number }>) => void;
  language: Language;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onApplyInventoryUpdates,
  language,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognizedItems, setRecognizedItems] = useState<Array<{ nameEn: string; nameTe: string; remainingKg: number }>>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleTeluguVoicePrompts = [
    {
      te: "టమాటాలు 8 కేజీలు, ఉల్లిపాయలు 15 కేజీలు ఉన్నాయి",
      en: "Tomatoes 8kg, Onions 15kg remaining",
      items: [
        { nameEn: "Tomato (Fresh)", nameTe: "టమాటాలు", remainingKg: 8 },
        { nameEn: "Onion", nameTe: "ఉల్లిపాయలు", remainingKg: 15 }
      ]
    },
    {
      te: "పచ్చిమిర్చి 2 కేజీలు, వంకాయలు 5 కేజీలు ఉన్నాయి",
      en: "Chilli 2kg, Brinjal 5kg remaining",
      items: [
        { nameEn: "Green Chilli", nameTe: "పచ్చిమిర్చి", remainingKg: 2 },
        { nameEn: "Brinjal", nameTe: "వంకాయలు", remainingKg: 5 }
      ]
    },
    {
      te: "బంగాళాదుంపలు 20 కేజీలు, బెండకాయలు 3 కేజీలు ఉన్నాయి",
      en: "Potatoes 20kg, Ladies Finger 3kg remaining",
      items: [
        { nameEn: "Potato", nameTe: "బంగాళాదుంపలు", remainingKg: 20 },
        { nameEn: "Ladies Finger", nameTe: "బెండకాయలు", remainingKg: 3 }
      ]
    }
  ];

  const handleStartListening = () => {
    setErrorMsg('');
    setIsListening(true);

    const recognizer = createSpeechRecognizer(
      language === 'te' ? 'te-IN' : 'en-IN',
      (text) => {
        setTranscript(text);
        parseSpokenText(text);
      },
      (err) => {
        console.warn('Speech error:', err);
        setErrorMsg('Microphone input simulated or not permitted. Try clicking a sample Telugu voice phrase below.');
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (recognizer) {
      try {
        recognizer.start();
      } catch (e) {
        setIsListening(false);
        setErrorMsg('Could not access microphone directly. Please test using sample voice triggers.');
      }
    } else {
      setIsListening(false);
      setErrorMsg('Web Speech API is not enabled in this browser. Please use the simulated Telugu voice triggers below.');
    }
  };

  const parseSpokenText = (text: string) => {
    const detected: Array<{ nameEn: string; nameTe: string; remainingKg: number }> = [];
    const lower = text.toLowerCase();

    const dictionary = [
      { en: 'Tomato (Fresh)', te: 'టమాటాలు', match: ['tomato', 'tomatoes', 'టమాటో', 'టమాటాలు'] },
      { en: 'Onion', te: 'ఉల్లిపాయలు', match: ['onion', 'onions', 'ఉల్లి', 'ఉల్లిపాయలు'] },
      { en: 'Potato', te: 'బంగాళాదుంపలు', match: ['potato', 'potatoes', 'ఆలూ', 'బంగాళాదుంపలు'] },
      { en: 'Green Chilli', te: 'పచ్చిమిర్చి', match: ['chilli', 'green chilli', 'మిర్చి', 'పచ్చిమిర్చి'] },
      { en: 'Brinjal', te: 'వంకాయలు', match: ['brinjal', 'eggplant', 'వంకాయ', 'వంకాయలు'] },
      { en: 'Ladies Finger', te: 'బెండకాయలు', match: ['ladies finger', 'okra', 'బెండకాయ', 'బెండకాయలు'] },
      { en: 'Cabbage', te: 'క్యాబేజీ', match: ['cabbage', 'క్యాబేజీ'] },
      { en: 'Carrot', te: 'క్యారెట్', match: ['carrot', 'క్యారెట్'] },
      { en: 'Ginger', te: 'అల్లం', match: ['ginger', 'అల్లం'] },
      { en: 'Garlic', te: 'వెల్లుల్లి', match: ['garlic', 'వెల్లుల్లి'] }
    ];

    for (const item of dictionary) {
      if (item.match.some(m => lower.includes(m))) {
        // extract digit near phrase
        const regex = new RegExp(`(\\d+)\\s*(kg|కేజీ|కిలో)?.*(${item.match.join('|')})|(${item.match.join('|')}).*?(\\d+)`, 'i');
        const match = lower.match(regex);
        const qty = match ? parseInt(match[1] || match[5] || '5', 10) : 5;
        detected.push({ nameEn: item.en, nameTe: item.te, remainingKg: qty });
      }
    }

    if (detected.length > 0) {
      setRecognizedItems(detected);
    }
  };

  const handleSelectSample = (sample: typeof sampleTeluguVoicePrompts[0]) => {
    setTranscript(sample.te);
    setRecognizedItems(sample.items);
  };

  const handleApply = () => {
    if (recognizedItems.length > 0) {
      onApplyInventoryUpdates(recognizedItems);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-card rounded-2xl max-w-lg w-full border border-surface-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {language === 'te' ? 'తెలుగు వాయిస్ ఇన్వెంటరీ స్కానర్' : 'Telugu Voice Inventory Logger'}
              </h3>
              <p className="text-xs text-navy-300">
                {language === 'te' ? 'పూర్ణా మార్కెట్ & రైతు బజార్ కూరగాయల నమోదు' : 'Speak remaining stock in Telugu or English'}
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

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Mic Button & Waveform */}
          <div className="flex flex-col items-center justify-center py-4 bg-navy-50 rounded-xl border border-navy-100">
            <button
              onClick={isListening ? () => setIsListening(false) : handleStartListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isListening
                  ? 'bg-rose-500 text-white scale-110 shadow-rose-500/30 animate-pulse'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="mt-3 text-sm font-semibold text-navy-800">
              {isListening 
                ? (language === 'te' ? 'వినబడుతోంది... మాట్లాడండి...' : 'Listening... Speak your remaining crates...') 
                : (language === 'te' ? 'మైక్ నొక్కి తెలుగులో మాట్లాడండి' : 'Tap to speak remaining stock')}
            </p>
            <p className="text-xs text-navy-500 mt-0.5">
              {language === 'te' ? 'ఉదాహరణ: "టమాటాలు 8 కేజీలు, ఉల్లిపాయలు 15 కేజీలు"' : 'e.g. "Tomatoes 8kg, Onions 15kg"'}
            </p>
          </div>

          {/* Quick Voice Demo Presets */}
          <div>
            <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
              {language === 'te' ? 'లేదా త్వరిత తెలుగు వాయిస్ నమూనాలు నొక్కండి:' : 'Or tap a 1-click Telugu voice simulation:'}
            </label>
            <div className="space-y-2">
              {sampleTeluguVoicePrompts.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(s)}
                  className="w-full text-left p-3 rounded-xl border border-navy-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-start gap-3 group"
                >
                  <Volume2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="text-sm font-bold text-navy-900 telugu-text">{s.te}</div>
                    <div className="text-xs text-navy-500">{s.en}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transcript Feedback */}
          {transcript && (
            <div className="bg-white p-3.5 rounded-xl border border-navy-200">
              <span className="text-[11px] font-bold text-navy-400 uppercase tracking-wider block mb-1">
                {language === 'te' ? 'గుర్తించిన మాటలు (Transcript):' : 'Spoken Transcript:'}
              </span>
              <p className="text-sm text-navy-800 font-medium italic">"{transcript}"</p>
            </div>
          )}

          {/* Extracted Updates Preview */}
          {recognizedItems.length > 0 && (
            <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'te' ? 'గుర్తించబడిన కూరగాయల నిల్వ:' : 'Detected Inventory Quantities:'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {recognizedItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-emerald-200 text-xs">
                    <div className="font-bold text-navy-900">{item.nameEn}</div>
                    <div className="text-emerald-700 font-semibold">{item.nameTe} - {item.remainingKg} kg</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-surface-bg px-6 py-4 border-t border-surface-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-navy-600 hover:text-navy-900"
          >
            {language === 'te' ? 'రద్దు చేయి' : 'Cancel'}
          </button>
          <button
            onClick={handleApply}
            disabled={recognizedItems.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'te' ? 'స్టాక్‌కి జోడించు' : 'Apply to Inventory'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
