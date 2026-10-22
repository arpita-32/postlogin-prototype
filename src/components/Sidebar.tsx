import React from 'react';
import { NavTab } from '../types';
import { LayoutGrid, Monitor, CreditCard, Clock, BarChart2 } from 'lucide-react';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, collapsed = false }) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: LayoutGrid },
    { id: 'my-billers' as NavTab, label: 'My Billers', icon: Monitor },
    { id: 'payments' as NavTab, label: 'Payments', icon: CreditCard },
    { id: 'scheduled' as NavTab, label: 'Scheduled Bill Payments', icon: Clock },
    { id: 'complaints' as NavTab, label: 'Complaints', icon: BarChart2 },
  ];

  const nonClickableTabs = ['complaints'];

  return (
    <aside 
      className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      <div className="py-4 px-2 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isNonClickable = nonClickableTabs.includes(item.id);

          return (
            <button
              key={item.id}
              onClick={() => {
                if (!isNonClickable) {
                  onSelectTab(item.id);
                }
              }}
              disabled={isNonClickable}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium transition-all ${
                isNonClickable
                  ? 'text-gray-700 rounded-md cursor-default'
                  : isActive
                  ? 'bg-[#fc8036] text-white rounded-r-2xl rounded-l-md shadow-xs font-semibold cursor-pointer'
                  : 'text-gray-700 hover:bg-orange-50 hover:text-[#fc8036] rounded-md cursor-pointer'
              }`}
              title={item.label}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-600'}`} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
