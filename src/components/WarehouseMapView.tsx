import React, { useState } from 'react';
import {
  MapPin,
  Sliders,
  Sparkles,
  Layers,
  Info,
  Warehouse,
  ArrowRight,
  Package,
  Weight,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import { WarehouseLocation, Product, StockItem } from '../types.js';
import { api } from '../services/api.js';

interface WarehouseMapViewProps {
  locations: (WarehouseLocation & {
    itemsCount: number;
    totalUnits: number;
    usedVolumeM3: number;
    usedWeightKg: number;
    occupancyPercent: number;
    items: { id: string; sku: string; productName: string; lot: string; quantity: number; status: string }[];
  })[];
  products: Product[];
  stock: StockItem[];
  onRefreshData: () => Promise<void>;
}

export const WarehouseMapView: React.FC<WarehouseMapViewProps> = ({
  locations,
  products,
  stock,
  onRefreshData,
}) => {
  const [selectedSector, setSelectedSector] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

  // Configuration modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configSector, setConfigSector] = useState('A');
  const [configShelvesCount, setConfigShelvesCount] = useState(5);
  const [configLoading, setConfigLoading] = useState(false);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  // Smart Suggestion Tool
  const [suggestProdId, setSuggestProdId] = useState(products[0]?.id || '');
  const [suggestQty, setSuggestQty] = useState(15);
  const [suggestedLocId, setSuggestedLocId] = useState<string | null>(null);
  const [suggestReason, setSuggestReason] = useState<string | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Run Smart Suggestion
  const handleRunSuggestion = async () => {
    if (!suggestProdId) return;
    setSuggestLoading(true);
    try {
      const res = await api.suggestSmartLocation(suggestProdId, suggestQty);
      if (res && res.recommendedLocation) {
        setSuggestedLocId(res.recommendedLocation.id);
        setSuggestReason(res.reason);

        // also find in locations list and select it
        const loc = locations.find((l) => l.id === res.recommendedLocation.id);
        if (loc) {
          setSelectedLocation(loc);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSuggestLoading(false);
    }
  };

  // Submit Shelves Configuration
  const handleSaveShelvesConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigLoading(true);
    setConfigMessage(null);
    try {
      const res = await api.configureLocations(configSector, configShelvesCount);
      await onRefreshData();
      setConfigMessage(res.message);
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigMessage(null);
      }, 1200);
    } catch (err: any) {
      setConfigMessage(err.message || 'Erro ao reconfigurar prateleiras.');
    } finally {
      setConfigLoading(false);
    }
  };

  const sectors = ['A', 'B', 'C', 'D'];

  const getSectorTitle = (sec: string) => {
    switch (sec) {
      case 'A':
        return 'Setor A • Eletrônicos & Alto Giro (Doca Rápida)';
      case 'B':
        return 'Setor B • Insumos & Giro Médio';
      case 'C':
        return 'Setor C • Cargas Pesadas & Industrial';
      case 'D':
        return 'Setor D • Embalagens, Quarentena & Reserva';
      default:
        return `Setor ${sec}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Assistant Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h1 className="text-lg font-bold text-slate-900">
                Endereçamento Inteligente & Mapa 2D do Armazém
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Estrutura hierárquica completa: Setor → Corredor → Prateleira com mapa de calor de ocupação em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Sliders className="w-4 h-4 text-blue-400" />
              Configurar Prateleiras por Corredor
            </button>
          </div>
        </div>

        {/* Smart Suggestion Assistant Box */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                  Motor de Sugestão de Alocação Inteligente
                </h2>
                <p className="text-xs text-blue-800 mt-0.5">
                  Calcula a posição ideal ponderando Curva ABC, cubagem (m³), ergonomia de nível e distância da doca.
                </p>
              </div>
            </div>

            {/* Selector & Action */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Produto para teste de alocação"
                value={suggestProdId}
                onChange={(e) => setSuggestProdId(e.target.value)}
                className="text-xs bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 max-w-[200px]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} ({p.name}) • Curva {p.abcClass}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-white border border-blue-300 rounded-lg px-2 py-1">
                <span className="text-[11px] text-slate-500">Qtd:</span>
                <input
                  type="number"
                  min="1"
                  value={suggestQty}
                  onChange={(e) => setSuggestQty(Number(e.target.value))}
                  className="w-12 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <button
                onClick={handleRunSuggestion}
                disabled={suggestLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {suggestLoading ? 'Calculando...' : 'Sugerir Local Ideal'}
              </button>
            </div>
          </div>

          {/* Suggestion Result Banner */}
          {suggestedLocId && suggestReason && (
            <div className="mt-3 pt-3 border-t border-blue-200/80 flex items-start gap-2 text-xs text-blue-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Endereço Recomendado: </span>
                <span className="font-mono font-bold bg-white text-blue-700 px-1.5 py-0.5 rounded border border-blue-300 mr-2">
                  {locations.find((l) => l.id === suggestedLocId)?.label || suggestedLocId}
                </span>
                <span className="text-blue-900 font-medium">{suggestReason}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sector Tabs & Map Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedSector('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                selectedSector === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos os Setores
            </button>
            {sectors.map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  selectedSector === sec
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Setor {sec}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="text-slate-400 text-[11px] font-medium">Ocupação:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-300 inline-block"></span>
              Vazio (0%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-400 inline-block"></span>
              Baixa (1-50%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-amber-100 border border-amber-400 inline-block"></span>
              Média (51-85%)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-xs bg-red-100 border border-red-400 inline-block"></span>
              Cheio (&gt;85%)
            </span>
          </div>
        </div>
      </div>

      {/* Main 2D Warehouse Visualization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive Map Layout (3 Cols) */}
        <div className="lg:col-span-3 space-y-6">
          {sectors
            .filter((sec) => selectedSector === 'ALL' || selectedSector === sec)
            .map((sectorId) => {
              const sectorLocs = locations.filter((l) => l.sectorId === sectorId);
              // Group by aisle
              const aisles = Array.from(new Set(sectorLocs.map((l) => l.aisle))).sort();

              return (
                <div
                  key={sectorId}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                >
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                        Estrutura Hierárquica
                      </span>
                      <h2 className="text-sm font-bold text-white">{getSectorTitle(sectorId)}</h2>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {sectorLocs.length} Prateleiras Cadastradas
                    </span>
                  </div>

                  {/* Aisles Container */}
                  <div className="p-5 overflow-x-auto">
                    <div className="flex gap-4 min-w-[650px]">
                      {aisles.map((aisle) => {
                        const aisleLocs = sectorLocs
                          .filter((l) => l.aisle === aisle)
                          .sort((a, b) => b.shelf - a.shelf); // highest shelf at top, shelf 1 at bottom

                        return (
                          <div
                            key={aisle}
                            className="flex-1 bg-slate-50/80 rounded-xl p-3 border border-slate-200 flex flex-col"
                          >
                            <div className="text-center pb-2 mb-2 border-b border-slate-200">
                              <span className="text-xs font-bold text-slate-800 font-mono">
                                Corredor {aisle}
                              </span>
                              <span className="block text-[10px] text-slate-400">
                                {aisleLocs.length} níveis verticais
                              </span>
                            </div>

                            {/* Vertical Stack of Shelves */}
                            <div className="flex flex-col gap-2">
                              {aisleLocs.map((loc) => {
                                const isSelected = selectedLocation?.id === loc.id;
                                const isSuggested = suggestedLocId === loc.id;

                                let bgClass = 'bg-white border-slate-200 text-slate-700';
                                if (loc.occupancyPercent === 0) {
                                  bgClass = 'bg-slate-100/60 border-dashed border-slate-300 text-slate-500';
                                } else if (loc.occupancyPercent <= 50) {
                                  bgClass = 'bg-emerald-50 border-emerald-300 text-emerald-950';
                                } else if (loc.occupancyPercent <= 85) {
                                  bgClass = 'bg-amber-50 border-amber-300 text-amber-950';
                                } else {
                                  bgClass = 'bg-red-50 border-red-300 text-red-950';
                                }

                                return (
                                  <div
                                    key={loc.id}
                                    onClick={() => setSelectedLocation(loc)}
                                    className={`relative p-2.5 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xs ${bgClass} ${
                                      isSelected
                                        ? 'ring-2 ring-blue-600 ring-offset-1 shadow-sm'
                                        : ''
                                    } ${
                                      isSuggested
                                        ? 'ring-2 ring-emerald-500 animate-pulse ring-offset-2'
                                        : ''
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono font-bold text-[11px]">
                                        P0{loc.shelf} ({loc.label})
                                      </span>
                                      <span className="text-[10px] font-semibold">
                                        {loc.occupancyPercent}%
                                      </span>
                                    </div>

                                    {/* Content preview */}
                                    <div className="mt-1 flex items-center justify-between text-[10px]">
                                      {loc.totalUnits > 0 ? (
                                        <span className="font-semibold truncate max-w-[110px]">
                                          {loc.items[0]?.sku}{' '}
                                          {loc.items.length > 1 && `+${loc.items.length - 1}`}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 italic">Disponível</span>
                                      )}
                                      <span className="font-mono text-slate-500">
                                        {loc.totalUnits} un
                                      </span>
                                    </div>

                                    {/* Suggested Badge */}
                                    {isSuggested && (
                                      <div className="absolute -top-2 -right-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                                        Sugerido
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Floor Level Docks indicator */}
                  <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>⬇ Corredor de Passagem / Doca de Expedição Mais Próxima</span>
                    <span className="font-mono">Nível 1 = Solo (Ergonômico para Pesados)</span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Shelf Inspector Drawer (1 Col) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sticky top-24 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600" /> Inspetor de Endereço
              </h2>
              {selectedLocation && (
                <span className="text-[11px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {selectedLocation.label}
                </span>
              )}
            </div>

            {selectedLocation ? (
              <div className="space-y-4 text-xs">
                {/* Location Specs */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Setor:</span>
                    <span className="font-semibold text-slate-900">{selectedLocation.sectorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Corredor:</span>
                    <span className="font-semibold text-slate-900">{selectedLocation.aisle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nível / Prateleira:</span>
                    <span className="font-semibold text-slate-900">P0{selectedLocation.shelf}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Distância da Expedição:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedLocation.distanceFromDispatch.toFixed(1)} score
                    </span>
                  </div>
                </div>

                {/* Capacity Meters */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Maximize2 className="w-3 h-3" /> Volume (m³):
                      </span>
                      <span className="font-mono font-semibold">
                        {selectedLocation.usedVolumeM3} / {selectedLocation.maxVolumeM3} m³ ({selectedLocation.occupancyPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          selectedLocation.occupancyPercent > 85 ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${selectedLocation.occupancyPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Weight className="w-3 h-3" /> Carga Suportada:
                      </span>
                      <span className="font-mono font-semibold">
                        {selectedLocation.usedWeightKg} / {selectedLocation.maxWeightKg} kg
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (selectedLocation.usedWeightKg / selectedLocation.maxWeightKg) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Products stored in this shelf */}
                <div className="pt-2 border-t border-slate-100">
                  <h3 className="font-semibold text-slate-800 mb-2 flex items-center justify-between">
                    <span>Itens Alocados Nesta Prateleira</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {selectedLocation.items?.length || 0} lotes
                    </span>
                  </h3>

                  {selectedLocation.items && selectedLocation.items.length > 0 ? (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedLocation.items.map((it: any) => (
                        <div
                          key={it.id}
                          className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px]"
                        >
                          <div className="flex justify-between font-mono font-bold text-blue-700">
                            <span>{it.sku}</span>
                            <span className="text-slate-900 font-semibold">{it.quantity} un</span>
                          </div>
                          <div className="text-slate-700 font-medium truncate mt-0.5">
                            {it.productName}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                            <span>Lote: {it.lot}</span>
                            <span className="text-emerald-700 font-semibold">{it.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400 text-xs">
                      Esta prateleira está livre para novas armazenagens.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs space-y-2">
                <Warehouse className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Clique em qualquer prateleira no mapa para inspecionar ocupação, volumetria e itens alocados.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Configurar Quantidade de Prateleiras por Corredor */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Configurar Prateleiras por Corredor</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShelvesConfig} className="p-5 space-y-4 text-xs">
              {configMessage && (
                <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg">
                  {configMessage}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Selecione o Setor do Armazém
                </label>
                <select
                  value={configSector}
                  onChange={(e) => setConfigSector(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="A">Setor A - Eletrônicos & Alto Giro</option>
                  <option value="B">Setor B - Insumos & Giro Médio</option>
                  <option value="C">Setor C - Pesados & Industrial</option>
                  <option value="D">Setor D - Quarentena & Reserva</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantidade de Prateleiras / Níveis Verticais por Corredor
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={configShelvesCount}
                  onChange={(e) => setConfigShelvesCount(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-sm"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Define quantos níveis de estantes existem por corredor (ex: 4 a 6 níveis). Os endereços existentes com saldo são preservados com segurança.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={configLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {configLoading ? 'Reconfigurando...' : 'Aplicar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
