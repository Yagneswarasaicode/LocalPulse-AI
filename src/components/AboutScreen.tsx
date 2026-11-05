import React, { useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { MainActionButton } from './MainActionButton';
import { 
  Building2, 
  MapPin, 
  Users, 
  ExternalLink, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  CreditCard, 
  Trash2, 
  RotateCcw, 
  AlertTriangle, 
  ShieldCheck, 
  Award,
  Zap,
  DollarSign
} from 'lucide-react';

interface AboutScreenProps {
  onClearData: () => void;
  onResetToSample: () => void;
  onGeneratePlan: () => void;
  language: Language;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({
  onClearData,
  onResetToSample,
  onGeneratePlan,
  language,
}) => {
  const t = translations[language];
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const facts = [
    {
      num: '1',
      title: t.fact1Title,
      text: t.fact1Text,
      source: t.fact1Source,
      url: 'https://www.frontiersin.org/journals/sustainable-food-systems/articles/10.3389/fsufs.2026.1773566/full',
      tag: '6.8%–12.9% Loss'
    },
    {
      num: '2',
      title: t.fact2Title,
      text: t.fact2Text,
      source: t.fact2Source,
      url: 'https://www.nextias.com/ca/editorial-analysis/01-07-2026/kirana-stores-quick-commerce',
      tag: '30%–45% Trapped'
    },
    {
      num: '3',
      title: t.fact3Title,
      text: t.fact3Text,
      source: t.fact3Source,
      url: 'https://marketunfolds.com/poorna-market-visakhapatnam/',
      tag: '12,000+ Vendors'
    }
  ];

  const handleConfirmClear = () => {
    onClearData();
    setShowClearConfirm(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Screen Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Screen 4 • Mission & Architecture
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              {t.aboutTitle}
            </h1>
            <p className="text-sm sm:text-base text-navy-600 mt-1 max-w-3xl leading-relaxed">
              {t.aboutSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-900 text-white font-mono text-xs font-bold shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              TEAM {t.team}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Vizag, AP
            </span>
          </div>
        </div>
      </div>

      {/* Verified Research Facts (2-3 Stat Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span>{t.whyItMattersHeader}</span>
          </h2>
          <span className="text-xs text-navy-500 font-medium">Peer-reviewed 2026 citations</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {facts.map((fact) => (
            <div
              key={fact.num}
              className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-card flex flex-col justify-between hover:border-emerald-400 hover:shadow-elevated transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="w-7 h-7 rounded-lg bg-navy-900 text-emerald-300 font-extrabold text-xs flex items-center justify-center">
                    0{fact.num}
                  </span>
                  <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    {fact.tag}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-navy-900 mb-2 group-hover:text-emerald-700 transition-colors">
                  {fact.title}
                </h3>
                <p className="text-xs text-navy-600 leading-relaxed mb-4">
                  {fact.text}
                </p>
              </div>

              <a
                href={fact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pt-3 border-t border-surface-border text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center justify-between group-hover:underline"
              >
                <span className="truncate">{fact.source}</span>
                <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Main Action Button (Prominent Call to Action) */}
      <MainActionButton
        onClick={onGeneratePlan}
        language={language}
        label={t.generatePlanBtn}
        sublabel={language === 'te' 
          ? 'ఉదయపు బడ్జెట్-సేఫ్ కొనుగోలు ప్లాన్‌ను తక్షణమే ప్రారంభించండి' 
          : 'Generate risk-free morning vegetable procurement plan before spending cash'}
      />

      {/* Problem & Solution Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Problem Card */}
        <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-3">
          <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>{t.problemHeader}</span>
          </div>
          <h3 className="text-lg font-bold text-navy-900">
            Perishable Spoilage & Guesswork in Morning Mandis
          </h3>
          <p className="text-sm text-navy-600 leading-relaxed">
            {t.problemText}
          </p>
          <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 font-medium">
            <strong>Vendor Reality:</strong> A vegetable vendor at MVP Rythu Bazaar spending ₹2,000 blind daily risks ₹240/day in unsold wilted tomatoes and rot. Over a month, that is ₹7,200 of working capital wiped out.
          </div>
        </div>

        {/* Solution Card */}
        <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-card space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{t.solutionHeader}</span>
          </div>
          <h3 className="text-lg font-bold text-navy-900">
            Pre-Procurement Decision Intelligence
          </h3>
          <p className="text-sm text-navy-600 leading-relaxed">
            {t.solutionText}
          </p>
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-medium">
            <strong>What Makes Us Different:</strong> {t.diffText}
          </div>
        </div>
      </div>

      {/* Micro-SaaS Pricing Card (Weekly Pass) */}
      <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 sm:p-8 shadow-elevated border border-navy-800">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <CreditCard className="w-4 h-4" />
            <span>{t.pricingHeader}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Priced to Pay for Itself in One Morning
          </h2>
          <p className="text-xs sm:text-sm text-navy-300 mt-1 mb-6">
            {t.pricingSubtitle} Vendors save ₹350–₹600 daily in spoilage for only ₹4/day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          {/* Weekly Pass */}
          <div className="bg-navy-800/90 rounded-2xl p-5 border-2 border-emerald-500 relative shadow-lg">
            <div className="absolute -top-3 right-4 bg-emerald-500 text-navy-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="font-bold text-base text-white">{t.weeklyPass}</div>
            <div className="text-3xl font-extrabold text-emerald-400 my-2">
              {t.weeklyPrice}
            </div>
            <p className="text-xs text-navy-300 mb-4">{t.weeklyPerDay}</p>
            <ul className="text-xs text-navy-200 space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unlimited Telugu Voice & Photo Scans</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Overrun Math Optimization</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant WhatsApp Mandi Slips</span>
              </li>
            </ul>
            <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs">
              Subscribe with Daily Profits
            </button>
          </div>

          {/* Monthly Pass */}
          <div className="bg-navy-800/60 rounded-2xl p-5 border border-navy-700 relative">
            <div className="font-bold text-base text-white">{t.monthlyPass}</div>
            <div className="text-3xl font-extrabold text-white my-2">
              {t.monthlyPrice}
            </div>
            <p className="text-xs text-emerald-300 mb-4 font-semibold">{t.monthlySavings}</p>
            <ul className="text-xs text-navy-300 space-y-2 mb-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Month Spoilage Immunity</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Poorna Market Weekly Price Alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Priority Telugu AI Voice Engine</span>
              </li>
            </ul>
            <button className="w-full py-2 bg-navy-700 hover:bg-navy-600 text-white font-bold text-xs rounded-xl transition-colors">
              Subscribe Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Live Impact Stats Strip */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-navy-500 mb-4">
          {t.statsStripTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-navy-50 border border-navy-100 text-center sm:text-left">
            <span className="text-xs text-navy-500 font-semibold block mb-1">
              {t.statDaps}
            </span>
            <div className="text-3xl font-extrabold text-navy-900 font-mono">
              {t.statDapsValue}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium">Daily Active Procurement Scans</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center sm:text-left">
            <span className="text-xs text-emerald-800 font-semibold block mb-1">
              {t.statSpoilage}
            </span>
            <div className="text-3xl font-extrabold text-emerald-700 font-mono">
              {t.statSpoilageValue}
            </div>
            <span className="text-[11px] text-emerald-800 font-medium">Average loss reduction in kg</span>
          </div>

          <div className="p-4 rounded-xl bg-navy-50 border border-navy-100 text-center sm:text-left">
            <span className="text-xs text-navy-500 font-semibold block mb-1">
              {t.statRetention}
            </span>
            <div className="text-3xl font-extrabold text-navy-900 font-mono">
              {t.statRetentionValue}
            </div>
            <span className="text-[11px] text-navy-600 font-medium">Vendor repeat weekly usage</span>
          </div>
        </div>
      </div>

      {/* Reset & Clear Data Controls */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-navy-900 text-sm">
            {language === 'te' ? 'బ్రౌజర్ డేటా నిర్వహణ' : 'Browser Storage & Data Reset'}
          </h4>
          <p className="text-xs text-navy-500 mt-0.5">
            {language === 'te' 
              ? 'మీ సమాచారం బ్రౌజర్‌లో భద్రపరచబడింది. అవసరమైతే రీసెట్ చేయండి.' 
              : 'Your inventory updates are saved locally in localStorage across reloads.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetToSample}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-700 border border-navy-200 font-semibold text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetToSample}</span>
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearData}</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-surface-card rounded-2xl max-w-md w-full p-6 border border-surface-border shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-lg text-navy-900">
                {language === 'te' ? 'డేటాను క్లియర్ చేయాలా?' : 'Clear all stored data?'}
              </h3>
              <p className="text-xs text-navy-600 mt-1">
                {t.clearDataConfirm}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-navy-200 text-navy-700 font-semibold text-sm hover:bg-navy-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xs"
              >
                Clear & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
