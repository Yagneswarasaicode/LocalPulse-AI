import React, { useState } from 'react';
import { Language } from '../../types';
import { translations } from '../../translations';
import { SupermarketOverview } from './SupermarketOverview';
import { SupermarketInventory } from './SupermarketInventory';
import { SupermarketImports } from './SupermarketImports';
import { SupermarketSalesHistory } from './SupermarketSalesHistory';
import { SupermarketProcurement } from './SupermarketProcurement';
import { SupermarketAnalytics } from './SupermarketAnalytics';
import { SupermarketCopilot } from './SupermarketCopilot';
import { SupermarketSuppliers } from './SupermarketSuppliers';
import { 
  LayoutDashboard, 
  Package, 
  UploadCloud, 
  Receipt, 
  Sparkles, 
  BarChart3, 
  Bot, 
  Truck 
} from 'lucide-react';

interface SupermarketWorkspaceProps {
  language: Language;
}

export const SupermarketWorkspace: React.FC<SupermarketWorkspaceProps> = ({
  language,
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const t = translations[language];
  const businessId = 'biz-supermarket-1';

  const sections = [
    { id: 'overview', label: t.navSmOverview, icon: LayoutDashboard },
    { id: 'inventory', label: t.navSmInventory, icon: Package },
    { id: 'imports', label: t.navSmImports, icon: UploadCloud },
    { id: 'sales', label: t.navSmSales, icon: Receipt },
    { id: 'procurement', label: t.navSmProcurement, icon: Sparkles },
    { id: 'analytics', label: t.navSmAnalytics, icon: BarChart3 },
    { id: 'copilot', label: t.navSmCopilot, icon: Bot, badge: 'AI' },
    { id: 'suppliers', label: t.navSmSuppliers, icon: Truck },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Sub-navigation bar */}
      <div className="bg-surface-card border border-surface-border rounded-2xl p-1.5 shadow-card overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1 min-w-max">
          {sections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
      </div>

      {/* Render Active Section */}
      {activeSection === 'overview' && (
        <SupermarketOverview
          businessId={businessId}
          onNavigateSection={setActiveSection}
          language={language}
        />
      )}

      {activeSection === 'inventory' && (
        <SupermarketInventory
          businessId={businessId}
          language={language}
        />
      )}

      {activeSection === 'imports' && (
        <SupermarketImports
          businessId={businessId}
          language={language}
        />
      )}

      {activeSection === 'sales' && (
        <SupermarketSalesHistory
          businessId={businessId}
          language={language}
        />
      )}

      {activeSection === 'procurement' && (
        <SupermarketProcurement
          businessId={businessId}
          language={language}
        />
      )}

      {activeSection === 'analytics' && (
        <SupermarketAnalytics
          businessId={businessId}
          language={language}
        />
      )}

      {activeSection === 'copilot' && (
        <SupermarketCopilot
          businessId={businessId}
          language={language}
        />
      )}

      {activeSection === 'suppliers' && (
        <SupermarketSuppliers
          language={language}
        />
      )}
    </div>
  );
};
