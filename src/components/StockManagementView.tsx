import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  SlidersHorizontal,
  ArrowLeftRight,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Barcode,
  Package,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, StockItem, WarehouseLocation, User } from '../types.js';
import { api } from '../services/api.js';

interface StockManagementViewProps {
  products: Product[];
  stock: StockItem[];
  locations: WarehouseLocation[];
  currentUser: User;
  technicalManager: string;
  onRefreshData: () => Promise<void>;
}

export const StockManagementView: React.FC<StockManagementViewProps> = ({
  products,
  stock,
  locations,
  currentUser,
  technicalManager,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'balance' | 'products'>('balance');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');

  // Modals state
  const [modalType, setModalType] = useState<'inbound' | 'outbound' | 'adjustment' | 'transfer' | 'new_product' | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inbound Form state
  const [inboundProduct, setInboundProduct] = useState('');
  const [inboundQty, setInboundQty] = useState(10);
  const [inboundLot, setInboundLot] = useState('');
  const [inboundLocation, setInboundLocation] = useState('');
  const [inboundExpiry, setInboundExpiry] = useState('');
  const [inboundDoc, setInboundDoc] = useState('');
  const [inboundReason, setInboundReason] = useState('Recebimento de Fornecedor');
  const [suggestedLocReason, setSuggestedLocReason] = useState<string | null>(null);

  // Outbound Form state
  const [outboundStockItemId, setOutboundStockItemId] = useState('');
  const [outboundQty, setOutboundQty] = useState(1);
  const [outboundDestination, setOutboundDestination] = useState('');
  const [outboundReason, setOutboundReason] = useState('Expedição de Pedido');

  // Adjustment Form state
  const [adjustStockItemId, setAdjustStockItemId] = useState('');
  const [adjustNewQty, setAdjustNewQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Auditoria de Inventário Cíclico');

  // Transfer Form state
  const [transferStockItemId, setTransferStockItemId] = useState('');
  const [transferTargetLocId, setTransferTargetLocId] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [transferReason, setTransferReason] = useState('Otimização de Endereçamento');

  // New Product Form state
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Eletrônicos');
  const [newProdUnit, setNewProdUnit] = useState('UN');
  const [newProdMinStock, setNewProdMinStock] = useState(20);
  const [newProdMaxStock, setNewProdMaxStock] = useState(200);
  const [newProdWeight, setNewProdWeight] = useState(1.5);
  const [newProdVolume, setNewProdVolume] = useState(0.01);
  const [newProdAbc, setNewProdAbc] = useState<'A' | 'B' | 'C'>('B');
  const [newProdBarcode, setNewProdBarcode] = useState('');

  // Handle smart location suggestion trigger
  const handleTriggerSuggestLocation = async (prodId: string, qty: number) => {
    if (!prodId) return;
    try {
      const res = await api.suggestSmartLocation(prodId, qty);
      if (res && res.recommendedLocation) {
        setInboundLocation(res.recommendedLocation.id);
        setSuggestedLocReason(res.reason);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Submit Inbound
  const handleInboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inboundProduct || !inboundLocation || inboundQty <= 0) {
      setActionMessage({ type: 'error', text: 'Preencha todos os campos obrigatórios com valores válidos.' });
      return;
    }

    setLoadingAction(true);
    setActionMessage(null);
    try {
      await api.registerInbound({
        productId: inboundProduct,
        quantity: Number(inboundQty),
        lot: inboundLot || undefined,
        locationId: inboundLocation,
        expiryDate: inboundExpiry || undefined,
        documentRef: inboundDoc || undefined,
        reason: inboundReason,
        operatorName: currentUser.name,
        technicalManager,
      });

      await onRefreshData();
      setActionMessage({ type: 'success', text: 'Entrada de mercadorias registrada com sucesso!' });
      setTimeout(() => {
        setModalType(null);
        setActionMessage(null);
        resetInboundForm();
      }, 1200);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro ao registrar entrada.' });
    } finally {
      setLoadingAction(false);
    }
  };

  const resetInboundForm = () => {
    setInboundProduct('');
    setInboundQty(10);
    setInboundLot('');
    setInboundLocation('');
    setInboundExpiry('');
    setInboundDoc('');
    setSuggestedLocReason(null);
  };

  // Submit Outbound
  const handleOutboundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outboundStockItemId || outboundQty <= 0) {
      setActionMessage({ type: 'error', text: 'Selecione o item/lote e a quantidade a baixar.' });
      return;
    }

    setLoadingAction(true);
    setActionMessage(null);
    try {
      await api.registerOutbound({
        stockItemId: outboundStockItemId,
        quantity: Number(outboundQty),
        destination: outboundDestination || undefined,
        reason: outboundReason,
        operatorName: currentUser.name,
        technicalManager,
      });

      await onRefreshData();
      setActionMessage({ type: 'success', text: 'Saída com rastreamento de lote registrada com sucesso!' });
      setTimeout(() => {
        setModalType(null);
        setActionMessage(null);
        setOutboundStockItemId('');
      }, 1200);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro ao registrar saída.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Submit Adjustment
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustStockItemId || adjustNewQty < 0 || !adjustReason) {
      setActionMessage({ type: 'error', text: 'Item, nova quantidade e justificativa são obrigatórios.' });
      return;
    }

    setLoadingAction(true);
    setActionMessage(null);
    try {
      await api.registerAdjustment({
        stockItemId: adjustStockItemId,
        newQuantity: Number(adjustNewQty),
        reason: adjustReason,
        operatorName: currentUser.name,
        technicalManager,
      });

      await onRefreshData();
      setActionMessage({ type: 'success', text: 'Ajuste de inventário gravado no log de auditoria!' });
      setTimeout(() => {
        setModalType(null);
        setActionMessage(null);
        setAdjustStockItemId('');
      }, 1200);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro ao registrar ajuste.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Submit Transfer
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStockItemId || !transferTargetLocId || transferQty <= 0) {
      setActionMessage({ type: 'error', text: 'Selecione o item, o local de destino e a quantidade.' });
      return;
    }

    setLoadingAction(true);
    setActionMessage(null);
    try {
      await api.registerTransfer({
        stockItemId: transferStockItemId,
        targetLocationId: transferTargetLocId,
        quantity: Number(transferQty),
        reason: transferReason,
        operatorName: currentUser.name,
        technicalManager,
      });

      await onRefreshData();
      setActionMessage({ type: 'success', text: 'Transferência de endereço concluída!' });
      setTimeout(() => {
        setModalType(null);
        setActionMessage(null);
      }, 1200);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro ao transferir endereço.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Submit New Product
  const handleNewProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdSku || !newProdName) {
      setActionMessage({ type: 'error', text: 'SKU e Nome do produto são obrigatórios.' });
      return;
    }

    setLoadingAction(true);
    setActionMessage(null);
    try {
      await api.createProduct({
        sku: newProdSku,
        name: newProdName,
        category: newProdCategory,
        unit: newProdUnit,
        minStock: Number(newProdMinStock),
        maxStock: Number(newProdMaxStock),
        weightKg: Number(newProdWeight),
        volumeM3: Number(newProdVolume),
        abcClass: newProdAbc,
        barcode: newProdBarcode || `789${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      });

      await onRefreshData();
      setActionMessage({ type: 'success', text: 'Produto cadastrado com sucesso no armazém!' });
      setTimeout(() => {
        setModalType(null);
        setActionMessage(null);
        setNewProdSku('');
        setNewProdName('');
      }, 1200);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Erro ao cadastrar produto.' });
    } finally {
      setLoadingAction(false);
    }
  };

  // Filter stock items
  const filteredStock = stock.filter((item) => {
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationLabel.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector = selectedSector === 'ALL' || item.sectorId === selectedSector;
    return matchesSearch && matchesSector;
  });

  // Filter products
  const filteredProducts = products.filter((p) => {
    return (
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Total balance summary
  const totalStockCount = stock.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSubTab('balance')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'balance' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saldo de Estoque em Tempo Real ({stock.length} Lotes)
          </button>
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'products' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Catálogo de Produtos ({products.length} SKUs)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              resetInboundForm();
              setModalType('inbound');
            }}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Entrada de Mercadorias
          </button>

          <button
            onClick={() => {
              if (stock.length > 0) {
                setOutboundStockItemId(stock[0].id);
              }
              setModalType('outbound');
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Minus className="w-4 h-4" /> Saída / Baixa com Lote
          </button>

          <button
            onClick={() => {
              if (stock.length > 0) {
                setAdjustStockItemId(stock[0].id);
                setAdjustNewQty(stock[0].quantity);
              }
              setModalType('adjustment');
            }}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4" /> Ajuste de Inventário
          </button>

          <button
            onClick={() => {
              if (stock.length > 0) {
                setTransferStockItemId(stock[0].id);
                setTransferTargetLocId(locations[0]?.id || '');
              }
              setModalType('transfer');
            }}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
          >
            <ArrowLeftRight className="w-4 h-4" /> Transferência
          </button>

          <button
            onClick={() => setModalType('new_product')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shadow-xs"
          >
            <Package className="w-4 h-4" /> Cadastrar Produto
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              activeSubTab === 'balance'
                ? 'Buscar por SKU, Produto, Lote ou Endereço (ex: A-C01-P02)...'
                : 'Buscar por SKU, Nome ou Categoria de produto...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {activeSubTab === 'balance' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" /> Filtrar Setor:
            </span>
            <select
              aria-label="Filtrar por setor"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-medium text-slate-700"
            >
              <option value="ALL">Todos os Setores (A, B, C, D)</option>
              <option value="A">Setor A - Eletrônicos & Alto Giro</option>
              <option value="B">Setor B - Insumos & Giro Médio</option>
              <option value="C">Setor C - Pesados & Industrial</option>
              <option value="D">Setor D - Quarentena & Reserva</option>
            </select>
          </div>
        )}

        <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md">
          Total Físico: <span className="text-blue-600">{totalStockCount} unidades</span>
        </div>
      </div>

      {/* Main Content Table */}
      {activeSubTab === 'balance' ? (
        /* Real-time Inventory Balance Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              Saldos Atuais em Estoque (Rastreamento por Lote & Endereço)
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Exibindo {filteredStock.length} de {stock.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">SKU</th>
                  <th className="p-3">Descrição do Produto</th>
                  <th className="p-3">Endereço Hierárquico</th>
                  <th className="p-3">Lote & Rastreio</th>
                  <th className="p-3">Validade</th>
                  <th className="p-3 text-right">Saldo Físico</th>
                  <th className="p-3 text-right">Reservado</th>
                  <th className="p-3 text-right">Disponível</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Nenhum lote de estoque encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => {
                    const prod = products.find((p) => p.id === item.productId);
                    const isLow = prod && item.quantity <= prod.minStock;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-blue-700">{item.sku}</td>
                        <td className="p-3">
                          <div className="font-medium text-slate-900">{item.productName}</div>
                          {prod && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>Curva {prod.abcClass}</span>
                              <span>•</span>
                              <span>{prod.category}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                            {item.locationLabel}
                          </span>
                          <span className="block text-[10px] text-slate-500 mt-0.5">
                            Setor {item.sectorId} • Corredor {item.aisle} • Nível {item.shelf}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-slate-700 bg-amber-50 text-amber-900 border border-amber-200/60 px-1.5 py-0.5 rounded text-[11px]">
                            {item.lot}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">
                          {item.expiryDate ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {new Date(item.expiryDate).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 text-sm">
                          {item.quantity} <span className="text-xs text-slate-500 font-normal">{item.unit}</span>
                          {isLow && (
                            <span
                              title="Saldo no limite de estoque mínimo"
                              className="ml-1 inline-block text-amber-500"
                            >
                              ⚠️
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right text-slate-500">
                          {item.reservedQuantity > 0 ? (
                            <span className="font-medium text-amber-700">
                              {item.reservedQuantity} {item.unit}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-700">
                          {Math.max(0, item.quantity - item.reservedQuantity)} {item.unit}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'quarantine'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {item.status === 'available'
                              ? 'Disponível'
                              : item.status === 'quarantine'
                              ? 'Quarentena'
                              : 'Reservado'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              title="Ajuste de Inventário"
                              onClick={() => {
                                setAdjustStockItemId(item.id);
                                setAdjustNewQty(item.quantity);
                                setModalType('adjustment');
                              }}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Transferir para outra prateleira"
                              onClick={() => {
                                setTransferStockItemId(item.id);
                                setTransferTargetLocId(locations[0]?.id || '');
                                setModalType('transfer');
                              }}
                              className="p-1 hover:bg-slate-200 text-purple-600 rounded transition-colors"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Products Catalog Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Catálogo de Produtos Cadastrados (Especificações de Armazenagem)
            </h2>
            <button
              onClick={() => setModalType('new_product')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Produto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="p-3">SKU</th>
                  <th className="p-3">Nome / Descrição</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3 text-center">Curva ABC</th>
                  <th className="p-3 text-right">Peso Unitário</th>
                  <th className="p-3 text-right">Volume Unitário</th>
                  <th className="p-3 text-center">Estoque Mín. / Máx.</th>
                  <th className="p-3">Código de Barras</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-700">{p.sku}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.description || 'Sem descrição'}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-xs ${
                          p.abcClass === 'A'
                            ? 'bg-blue-100 text-blue-800'
                            : p.abcClass === 'B'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Curva {p.abcClass}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono">{p.weightKg} kg</td>
                    <td className="p-3 text-right font-mono">{p.volumeM3} m³</td>
                    <td className="p-3 text-center font-mono">
                      {p.minStock} {p.unit} / {p.maxStock} {p.unit}
                    </td>
                    <td className="p-3 font-mono text-slate-600 flex items-center gap-1.5">
                      <Barcode className="w-3.5 h-3.5 text-slate-400" />
                      {p.barcode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* 1. Modal: Entrada de Mercadorias (Inbound) with Smart Suggestion */}
      {modalType === 'inbound' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Registrar Entrada de Mercadorias (Inbound)</h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInboundSubmit} className="p-5 space-y-4 text-xs">
              {actionMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Product Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Produto / SKU <span className="text-red-500">*</span>
                </label>
                <select
                  value={inboundProduct}
                  onChange={(e) => {
                    setInboundProduct(e.target.value);
                    handleTriggerSuggestLocation(e.target.value, inboundQty);
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} ({p.unit} • Curva {p.abcClass})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Lot */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Quantidade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={inboundQty}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setInboundQty(q);
                      if (inboundProduct) handleTriggerSuggestLocation(inboundProduct, q);
                    }}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Número do Lote
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: LT-2026-09-001 (ou gere auto)"
                    value={inboundLot}
                    onChange={(e) => setInboundLot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              {/* Location with Smart Suggestion Banner */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Local de Armazenagem Sugerido <span className="text-red-500">*</span>
                  </label>
                  {inboundProduct && (
                    <button
                      type="button"
                      onClick={() => handleTriggerSuggestLocation(inboundProduct, inboundQty)}
                      className="text-blue-600 font-semibold flex items-center gap-1 text-[11px] hover:underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Re-calcular Otimização
                    </button>
                  )}
                </div>

                {suggestedLocReason && (
                  <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-900 text-[11px] flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{suggestedLocReason}</span>
                  </div>
                )}

                <select
                  value={inboundLocation}
                  onChange={(e) => setInboundLocation(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-medium"
                >
                  <option value="">Selecione a prateleira / endereço...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} (Setor {l.sectorId} • Corredor {l.aisle} • Nível P0{l.shelf})
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiry Date & Document */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data de Validade</label>
                  <input
                    type="date"
                    value={inboundExpiry}
                    onChange={(e) => setInboundExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Documento / NF-e</label>
                  <input
                    type="text"
                    placeholder="Ex: NF-e 99120"
                    value={inboundDoc}
                    onChange={(e) => setInboundDoc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              {/* Motivo / Descrição */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição / Fornecedor</label>
                <input
                  type="text"
                  value={inboundReason}
                  onChange={(e) => setInboundReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* Audit Sign */}
              <div className="bg-slate-100 p-2.5 rounded-lg text-[11px] text-slate-600 flex justify-between">
                <span>Operador: <strong>{currentUser.name}</strong></span>
                <span>Resp. Técnico: <strong>{technicalManager}</strong></span>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {loadingAction ? 'Processando...' : 'Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Saída com Rastreamento de Lote */}
      {modalType === 'outbound' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Minus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Registrar Saída com Rastreamento de Lote</h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOutboundSubmit} className="p-5 space-y-4 text-xs">
              {actionMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionMessage.text}</span>
                </div>
              )}

              {/* Item / Lot Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Selecione o Lote e Endereço Específico <span className="text-red-500">*</span>
                </label>
                <select
                  value={outboundStockItemId}
                  onChange={(e) => setOutboundStockItemId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="">Selecione o item de estoque...</option>
                  {stock
                    .filter((s) => s.quantity - s.reservedQuantity > 0)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sku} | Lote: {s.lot} | Local: {s.locationLabel} | Disp: {s.quantity - s.reservedQuantity} {s.unit}
                      </option>
                    ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantidade a Retirar <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={outboundQty}
                  onChange={(e) => setOutboundQty(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              {/* Destination / Customer */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destinatário / Cliente</label>
                <input
                  type="text"
                  placeholder="Ex: Farmácia São Paulo / Transportadora Alpha"
                  value={outboundDestination}
                  onChange={(e) => setOutboundDestination(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo da Saída</label>
                <select
                  value={outboundReason}
                  onChange={(e) => setOutboundReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="Expedição de Pedido">Expedição de Pedido de Venda</option>
                  <option value="Transferência entre Filiais">Transferência entre Filiais</option>
                  <option value="Devolução ao Fornecedor">Devolução ao Fornecedor</option>
                  <option value="Avaria ou Descarte">Descarte por Avaria / Vencimento</option>
                </select>
              </div>

              {/* Audit Sign */}
              <div className="bg-slate-100 p-2.5 rounded-lg text-[11px] text-slate-600 flex justify-between">
                <span>Operador: <strong>{currentUser.name}</strong></span>
                <span>Resp. Técnico: <strong>{technicalManager}</strong></span>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                  {loadingAction ? 'Processando...' : 'Confirmar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal: Ajuste de Inventário */}
      {modalType === 'adjustment' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Ajuste de Saldo de Inventário (Auditoria)</h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="p-5 space-y-4 text-xs">
              {actionMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item e Lote a Ajustar <span className="text-red-500">*</span>
                </label>
                <select
                  value={adjustStockItemId}
                  onChange={(e) => {
                    setAdjustStockItemId(e.target.value);
                    const s = stock.find((item) => item.id === e.target.value);
                    if (s) setAdjustNewQty(s.quantity);
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="">Selecione o item...</option>
                  {stock.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sku} ({s.productName}) | Lote: {s.lot} | Atual: {s.quantity} {s.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nova Quantidade Físico Contada <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustNewQty}
                  onChange={(e) => setAdjustNewQty(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Justificativa Obrigatória para Auditoria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Divergência detectada em contagem cíclica semanal"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="bg-slate-100 p-2.5 rounded-lg text-[11px] text-slate-600 flex justify-between">
                <span>Auditor: <strong>{currentUser.name}</strong></span>
                <span>Resp. Técnico: <strong>{technicalManager}</strong></span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {loadingAction ? 'Gravando...' : 'Confirmar Ajuste Auditado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Transferência Interna */}
      {modalType === 'transfer' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-sm">Transferência Interna de Endereço</h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-5 space-y-4 text-xs">
              {actionMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Item e Lote a Transferir <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferStockItemId}
                  onChange={(e) => {
                    setTransferStockItemId(e.target.value);
                    const s = stock.find((item) => item.id === e.target.value);
                    if (s) setTransferQty(s.quantity);
                  }}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="">Selecione o item...</option>
                  {stock.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sku} | Lote: {s.lot} | Origem: {s.locationLabel} (Saldo: {s.quantity} {s.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Endereço de Destino <span className="text-red-500">*</span>
                </label>
                <select
                  value={transferTargetLocId}
                  onChange={(e) => setTransferTargetLocId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                >
                  <option value="">Selecione a nova prateleira...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} (Setor {l.sectorId} • Corredor {l.aisle} • Nível {l.shelf})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantidade a Mover <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo da Transferência</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {loadingAction ? 'Movendo...' : 'Executar Transferência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Cadastrar Novo Produto */}
      {modalType === 'new_product' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Cadastrar Novo Produto no Catálogo</h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleNewProductSubmit} className="p-5 space-y-4 text-xs">
              {actionMessage && (
                <div
                  className={`p-3 rounded-lg flex items-center gap-2 ${
                    actionMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: EL-TAB-101"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value.toUpperCase())}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Eletrônicos, Automotivo"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome do Produto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tablet Industrial 10 Polegadas"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidade</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="UN">UN (Unidade)</option>
                    <option value="CX">CX (Caixa)</option>
                    <option value="KG">KG (Quilo)</option>
                    <option value="FARDO">FARDO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Curva ABC</label>
                  <select
                    value={newProdAbc}
                    onChange={(e) => setNewProdAbc(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    <option value="A">Curva A (Alto Giro)</option>
                    <option value="B">Curva B (Médio)</option>
                    <option value="C">Curva C (Baixo)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peso Unit. (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.01"
                    value={newProdWeight}
                    onChange={(e) => setNewProdWeight(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Volume (m³)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.0001"
                    value={newProdVolume}
                    onChange={(e) => setNewProdVolume(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque Mín.</label>
                  <input
                    type="number"
                    min="0"
                    value={newProdMinStock}
                    onChange={(e) => setNewProdMinStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estoque Máx.</label>
                  <input
                    type="number"
                    min="1"
                    value={newProdMaxStock}
                    onChange={(e) => setNewProdMaxStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Package className="w-4 h-4" />
                  {loadingAction ? 'Cadastrando...' : 'Salvar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
