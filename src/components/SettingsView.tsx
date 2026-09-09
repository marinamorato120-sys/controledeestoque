import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Users,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Save,
  UserPlus,
} from 'lucide-react';
import { WarehouseSettings, User } from '../types.js';
import { api } from '../services/api.js';

interface SettingsViewProps {
  settings: WarehouseSettings;
  users: User[];
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onRefreshData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users,
  currentUser,
  onSwitchUser,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'backup'>('general');

  // General settings state
  const [techManager, setTechManager] = useState(settings.technicalManager);
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [warehouseName, setWarehouseName] = useState(settings.warehouseName);
  const [shelvesPerAisle, setShelvesPerAisle] = useState(settings.defaultShelvesPerAisle);
  const [occupancyThreshold, setOccupancyThreshold] = useState(settings.occupancyAlertThreshold);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  // New User state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'supervisor' | 'operator'>('operator');
  const [savingUser, setSavingUser] = useState(false);
  const [userMessage, setUserMessage] = useState<string | null>(null);

  // Backup & Restore
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // Save General Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await api.updateSettings({
        technicalManager: techManager,
        companyName,
        warehouseName,
        shelvesPerAisle: Number(shelvesPerAisle),
        defaultShelvesPerAisle: Number(shelvesPerAisle),
        occupancyAlertThreshold: Number(occupancyThreshold),
      });

      await onRefreshData();
      setSettingsMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSettingsMessage(null), 3000);
    } catch (err: any) {
      setSettingsMessage(err.message || 'Erro ao salvar configurações.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    setSavingUser(true);
    setUserMessage(null);
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        active: true,
      });

      await onRefreshData();
      setUserMessage('Novo usuário cadastrado com sucesso!');
      setNewUserName('');
      setNewUserEmail('');
      setTimeout(() => setUserMessage(null), 3000);
    } catch (err: any) {
      setUserMessage(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setSavingUser(false);
    }
  };

  // Download Backup JSON
  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const data = await api.getBackupData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wms_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupMessage('Backup exportado com sucesso!');
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (err: any) {
      setBackupMessage('Erro ao exportar backup: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  // Upload Backup JSON
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        setBackupLoading(true);
        await api.restoreBackupData(parsed);
        await onRefreshData();
        setBackupMessage('Banco de dados restaurado com sucesso!');
        setTimeout(() => setBackupMessage(null), 3000);
      } catch (err: any) {
        setBackupMessage('Erro ao importar backup. Arquivo JSON inválido.');
      } finally {
        setBackupLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Reset to Demo Seed Data
  const handleResetToSeed = async () => {
    if (!confirm('Deseja restaurar o armazém com os dados originais de demonstração homologados?')) {
      return;
    }
    setBackupLoading(true);
    try {
      await api.resetToSeed();
      await onRefreshData();
      setBackupMessage('Armazém restaurado com os dados padrão homologados!');
      setTimeout(() => setBackupMessage(null), 3000);
    } catch (err: any) {
      setBackupMessage('Erro ao restaurar dados: ' + err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">
              Configurações do Sistema WMS & Gestão de Acesso
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalização de regras de estocagem, governança de usuários e rotinas de backup do armazém.
          </p>
        </div>

        {/* Current Active User Switcher Pill */}
        <div className="bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px]">Sessão Ativa:</span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = users.find((user) => user.id === e.target.value);
              if (u) onSwitchUser(u);
            }}
            className="bg-white border border-slate-300 rounded font-semibold text-slate-800 px-2 py-1 outline-none text-xs"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'general' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Parâmetros & Responsável Técnico
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Gestão de Usuários & Níveis de Acesso ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'backup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Backup e Restauração de Dados
        </button>
      </div>

      {/* 1. General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Parâmetros Operacionais e Identificação do Armazém
            </h2>
          </div>

          {settingsMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{settingsMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Responsável Técnico Highlight */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Campo de Responsável Técnico Oficial
              </div>
              <p className="text-[11px] text-blue-800">
                Este nome é autenticado e carimbado em todos os relatórios em PDF, livros de registro e auditorias de movimentação física.
              </p>
              <input
                type="text"
                value={techManager}
                onChange={(e) => setTechManager(e.target.value)}
                required
                className="w-full bg-white border border-blue-300 rounded-lg p-2.5 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome da Unidade / CD</label>
                <input
                  type="text"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prateleiras Padrão por Corredor
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={shelvesPerAisle}
                  onChange={(e) => setShelvesPerAisle(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Configuração padrão aplicada ao criar novas alas
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alerta de Capacidade / Ocupação Crítica (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={occupancyThreshold}
                  onChange={(e) => setOccupancyThreshold(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dispara advertência visual em prateleiras acima dessa taxa
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Gravando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. User Management Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6 max-w-4xl">
          {/* New User Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-blue-600" />
              Cadastrar Novo Usuário no Armazém
            </h2>

            {userMessage && (
              <div className="p-3 mb-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{userMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="E-mail Corporativo"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="operator">Operador (Picking/Inbound)</option>
                  <option value="supervisor">Supervisor (Auditoria)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {savingUser ? 'Salvando...' : 'Adicionar Usuário'}
                </button>
              </div>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Usuários Cadastrados e Níveis de Permissão (RBAC)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                {users.length} usuários ativos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="p-3">Nome do Usuário</th>
                    <th className="p-3">E-mail</th>
                    <th className="p-3">Perfil de Acesso</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Simular Sessão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isCurrent = currentUser.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                            {u.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Você
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600">{u.email}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'supervisor'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.role === 'admin'
                              ? 'Administrador'
                              : u.role === 'supervisor'
                              ? 'Supervisor'
                              : 'Operador'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            Ativo
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {!isCurrent ? (
                            <button
                              onClick={() => onSwitchUser(u)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] hover:underline"
                            >
                              Alternar para este
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Sessão Atual</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Backup & Restore Tab */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              Rotinas de Salvamento, Exportação e Restauração de Dados
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Garanta a segurança e continuidade operacional do armazém através de snapshots integrais do sistema.
            </p>
          </div>

          {backupMessage && (
            <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{backupMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Export Backup Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Fazer Download do Backup Completo</h3>
              <p className="text-xs text-slate-500">
                Gera um arquivo JSON contendo todos os produtos, lotes, endereços, auditorias de movimentação e listas de picking.
              </p>
              <button
                onClick={handleDownloadBackup}
                disabled={backupLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {backupLoading ? 'Gerando...' : 'Exportar Arquivo .JSON'}
              </button>
            </div>

            {/* Import Backup Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Restaurar a Partir de Arquivo</h3>
              <p className="text-xs text-slate-500">
                Importe um arquivo de backup previamente exportado para restabelecer a base integralmente.
              </p>
              <label className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer">
                <Upload className="w-4 h-4" />
                Carregar Arquivo .JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleUploadBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset to Seed Data */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
            <div>
              <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Restaurar Dados Homologados de Fábrica
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Restaura o conjunto completo de produtos, setores A-D, prateleiras e ordens de separação prontas para teste.
              </p>
            </div>

            <button
              onClick={handleResetToSeed}
              disabled={backupLoading}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs shrink-0 disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
