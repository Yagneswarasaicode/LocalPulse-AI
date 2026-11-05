import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface MainActionButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  language: Language;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const MainActionButton: React.FC<MainActionButtonProps> = ({
  onClick,
  isLoading = false,
  language,
  label,
  sublabel,
  className = '',
}) => {
  const t = translations[language];

  return (
    <div className={`w-full ${className}`}>
      <button
        onClick={onClick}
        disabled={isLoading}
        className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 p-0.5 text-white shadow-xl shadow-emerald-600/20 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-[0.99] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed"
      >
        <div className="relative px-6 py-4 bg-navy-900/10 backdrop-blur-xs rounded-[14px] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-110 transition-transform">
              {isLoading ? (
                <Loader2 className="w-6 h-6 text-emerald-300 animate-spin" />
              ) : (
                <Sparkles className="w-6 h-6 text-emerald-300 animate-pulse-subtle" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-base sm:text-lg font-bold tracking-tight text-white">
                  {label || t.generatePlanBtn}
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[11px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  0 Overrun
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                {sublabel || (language === 'te' 
                  ? 'డబ్బు ఖర్చు చేయడానికి ముందే వృధా కాకుండా లెక్కించండి' 
                  : 'Calculate before spending cash to eliminate spoilage & lock-in')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white font-semibold text-sm bg-white/15 px-4 py-2 rounded-xl border border-white/20 group-hover:bg-white/25 transition-colors shrink-0">
            <span>{isLoading ? t.generating : (language === 'te' ? 'ప్లాన్ చూడండి' : 'View Smart Plan')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </button>
    </div>
  );
};
