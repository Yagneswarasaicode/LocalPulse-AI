import React from 'react';
import { ActiveScreen, Language } from '../types';
import { translations } from '../translations';
import { 
  Sparkles, 
  ClipboardCheck, 
  TrendingUp, 
  Bot, 
  Info, 
  MapPin, 
  Globe 
} from 'lucide-react';

interface NavbarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  budget: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  language,
  onToggleLanguage,
  budget,
}) => {
  const t = translations[language];

  const navItems = [
    {
      id: 'morning-check' as ActiveScreen,
      label: t.navMorningCheck,
      icon: ClipboardCheck,
    },
    {
      id: 'smart-plan' as ActiveScreen,
      label: t.navSmartPlan,
      icon: TrendingUp,
    },
    {
      id: 'ai-copilot' as ActiveScreen,
      label: t.navAICopilot,
      icon: Bot,
      badge: 'Gemini',
    },
    {
      id: 'about' as ActiveScreen,
      label: t.navAbout,
      icon: Info,
    },
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

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Headline */}
          <button
            onClick={() => onNavigate('morning-check')}
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

          {/* Budget Widget on Desktop */}
          <div className="hidden md:flex items-center gap-3 bg-navy-800/80 px-3.5 py-1.5 rounded-lg border border-navy-700/80">
            <div className="text-right">
              <div className="text-[10px] text-navy-300 uppercase tracking-wider font-medium">Daily Cash Limit</div>
              <div className="text-emerald-400 font-bold text-sm">₹{budget.toLocaleString('en-IN')}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-navy-200 hover:text-white hover:bg-navy-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] bg-navy-950/80 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Screen Navigation Bar (Sticky Horizontal Scroll) */}
      <div className="lg:hidden bg-navy-950 border-t border-navy-800/80 px-2 py-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1 min-w-max px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-navy-300 hover:text-white bg-navy-900 border border-navy-800'
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
        </div>
      </div>
    </header>
  );
};
