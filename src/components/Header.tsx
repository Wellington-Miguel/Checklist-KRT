import React from 'react';
import { Truck, ShieldCheck, Database, Menu, Package, RefreshCw } from 'lucide-react';
import { SupabaseConfig } from '../types';

interface HeaderProps {
  supabaseConfig: SupabaseConfig;
  activeTab: string;
  onToggleSidebar: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  totalItemsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  supabaseConfig,
  activeTab,
  onToggleSidebar,
  onRefreshData,
  isRefreshing,
  totalItemsCount
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Geral';
      case 'items':
        return 'Gestão de Inventário (CRUD)';
      case 'checklist':
        return 'Checklist de Viagem & Paddock';
      case 'importer':
        return 'Importação de Planilha Excel';
      case 'docs':
        return 'Código Python, SQL e Configuração';
      default:
        return 'Logística KRT';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 text-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-gray-100 lg:hidden focus:outline-none"
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-red-600 rounded flex items-center justify-center font-bold text-white text-base italic shadow-sm">
              K
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">
                  {getTabTitle()}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 font-mono">
                  Formula SAE / Baja
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-sans">
                Controle de caixas, transporte e status em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-semibold border border-gray-300 transition"
            title="Sincronizar com banco de dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin text-red-600' : ''}`} />
            <span className="hidden md:inline">Sincronizar</span>
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-700 font-mono font-bold hidden sm:inline">{totalItemsCount} Itens</span>

            {supabaseConfig.isConnected ? (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span>Live: Supabase DB</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                <span>Modo Local</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
