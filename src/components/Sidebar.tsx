import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Package,
  FileSpreadsheet,
  Code2,
  X,
  Truck,
  Box,
  Settings,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  itemsCount: number;
  systemsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  itemsCount,
  systemsCount
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      subtitle: 'Visão Geral & Métricas',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'checklist',
      label: 'Checklist Viagem',
      subtitle: 'Controle Paddock',
      icon: CheckSquare,
      badge: 'Core'
    },
    {
      id: 'items',
      label: 'Gestão de Itens',
      subtitle: 'CRUD Completo',
      icon: Package,
      badge: `${itemsCount}`
    },
    {
      id: 'importer',
      label: 'Importação Excel',
      subtitle: 'Planilha Oficial',
      icon: FileSpreadsheet,
      badge: null
    },
    {
      id: 'docs',
      label: 'SQL & Python',
      subtitle: 'Código & Streamlit',
      icon: Code2,
      badge: 'Dev'
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 w-64 bg-[#1e293b] text-white border-r border-slate-700 z-50 flex flex-col justify-between flex-shrink-0 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center font-bold text-lg italic text-white flex-shrink-0">
                K
              </div>
              <div>
                <h1 className="font-bold tracking-tight text-xl leading-none text-white">
                  KRT Logistics
                </h1>
                <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-widest font-mono">
                  v2.0.4 - Competition
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all group ${
                    isActive
                      ? 'bg-red-600/10 text-red-400 border border-red-600/20 font-medium'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? 'text-red-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <div className="truncate">
                      <div className="text-sm font-medium leading-snug truncate">{item.label}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  {item.badge && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                        isActive
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile / Connection Status */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center font-bold text-xs text-red-400 font-mono">
              KRT
            </div>
            <div className="text-xs">
              <p className="font-bold text-white leading-tight">Engenharia KRT</p>
              <p className="text-slate-400 font-mono text-[10px]">Supabase Connected</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
