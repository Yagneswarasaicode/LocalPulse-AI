import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, RefreshCw, X, Sparkles, Layers } from 'lucide-react';
import { Language } from '../types';

interface PhotoScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyInventoryUpdates: (updates: Array<{ nameEn: string; remainingKg: number }>) => void;
  language: Language;
}

export const PhotoScanModal: React.FC<PhotoScanModalProps> = ({
  isOpen,
  onClose,
  onApplyInventoryUpdates,
  language,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<'crate1' | 'crate2' | 'custom'>('crate1');
  const [detectedItems, setDetectedItems] = useState<Array<{ nameEn: string; nameTe: string; remainingKg: number; confidence: number }>>([
    { nameEn: 'Tomato (Fresh)', nameTe: 'టమాటాలు', remainingKg: 8, confidence: 96 },
    { nameEn: 'Onion', nameTe: 'ఉల్లిపాయలు', remainingKg: 15, confidence: 94 },
    { nameEn: 'Green Chilli', nameTe: 'పచ్చిమిర్చి', remainingKg: 2, confidence: 91 },
  ]);

  const presetPhotos = [
    {
      id: 'crate1' as const,
      title: 'Poorna Market Crate Stack (Morning Batch)',
      titleTe: 'పూర్ణా మార్కెట్ క్రేట్ స్టాక్',
      items: [
        { nameEn: 'Tomato (Fresh)', nameTe: 'టమాటాలు', remainingKg: 8, confidence: 96 },
        { nameEn: 'Onion', nameTe: 'ఉల్లిపాయలు', remainingKg: 15, confidence: 94 },
        { nameEn: 'Green Chilli', nameTe: 'పచ్చిమిర్చి', remainingKg: 2, confidence: 91 },
      ],
      description: 'Morning inspection crates from MVP Rythu Bazaar vendor stall.'
    },
    {
      id: 'crate2' as const,
      title: 'MVP Rythu Bazaar Stall Crates (Grounded)',
      titleTe: 'MVP రైతు బజార్ స్టాల్ నిల్వ',
      items: [
        { nameEn: 'Brinjal', nameTe: 'వంకాయలు', remainingKg: 5, confidence: 95 },
        { nameEn: 'Ladies Finger', nameTe: 'బెండకాయలు', remainingKg: 3, confidence: 93 },
        { nameEn: 'Carrot', nameTe: 'క్యారెట్', remainingKg: 4, confidence: 90 },
      ],
      description: 'Mixed vegetable basket before morning mandi procurement trip.'
    }
  ];

  const handleRunScan = (presetId: 'crate1' | 'crate2') => {
    setSelectedPreset(presetId);
    setIsScanning(true);
    setTimeout(() => {
      const match = presetPhotos.find(p => p.id === presetId);
      if (match) {
        setDetectedItems(match.items);
      }
      setIsScanning(false);
    }, 1200);
  };

  const handleApply = () => {
    onApplyInventoryUpdates(detectedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-card rounded-2xl max-w-xl w-full border border-surface-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {language === 'te' ? 'ఫోటో క్రేట్ స్కానర్ (AI Crate Vision)' : 'Photo Crate Vision Scanner'}
              </h3>
              <p className="text-xs text-navy-300">
                {language === 'te' ? 'కూరగాయల క్రేట్‌ను స్కాన్ చేసి మిగిలిన స్టాక్‌ను లెక్కించండి' : 'Estimate crate weights visually before mandi procurement'}
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
          {/* Preset Photo Selector */}
          <div>
            <label className="text-xs font-bold text-navy-700 uppercase tracking-wider block mb-2">
              {language === 'te' ? 'విశాఖ మండి క్రేట్ ఫోటో ఎంచుకోండి లేదా స్కాన్ చేయండి:' : 'Select Vizag Mandi Crate Photo to scan:'}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {presetPhotos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleRunScan(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedPreset === p.id
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-navy-200 hover:border-navy-400 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-navy-900">{language === 'te' ? p.titleTe : p.title}</span>
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <p className="text-[11px] text-navy-500 line-clamp-1">{p.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Vision Viewfinder Simulation */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-emerald-400 bg-navy-950 h-56 flex items-center justify-center text-white">
            {/* Visual background simulation */}
            <div className="absolute inset-0 bg-gradient-to-tr from-navy-900 via-navy-950 to-slate-900 opacity-90"></div>

            {/* Simulated Produce Crate Graphics with overlay boxes */}
            <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
              <div className="flex justify-between items-start">
                <span className="bg-emerald-500/80 text-white font-mono text-[10px] px-2 py-0.5 rounded tracking-wide">
                  VISION FEED: 1080p RGB • VISAKHAPATNAM
                </span>
                <span className="bg-navy-900/90 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/40">
                  {isScanning ? 'SCANNING CRATE...' : 'OBJECTS DETECTED: 3'}
                </span>
              </div>

              {/* Bounding box graphics */}
              {!isScanning && (
                <div className="grid grid-cols-3 gap-2 h-28 my-auto">
                  {detectedItems.map((item, idx) => (
                    <div key={idx} className="relative border-2 border-emerald-400 bg-emerald-500/15 rounded-lg flex flex-col justify-between p-1.5 backdrop-blur-2xs animate-fadeIn">
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded w-fit">
                        {item.nameEn} ({item.confidence}%)
                      </span>
                      <span className="text-xs font-extrabold text-emerald-200">
                        ~{item.remainingKg} kg
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Scanner Line Animation */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#008F80] animate-bounce"></div>
              )}

              <div className="flex justify-between items-end text-[10px] text-navy-400 font-mono">
                <span>STALL: POORNA MKT #42</span>
                <span>VOLUMETRIC ESTIMATION ENGINE</span>
              </div>
            </div>

            {isScanning && (
              <div className="relative z-10 flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <span className="text-xs font-semibold text-emerald-200">
                  {language === 'te' ? 'క్రేట్ పరిమాణం విశ్లేషిస్తోంది...' : 'Calculating crate vegetable weights...'}
                </span>
              </div>
            )}
          </div>

          {/* Detected Quantities Summary */}
          {!isScanning && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'te' ? 'AI కెమెరా గుర్తించిన నిల్వలు:' : 'Vision Engine Detected Weights:'}</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">Mean Confidence: 93.6%</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {detectedItems.map((item, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-emerald-200 shadow-xs">
                    <div className="text-xs font-bold text-navy-900">{item.nameEn}</div>
                    <div className="text-[11px] text-navy-500">{item.nameTe}</div>
                    <div className="text-sm font-extrabold text-emerald-700 mt-1">{item.remainingKg} kg</div>
                  </div>
                ))}
              </div>
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
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'te' ? 'స్టాక్‌కి జోడించు' : 'Apply Crate Weights'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
