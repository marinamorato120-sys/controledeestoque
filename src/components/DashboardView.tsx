import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  Clock,
  Lightbulb,
  MoveRight,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { WarehouseKPIs, StockMovement, Product, WarehouseLocation } from '../types.js';

interface DashboardViewProps {
  kpis: WarehouseKPIs | null;
  movements: StockMovement[];
  products: Product[];
  locations: WarehouseLocation[];
  onNavigate: (tab: string) => void;
  technicalManager: string;
}

const COLORS = ['#2563eb', '#0d9488', '#f59e0b', '#dc2626'];

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  movements,
  products,
  locations,
  onNavigate,
  technicalManager,
}) => {
  if (!kpis) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        Carregando indicadores operacionais...
      </div>
    );
  }

  // Movements by type for chart
  const movementCounts = {
    Entradas: movements.filter((m) => m.type === 'INBOUND').length,
    Saídas: movements.filter((m) => m.type === 'OUTBOUND').length,
    Transferências: movements.filter((m) => m.type === 'TRANSFER').length,
    Ajustes: movements.filter((m) => m.type === 'ADJUSTMENT').length,
  };

  const movementChartData = [
    { name: 'Entradas', total: movementCounts.Entradas },
    { name: 'Saídas', total: movementCounts.Saídas },
    { name: 'Transferências', total: movementCounts.Transferências },
    { name: 'Ajustes Auditados', total: movementCounts.Ajustes },
  ];

  // ABC curve breakdown
  const abcData = [
    { name: 'Curva A (Alto Giro)', value: products.filter((p) => p.abcClass === 'A').length || 1, color: '#2563eb' },
    { name: 'Curva B (Médio Giro)', value: products.filter((p) => p.abcClass === 'B').length || 1, color: '#0d9488' },
    { name: 'Curva C (Baixo Giro)', value: products.filter((p) => p.abcClass === 'C').length || 1, color: '#64748b' },
  ];

  // Sector occupancy summary
  const sectors = ['A', 'B', 'C', 'D'];
  const sectorOccupancy = sectors.map((sec) => {
    const secLocs = locations.filter((l) => l.sectorId === sec);
    return {
      name: `Setor ${sec}`,
      locais: secLocs.length,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Technical Manager Stamp */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600/30 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-500/40">
              Operação WMS Ativa
            </span>
            <span className="text-xs text-slate-300">Auditoria Contínua</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight text-white">
            Painel Executivo de Gestão de Armazém
          </h1>
          <p className="text-sm text-slate-300">
            Visão consolidada de acurácia, tempos de ciclo, volumetria e capacidade em tempo real.
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-lg text-xs space-y-1 self-start md:self-auto">
          <div className="text-slate-400">Responsável Técnico Designado:</div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {technicalManager || 'Marina Morato'}
          </div>
          <div className="text-[11px] text-slate-400">Certificação de Integridade & Boas Práticas</div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Inventory Accuracy */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Acurácia de Inventário
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{kpis.inventoryAccuracy}%</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Meta ≥ 98%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Conformidade entre físico e sistêmico</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${Math.min(100, kpis.inventoryAccuracy)}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 2: Avg Picking Time */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tempo Médio de Picking
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{kpis.avgPickingTimeMinutes}</span>
            <span className="text-xs text-slate-500">minutos / pedido</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Roteirização por Setor/Corredor ativa</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${Math.max(10, 100 - kpis.avgPickingTimeMinutes * 5)}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 3: Volume Moved */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Volume Movimentado
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{kpis.totalVolumeMovedUnits}</span>
            <span className="text-xs text-slate-500">itens ({kpis.totalVolumeMovedM3} m³)</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{movements.length} movimentações auditadas</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '70%' }}></div>
          </div>
        </div>

        {/* KPI 4: Occupancy Rate */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Taxa de Ocupação
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Warehouse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{kpis.occupancyRate}%</span>
            <span className="text-xs text-amber-600 font-medium">Faixa Ideal</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{locations.length} endereços cadastrados</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${kpis.occupancyRate > 85 ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, kpis.occupancyRate)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movements Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Operações Realizadas por Categoria</h2>
              <p className="text-xs text-slate-500">Distribuição das movimentações registradas</p>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
              Ver Auditoria <MoveRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movementChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ABC Curve Distribution */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Curva ABC de Giro</h2>
              <p className="text-xs text-slate-500">Classificação de produtos no catálogo</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={abcData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {abcData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-500 text-center mt-1">
            Produtos de alta rotação (Curva A) devem ficar nos corredores mais baixos e próximos da doca.
          </div>
        </div>
      </div>

      {/* Operational Best Practices & Bottleneck Suggestions */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sugestões Operacionais & Boas Práticas (Inteligência WMS)
              </h2>
              <p className="text-xs text-slate-500">
                Recomendações automáticas baseadas em giro de estoque, ergonomia e gargalos de picking
              </p>
            </div>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-full">
            {kpis.suggestions.length} Oportunidades Identificadas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.suggestions.map((sug) => (
            <div
              key={sug.id}
              className={`rounded-lg p-4 border transition-all ${
                sug.impact === 'high'
                  ? 'border-amber-200 bg-amber-50/40'
                  : sug.impact === 'medium'
                  ? 'border-blue-100 bg-blue-50/30'
                  : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    sug.impact === 'high'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300/40'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}
                >
                  Impacto {sug.impact.toUpperCase()}
                </span>
                {sug.relatedLocation && (
                  <span className="text-[11px] font-mono text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    {sug.relatedLocation}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-2">{sug.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{sug.description}</p>

              <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900 font-medium leading-tight">
                  <span className="font-bold">Ação Sugerida:</span> {sug.actionableStep}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
