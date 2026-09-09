import React from 'react';
import {
  Boxes,
  LayoutDashboard,
  MapPin,
  ClipboardCheck,
  History,
  FileText,
  Settings,
  ShieldCheck,
  UserCheck,
  Wifi,
} from 'lucide-react';
import { User, WarehouseSettings } from '../types.js';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  settings: WarehouseSettings;
  isOnline?: boolean;
  isSyncing?: boolean;
  onManualSync?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  users,
  onSelectUser,
  settings,
  isOnline = true,
  isSyncing = false,
  onManualSync,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel & KPIs', icon: LayoutDashboard },
    { id: 'stock', label: 'Controle de Estoque', icon: Boxes },
    { id: 'map', label: 'Endereçamento & Mapa 2D', icon: MapPin },
    { id: 'picking', label: 'Separação (Picking)', icon: ClipboardCheck },
    { id: 'audit', label: 'Histórico & Auditoria', icon: History },
    { id: 'reports', label: 'Relatórios & PDF', icon: FileText },
    { id: 'settings', label: 'Configurações & Backup', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">WMS Enterprise</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Tempo Real
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                {settings.warehouseName || 'Centro de Distribuição Principal'}
              </p>
            </div>
          </div>

          {/* Right Section: Technical Manager, Live Sync, User Selector */}
          <div className="flex items-center gap-3">
            {/* Responsável Técnico Badge (Mandatory requirement) */}
            <div className="hidden md:flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-slate-400 text-[10px] block leading-tight">Responsável Técnico</span>
                <span className="font-semibold text-slate-100 leading-tight block">
                  {settings.technicalManager || 'Marina Morato'}
                </span>
              </div>
            </div>

            {/* Live Status indicator */}
            <button
              onClick={onManualSync}
              title={isOnline ? 'Conexão ativa em tempo real. Clique para forçar sincronização.' : 'Falha na conexão. Clique para reconectar.'}
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors cursor-pointer ${
                !isOnline
                  ? 'text-amber-300 bg-amber-950/60 border border-amber-700/50 hover:bg-amber-900/60'
                  : isSyncing
                  ? 'text-blue-300 bg-blue-950/60 border border-blue-700/50'
                  : 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40'
              }`}
            >
              <Wifi className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : isOnline ? 'animate-pulse' : 'text-amber-400'}`} />
              <span className="font-medium">
                {!isOnline ? 'Reconectar' : isSyncing ? 'Sincronizando...' : 'Online'}
              </span>
            </button>

            {/* User Switcher */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
              <UserCheck className="w-4 h-4 text-slate-400 ml-1.5" />
              <select
                aria-label="Usuário ativo do sistema"
                value={currentUser.id}
                onChange={(e) => {
                  const u = users.find((item) => item.id === e.target.value);
                  if (u) onSelectUser(u);
                }}
                className="bg-transparent text-slate-200 font-medium py-1 pr-2 outline-none cursor-pointer text-xs"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100">
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
