import React, { useState, useEffect, useMemo } from 'react';
import { 
  VegetableItem, 
  ActiveScreen, 
  Language, 
  ProcurementPlan,
  WorkspaceTab
} from './types';
import { INITIAL_SAMPLE_VEGETABLES, DEFAULT_BUDGET } from './sampleData';
import { calculateProcurementPlan } from './utils/procurementMath';
import { Navbar } from './components/Navbar';
import { MorningCheckScreen } from './components/MorningCheckScreen';
import { SmartPlanScreen } from './components/SmartPlanScreen';
import { AICopilotScreen } from './components/AICopilotScreen';
import { AboutScreen } from './components/AboutScreen';
import { VoiceModal } from './components/VoiceModal';
import { PhotoScanModal } from './components/PhotoScanModal';
import { SupermarketWorkspace } from './components/supermarket/SupermarketWorkspace';
import { P2PWorkspace } from './components/p2p/P2PWorkspace';
import { Sparkles, MapPin, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY_ITEMS = 'localpulse_vegetables_v1';
const STORAGE_KEY_BUDGET = 'localpulse_budget_v1';
const STORAGE_KEY_LANG = 'localpulse_lang_v1';
const STORAGE_KEY_WORKSPACE = 'localpulse_active_workspace_v1';

export const App: React.FC = () => {
  // Active Workspace Tab (Vendor | Supermarket | P2P Local Market)
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceTab>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WORKSPACE);
      if (saved === 'vendor' || saved === 'supermarket' || saved === 'p2p') return saved;
    } catch (e) {
      console.warn('Could not read active workspace from localStorage:', e);
    }
    return 'vendor';
  });

  // Load Vendor state from localStorage or use initial defaults (100% Preserved)
  const [items, setItems] = useState<VegetableItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read items from localStorage:', e);
    }
    return INITIAL_SAMPLE_VEGETABLES;
  });

  const [budget, setBudget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BUDGET);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {
      console.warn('Could not read budget from localStorage:', e);
    }
    return DEFAULT_BUDGET;
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'te' || saved === 'en') return saved;
    } catch (e) {
      console.warn('Could not read language from localStorage:', e);
    }
    return 'en';
  });

  const [vendorScreen, setVendorScreen] = useState<ActiveScreen>('morning-check');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WORKSPACE, activeWorkspace);
    } catch (e) {
      console.warn('Failed saving active workspace:', e);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed saving items to localStorage:', e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BUDGET, budget.toString());
    } catch (e) {
      console.warn('Failed saving budget to localStorage:', e);
    }
  }, [budget]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch (e) {
      console.warn('Failed saving language to localStorage:', e);
    }
  }, [language]);

  // Reactive Procurement Plan Math (Preserved Vendor Optimizer)
  const plan: ProcurementPlan = useMemo(() => {
    return calculateProcurementPlan(items, budget);
  }, [items, budget]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Vendor Item Update Handlers
  const handleUpdateItem = (id: string, field: keyof VegetableItem, value: number | string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddItem = (newItemData: Omit<VegetableItem, 'id'>) => {
    const newItem: VegetableItem = {
      ...newItemData,
      id: `veg-${Date.now()}`
    };
    setItems(prev => [newItem, ...prev]);
    showToast(language === 'te' ? 'కూరగాయ విజయవంతంగా జోడించబడింది' : 'Item added to inventory log');
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    showToast(language === 'te' ? 'కూరగాయ తీసివేయబడింది' : 'Item removed');
  };

  const handleResetToSample = () => {
    setItems(INITIAL_SAMPLE_VEGETABLES);
    setBudget(DEFAULT_BUDGET);
    showToast(language === 'te' ? 'నమూనా డేటా విజయవంతంగా లోడ్ చేయబడింది' : 'Reset to official Rythu Bazaar sample records');
  };

  const handleClearData = () => {
    setItems([]);
    setBudget(DEFAULT_BUDGET);
    localStorage.removeItem(STORAGE_KEY_ITEMS);
    localStorage.removeItem(STORAGE_KEY_BUDGET);
    showToast(language === 'te' ? 'మొత్తం డేటా క్లియర్ చేయబడింది' : 'All stored data cleared');
  };

  const handleApplyVoiceUpdates = (updates: Array<{ nameEn: string; remainingKg: number }>) => {
    setItems(prev => prev.map(item => {
      const match = updates.find(u => u.nameEn.toLowerCase() === item.nameEn.toLowerCase());
      if (match) {
        return { ...item, remainingKg: match.remainingKg };
      }
      return item;
    }));
    showToast(language === 'te' ? 'వాయిస్ ద్వారా స్టాక్ అప్‌డేట్ చేయబడింది!' : 'Inventory updated via Telugu Voice!');
  };

  const handleApplyPhotoUpdates = (updates: Array<{ nameEn: string; remainingKg: number }>) => {
    setItems(prev => prev.map(item => {
      const match = updates.find(u => u.nameEn.toLowerCase() === item.nameEn.toLowerCase());
      if (match) {
        return { ...item, remainingKg: match.remainingKg };
      }
      return item;
    }));
    showToast(language === 'te' ? 'ఫోటో స్కానర్ ద్వారా నిల్వలు నమోదయ్యాయి!' : 'Crate weights detected & applied!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-navy-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar with EXACTLY THREE MAIN TABS */}
      <Navbar
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={(ws) => {
          setActiveWorkspace(ws);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        vendorScreen={vendorScreen}
        onSelectVendorScreen={(screen) => {
          setVendorScreen(screen);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        language={language}
        onToggleLanguage={setLanguage}
        vendorBudget={budget}
      />

      {/* Main Workspace Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* WORKSPACE 1: VENDOR (100% PRESERVED) */}
        {activeWorkspace === 'vendor' && (
          <>
            {vendorScreen === 'morning-check' && (
              <MorningCheckScreen
                items={items}
                budget={budget}
                onBudgetChange={setBudget}
                onUpdateItem={handleUpdateItem}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                onResetToSample={handleResetToSample}
                onClearData={handleClearData}
                onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
                onOpenPhotoModal={() => setIsPhotoModalOpen(true)}
                onGeneratePlan={() => {
                  setVendorScreen('smart-plan');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                language={language}
              />
            )}

            {vendorScreen === 'smart-plan' && (
              <SmartPlanScreen
                plan={plan}
                onNavigateToCopilot={() => {
                  setVendorScreen('ai-copilot');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRecalculate={() => {
                  setVendorScreen('morning-check');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                language={language}
              />
            )}

            {vendorScreen === 'ai-copilot' && (
              <AICopilotScreen
                plan={plan}
                onRecalculatePlan={() => {
                  setVendorScreen('morning-check');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                language={language}
              />
            )}

            {vendorScreen === 'about' && (
              <AboutScreen
                onClearData={handleClearData}
                onResetToSample={handleResetToSample}
                onGeneratePlan={() => {
                  setVendorScreen('morning-check');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                language={language}
              />
            )}
          </>
        )}

        {/* WORKSPACE 2: SUPERMARKET (NEW ENTERPRISE SUITE) */}
        {activeWorkspace === 'supermarket' && (
          <SupermarketWorkspace
            language={language}
          />
        )}

        {/* WORKSPACE 3: P2P LOCAL MARKET (NEW SURPLUS RECOVERY) */}
        {activeWorkspace === 'p2p' && (
          <P2PWorkspace
            language={language}
          />
        )}
      </main>

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-navy-700 flex items-center gap-2.5 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Telugu Voice Modal (Vendor) */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onApplyInventoryUpdates={handleApplyVoiceUpdates}
        language={language}
      />

      {/* Photo Vision Scan Modal (Vendor) */}
      <PhotoScanModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onApplyInventoryUpdates={handleApplyPhotoUpdates}
        language={language}
      />

      {/* App Footer */}
      <footer className="bg-navy-950 text-navy-400 border-t border-navy-800/80 py-8 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">LocalPulse AI</span>
            <span>•</span>
            <span className="text-emerald-400">Buy Smarter. Waste Less. Earn More.</span>
          </div>

          <div className="flex items-center gap-3 text-navy-300">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Poorna Market & MVP Rythu Bazaar, Visakhapatnam
            </span>
            <span>|</span>
            <span className="font-semibold text-white">Team VECTORX</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
