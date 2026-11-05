import React from 'react';
import { WorkspaceTab, ActiveScreen, Language } from '../types';
import { translations } from '../translations';
import { 
  Sparkles, 
  ClipboardCheck, 
  TrendingUp, 
  Bot, 
  Info, 
  MapPin, 
  Globe, 
  Store, 
  Building2, 
  ShoppingBag 
} from 'lucide-react';

interface NavbarProps {
  activeWorkspace: WorkspaceTab;
  onSelectWorkspace: (ws: WorkspaceTab) => void;
  vendorScreen: ActiveScreen;
  onSelectVendorScreen: (screen: ActiveScreen) => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  vendorBudget: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeWorkspace,
  onSelectWorkspace,
  vendorScreen,
  onSelectVendorScreen,
  language,
  onToggleLanguage,
  vendorBudget,
}) => {
  const t = translations[language];

  const vendorNavItems = [
    { id: 'morning-check' as ActiveScreen, label: t.navMorningCheck, icon: ClipboardCheck },
    { id: 'smart-plan' as ActiveScreen, label: t.navSmartPlan, icon: TrendingUp },
    { id: 'ai-copilot' as ActiveScreen, label: t.navAICopilot, icon: Bot, badge: 'Gemini' },
    { id: 'about' as ActiveScreen, label: t.navAbout, icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-navy-900 border-b border-navy-800 text-white shadow-elevated">
      {/* Top micro-bar: Location and Language Switcher */}
      <div className="bg-navy-950 px-4 py-1.5 text-xs text-navy-200 border-b border-navy-800/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{t.location}</span>
          <span className="hidden sm:inline text-navy-400">|</span>
          <span className="hidden sm:inline text-emerald-300 font-medium">Team {t.team}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-navy-800 rounded-md p-0.5 border border-navy-700">
            <Globe className="w-3.5 h-3.5 text-navy-300 ml-1.5 mr-1" />
            <button
              onClick={() => onToggleLanguage('en')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                language === 'en'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-navy-300 hover:text-white'
              }`}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => onToggleLanguage('te')}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                language === 'te'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-navy-300 hover:text-white'
              }`}
              aria-label="Switch to Telugu"
            >
              తెలుగు
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar: Logo & EXACTLY THREE MAIN TABS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-3">
          {/* Logo & Headline */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                onSelectWorkspace('vendor');
                onSelectVendorScreen('morning-check');
              }}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-navy-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                    {t.appName}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Rythu AI
                  </span>
                </div>
                <p className="text-xs text-navy-300 hidden sm:block">
                  {t.oneLinePromise}
                </p>
              </div>
            </button>

            {/* Vendor Budget Badge if on vendor */}
            {activeWorkspace === 'vendor' && (
              <div className="md:hidden flex items-center gap-2 bg-navy-800/80 px-2.5 py-1 rounded-lg border border-navy-700">
                <span className="text-[10px] text-navy-300">Budget:</span>
                <span className="text-emerald-400 font-bold text-xs">₹{vendorBudget.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* EXACTLY THREE MAIN TABS */}
          <div className="flex items-center justify-center bg-navy-950/90 p-1.5 rounded-2xl border border-navy-800 shadow-inner">
            <button
              onClick={() => onSelectWorkspace('vendor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeWorkspace === 'vendor'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102 ring-1 ring-emerald-400/40'
                  : 'text-navy-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span>{t.tabVendor}</span>
            </button>

            <button
              onClick={() => onSelectWorkspace('supermarket')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeWorkspace === 'supermarket'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102 ring-1 ring-emerald-400/40'
                  : 'text-navy-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>{t.tabSupermarket}</span>
            </button>

            <button
              onClick={() => onSelectWorkspace('p2p')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeWorkspace === 'p2p'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-102 ring-1 ring-emerald-400/40'
                  : 'text-navy-300 hover:text-white hover:bg-navy-800'
              }`}
            >
              <Store className="w-4 h-4 text-emerald-300" />
              <span>{t.tabP2P}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Internal Vendor Sub-Navigation (Rendered only when active workspace is VENDOR) */}
      {activeWorkspace === 'vendor' && (
        <div className="bg-navy-950 border-t border-navy-800 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar w-full sm:w-auto" aria-label="Vendor Screens">
              {vendorNavItems.map(item => {
                const Icon = item.icon;
                const isActive = vendorScreen === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectVendorScreen(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-navy-300 hover:text-white hover:bg-navy-900 border border-transparent hover:border-navy-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] bg-navy-950 text-emerald-300 px-1 rounded font-mono">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Desktop Daily Cash Limit Display */}
            <div className="hidden sm:flex items-center gap-3 bg-navy-900 px-3 py-1 rounded-lg border border-navy-800">
              <span className="text-[10px] text-navy-400 uppercase tracking-wider font-medium">Daily Cash Limit:</span>
              <span className="text-emerald-400 font-bold text-xs">₹{vendorBudget.toLocaleString('en-IN')}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
