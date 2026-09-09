import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Boxes,
  History,
  Lightbulb,
} from 'lucide-react';
import { StockItem, StockMovement, WarehouseKPIs, WarehouseSettings } from '../types.js';
import {
  generateStockReportPDF,
  generateMovementsReportPDF,
  generateKPIsReportPDF,
} from '../services/pdfGenerator.js';

interface ReportsViewProps {
  stock: StockItem[];
  movements: StockMovement[];
  kpis: WarehouseKPIs | null;
  settings: WarehouseSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  stock,
  movements,
  kpis,
  settings,
}) => {
  const [selectedReport, setSelectedReport] = useState<'stock' | 'movements' | 'kpis'>('stock');
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      if (selectedReport === 'stock') {
        generateStockReportPDF(stock, settings);
      } else if (selectedReport === 'movements') {
        generateMovementsReportPDF(movements, settings);
      } else if (selectedReport === 'kpis' && kpis) {
        generateKPIsReportPDF(kpis, settings);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar relatório em PDF.');
    } finally {
      setTimeout(() => setDownloading(false), 800);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">
              Central de Relatórios Oficiais & Auditoria WMS
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geração de relatórios operacionais em formato corporativo padrão, exportáveis para PDF e imprimíveis com carimbo do responsável técnico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Printer className="w-4 h-4" /> Visualizar / Imprimir
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Gerando Documento...' : 'Exportar Relatório em PDF'}
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setSelectedReport('stock')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedReport === 'stock'
              ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <Boxes className={`w-5 h-5 ${selectedReport === 'stock' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-mono text-slate-400">PDF Disponível</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 mt-2">Posição de Estoque por Local</h2>
          <p className="text-xs text-slate-500 mt-1">
            Saldos em tempo real, endereçamento hierárquico, lotes e datas de validade.
          </p>
        </button>

        <button
          onClick={() => setSelectedReport('movements')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedReport === 'movements'
              ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <History className={`w-5 h-5 ${selectedReport === 'movements' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-mono text-slate-400">PDF Disponível</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 mt-2">Movimentações & Rastreabilidade</h2>
          <p className="text-xs text-slate-500 mt-1">
            Histórico auditado de entradas, saídas, transferências e ajustes com operador e lote.
          </p>
        </button>

        <button
          onClick={() => setSelectedReport('kpis')}
          className={`p-4 rounded-xl border text-left transition-all ${
            selectedReport === 'kpis'
              ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <TrendingUp className={`w-5 h-5 ${selectedReport === 'kpis' ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-[10px] font-mono text-slate-400">PDF Disponível</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 mt-2">Desempenho & Boas Práticas</h2>
          <p className="text-xs text-slate-500 mt-1">
            Indicadores de acurácia, tempo de picking, volumetria e recomendações operacionais.
          </p>
        </button>
      </div>

      {/* Printable Sheet Preview */}
      <div
        id="report-printable-area"
        className="bg-white rounded-xl border border-slate-300 shadow-md p-6 sm:p-8 space-y-6 max-w-5xl mx-auto print:m-0 print:p-0 print:border-none print:shadow-none"
      >
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white font-bold text-xs px-2.5 py-0.5 rounded">
                WMS LOGÍSTICA
              </span>
              <span className="text-xs font-semibold text-slate-600">{settings.companyName}</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-1.5 uppercase tracking-tight">
              {selectedReport === 'stock'
                ? 'Relatório de Posição de Estoque por Localização'
                : selectedReport === 'movements'
                ? 'Relatório de Movimentação de Estoque & Rastreabilidade'
                : 'Relatório Executivo de Indicadores de Desempenho & Boas Práticas'}
            </h2>
            <p className="text-xs text-slate-500">
              {settings.warehouseName} • Centro de Distribuição Homologado
            </p>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono space-y-0.5 self-start sm:self-auto">
            <div>Data de Emissão: {dateFormatted}</div>
            <div className="text-emerald-700 font-semibold">Integridade Auditada</div>
          </div>
        </div>

        {/* Technical Manager Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-slate-500 text-[11px] block">Responsável Técnico / Homologação:</span>
              <span className="font-bold text-slate-900 text-sm">{settings.technicalManager}</span>
            </div>
          </div>
          <div className="text-slate-500 text-[11px] font-mono">
            Documento válido para auditorias fiscais, contábeis e operacionais.
          </div>
        </div>

        {/* Report Content Preview */}
        {selectedReport === 'stock' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-semibold">
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5">Endereço</th>
                    <th className="p-2.5">Lote</th>
                    <th className="p-2.5">Validade</th>
                    <th className="p-2.5 text-right">Saldo Físico</th>
                    <th className="p-2.5 text-right">Reservado</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stock.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2.5 font-mono font-bold text-blue-700">{item.sku}</td>
                      <td className="p-2.5 font-medium text-slate-800">{item.productName}</td>
                      <td className="p-2.5 font-mono font-bold">{item.locationLabel}</td>
                      <td className="p-2.5 font-mono">{item.lot}</td>
                      <td className="p-2.5 text-slate-500">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('pt-BR') : 'N/A'}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="p-2.5 text-right text-slate-500">
                        {item.reservedQuantity > 0 ? `${item.reservedQuantity} ${item.unit}` : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-semibold">
                          {item.status === 'available' ? 'Disponível' : item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-100 p-3 rounded-lg text-xs flex justify-between font-semibold text-slate-800">
              <span>Total de Lotes em Armazém: {stock.length}</span>
              <span>
                Total Geral de Peças / Volumes:{' '}
                {stock.reduce((sum, item) => sum + item.quantity, 0)} unidades
              </span>
            </div>
          </div>
        )}

        {selectedReport === 'movements' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-semibold">
                    <th className="p-2.5">Data / Hora</th>
                    <th className="p-2.5">Operação</th>
                    <th className="p-2.5">SKU & Produto</th>
                    <th className="p-2.5">Lote</th>
                    <th className="p-2.5 text-right">Qtd</th>
                    <th className="p-2.5">Endereço</th>
                    <th className="p-2.5">Operador</th>
                    <th className="p-2.5">Doc. Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {movements.slice(0, 20).map((m, idx) => (
                    <tr key={m.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-2.5 font-mono text-slate-500">
                        {new Date(m.timestamp).toLocaleDateString('pt-BR')}{' '}
                        {new Date(m.timestamp).toLocaleTimeString('pt-BR').slice(0, 5)}
                      </td>
                      <td className="p-2.5 font-bold">{m.type}</td>
                      <td className="p-2.5">
                        <div className="font-mono font-bold text-blue-700">{m.sku}</div>
                        <div className="text-slate-600 truncate max-w-[150px]">{m.productName}</div>
                      </td>
                      <td className="p-2.5 font-mono">{m.lot}</td>
                      <td className="p-2.5 text-right font-mono font-bold">
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="p-2.5 font-mono">{m.fromLocationLabel || m.toLocationLabel || '-'}</td>
                      <td className="p-2.5">{m.operatorName}</td>
                      <td className="p-2.5 text-slate-500 font-mono">{m.documentRef || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-[11px] text-slate-500 text-right italic">
              Exibindo as 20 movimentações mais recentes. O PDF completo exporta o arquivo integral de auditoria.
            </div>
          </div>
        )}

        {selectedReport === 'kpis' && kpis && (
          <div className="space-y-6">
            {/* KPI Metrics Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Acurácia</span>
                <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                  {kpis.inventoryAccuracy}%
                </span>
                <span className="text-[10px] text-slate-400">Meta: ≥ 98%</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Tempo de Picking</span>
                <span className="text-2xl font-bold text-blue-700 mt-1 block">
                  {kpis.avgPickingTimeMinutes} min
                </span>
                <span className="text-[10px] text-slate-400">Meta: ≤ 10 min</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Volume Movimentado</span>
                <span className="text-2xl font-bold text-indigo-700 mt-1 block">
                  {kpis.totalVolumeMovedUnits}
                </span>
                <span className="text-[10px] text-slate-400">{kpis.totalVolumeMovedM3} m³</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">Ocupação do CD</span>
                <span className="text-2xl font-bold text-amber-700 mt-1 block">
                  {kpis.occupancyRate}%
                </span>
                <span className="text-[10px] text-slate-400">Ideal: 60-85%</span>
              </div>
            </div>

            {/* Suggestions & Best practices table */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" /> Recomendações e Boas Práticas Operacionais Sugeridas
              </h3>

              <div className="space-y-2">
                {kpis.suggestions.map((sug, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{sug.title}</span>
                      <span className="text-[10px] font-semibold uppercase bg-slate-200 px-1.5 py-0.5 rounded">
                        Impacto {sug.impact}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1">{sug.description}</p>
                    <div className="mt-2 text-blue-900 font-semibold text-[11px] bg-blue-50/80 p-1.5 rounded">
                      Ação Recomendada: {sug.actionableStep}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Signature Box */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-xs text-slate-500 max-w-sm text-center sm:text-left">
            Certifico que os dados aqui expressos conferem fielmente com os registros físicos e lógicos apurados no sistema WMS em tempo real.
          </div>

          <div className="text-center">
            <div className="w-56 border-b border-slate-400 pb-1 font-bold text-xs text-slate-900">
              {settings.technicalManager}
            </div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mt-1">
              Responsável Técnico WMS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
