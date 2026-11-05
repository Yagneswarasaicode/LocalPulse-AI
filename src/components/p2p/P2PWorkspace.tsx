import React, { useState } from 'react';
import { Language, Business } from '../../types';
import { translations } from '../../translations';
import { P2PDiscover } from './P2PDiscover';
import { P2PSurplusSuggestions } from './P2PSurplusSuggestions';
import { P2PSellStock } from './P2PSellStock';
import { P2PMyListings } from './P2PMyListings';
import { P2PBuyRequests } from './P2PBuyRequests';
import { P2PTradeHistory } from './P2PTradeHistory';
import { P2PCopilot } from './P2PCopilot';
import { P2P_SAMPLE_BUSINESSES } from '../../sampleData/p2pSamples';
import { 
  Store, 
  Sparkles, 
  PlusCircle, 
  Layers, 
  Inbox, 
  History, 
  Bot, 
  UserCheck 
} from 'lucide-react';

interface P2PWorkspaceProps {
  language: Language;
}

export const P2PWorkspace: React.FC<P2PWorkspaceProps> = ({
  language,
}) => {
  const [activeSection, setActiveSection] = useState<string>('discover');
  const [activeBusinessId, setActiveBusinessId] = useState<string>('biz-vendor-1');
  const t = translations[language];

  const currentBusiness = P2P_SAMPLE_BUSINESSES.find(b => b.id === activeBusinessId) || P2P_SAMPLE_BUSINESSES[0];

  const sections = [
    { id: 'discover', label: t.navP2PDiscover, icon: Store },
    { id: 'surplus', label: t.navP2PSurplus, icon: Sparkles, badge: 'AI' },
    { id: 'sell', label: t.navP2PSell, icon: PlusCircle },
    { id: 'my-listings', label: t.navP2PMyListings, icon: Layers },
    { id: 'inquiries', label: t.navP2PInquiries, icon: Inbox },
    { id: 'trades', label: t.navP2PTrades, icon: History },
    { id: 'copilot', label: 'Market Copilot', icon: Bot, badge: 'AI' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Identity Switcher & Sub-nav */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-surface-card border border-surface-border rounded-2xl p-3 shadow-card">
        {/* Sub-nav buttons */}
        <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
          {sections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-navy-600 hover:text-navy-900 hover:bg-navy-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-navy-400'}`} />
                <span>{sec.label}</span>
                {sec.badge && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-600 font-mono px-1 rounded">
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Demo Business Perspective Switcher */}
        <div className="flex items-center gap-2 shrink-0 bg-navy-50 px-3 py-1.5 rounded-xl border border-navy-200">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="text-xs text-navy-600 font-medium whitespace-nowrap">View as:</span>
          <select
            value={activeBusinessId}
            onChange={(e) => setActiveBusinessId(e.target.value)}
            className="text-xs font-bold bg-transparent text-navy-900 focus:outline-none cursor-pointer"
          >
            {P2P_SAMPLE_BUSINESSES.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Render Active Sub-section */}
      {activeSection === 'discover' && (
        <P2PDiscover
          currentBuyerId={currentBusiness.id}
          currentBuyerName={currentBusiness.name}
          currentBuyerType={currentBusiness.type}
          onNavigateTab={setActiveSection}
          language={language}
        />
      )}

      {activeSection === 'surplus' && (
        <P2PSurplusSuggestions
          currentBusinessId={currentBusiness.id}
          currentBusinessType={currentBusiness.type}
          currentBusinessName={currentBusiness.name}
          onNavigateTab={setActiveSection}
          language={language}
        />
      )}

      {activeSection === 'sell' && (
        <P2PSellStock
          currentSellerId={currentBusiness.id}
          currentSellerName={currentBusiness.name}
          currentSellerType={currentBusiness.type}
          onNavigateTab={setActiveSection}
          language={language}
        />
      )}

      {activeSection === 'my-listings' && (
        <P2PMyListings
          currentSellerId={currentBusiness.id}
          onNavigateTab={setActiveSection}
          language={language}
        />
      )}

      {activeSection === 'inquiries' && (
        <P2PBuyRequests
          currentBusinessId={currentBusiness.id}
          currentBusinessName={currentBusiness.name}
          onNavigateTab={setActiveSection}
          language={language}
        />
      )}

      {activeSection === 'trades' && (
        <P2PTradeHistory
          language={language}
        />
      )}

      {activeSection === 'copilot' && (
        <P2PCopilot
          language={language}
        />
      )}
    </div>
  );
};
