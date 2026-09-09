import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  SlidersHorizontal,
  ShieldCheck,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { StockMovement } from '../types.js';

interface AuditMovementsViewProps {
  movements: StockMovement[];
  technicalManager: string;
}

export const AuditMovementsView: React.FC<AuditMovementsViewProps> = ({
  movements,
  technicalManager,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMovements = movements.filter((m) => {
    const matchesType = filterType === 'ALL' || m.type === filterType;
    const matchesSearch =
      m.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.lot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.documentRef && m.documentRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.operatorName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'INBOUND':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
            <ArrowDownRight className="w-3 h-3 text-emerald-600" /> ENTRADA
          </span>
        );
      case 'OUTBOUND':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold text-[10px]">
            <ArrowUpRight className="w-3 h-3 text-blue-600" /> SAÍDA
          </span>
        );
      case 'TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold text-[10px]">
            <ArrowLeftRight className="w-3 h-3 text-purple-600" /> TRANSFERÊNCIA
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-[10px]">
            <SlidersHorizontal className="w-3 h-3 text-amber-600" /> AJUSTE AUDITADO
          </span>
        );
      default:
        return <span>{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">
              Livro de Registro & Histórico Completo de Auditoria
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreabilidade permanente de todas as movimentações com carimbo de data/hora, operador e responsável técnico.
          </p>
        </div>

        {/* Technical Manager Audit Banner */}
        <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <div>
            <span className="text-[10px] text-slate-500 block">Responsável Técnico Designado:</span>
            <span className="font-bold text-slate-800">{technicalManager}</span>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por SKU, Produto, Lote, Documento ou Operador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {['ALL', 'INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filterType === type ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type === 'ALL'
                ? 'Todos'
                : type === 'INBOUND'
                ? 'Entradas'
                : type === 'OUTBOUND'
                ? 'Saídas'
                : type === 'TRANSFER'
                ? 'Transferências'
                : 'Ajustes'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-mono">
          {filteredMovements.length} eventos auditados
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Operação</th>
                <th className="p-3">SKU & Produto</th>
                <th className="p-3">Lote</th>
                <th className="p-3 text-right">Qtd Movimentada</th>
                <th className="p-3 text-right">Saldo Ant. / Novo</th>
                <th className="p-3">Endereço (Origem / Destino)</th>
                <th className="p-3">Justificativa / Doc</th>
                <th className="p-3">Operador</th>
                <th className="p-3">Responsável Técnico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    Nenhum registro de movimentação encontrado.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 whitespace-nowrap text-slate-500 font-mono">
                      <span className="block font-medium text-slate-800">
                        {new Date(m.timestamp).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </td>
                    <td className="p-3">{getTypeBadge(m.type)}</td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-blue-700 block">{m.sku}</span>
                      <span className="text-slate-700 font-medium truncate max-w-[160px] block">
                        {m.productName}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-700 bg-slate-50/50">
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                        {m.lot}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-sm">
                      <span
                        className={
                          m.quantity > 0 ? 'text-emerald-600' : m.quantity < 0 ? 'text-blue-600' : 'text-slate-700'
                        }
                      >
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-[11px] text-slate-500">
                      {m.previousBalance} → <span className="font-bold text-slate-800">{m.newBalance}</span>
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {m.fromLocationLabel && m.toLocationLabel ? (
                        <span>
                          {m.fromLocationLabel} → <strong>{m.toLocationLabel}</strong>
                        </span>
                      ) : m.toLocationLabel ? (
                        <span className="text-emerald-700">📥 {m.toLocationLabel}</span>
                      ) : m.fromLocationLabel ? (
                        <span className="text-blue-700">📤 {m.fromLocationLabel}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800 block text-[11px]">
                        {m.reason || 'Movimentação padrão'}
                      </span>
                      {m.documentRef && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          Doc: {m.documentRef}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 font-medium whitespace-nowrap">
                      {m.operatorName}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {m.technicalManager || technicalManager}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
