import React, { useState } from 'react';
import {
  ClipboardCheck,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  MapPin,
  Barcode,
  PackageCheck,
  AlertCircle,
  Truck,
  User,
  ShieldCheck,
} from 'lucide-react';
import { PickingOrder, Product, StockItem, User as UserType } from '../types.js';
import { api } from '../services/api.js';

interface PickingViewProps {
  pickingOrders: PickingOrder[];
  products: Product[];
  stock: StockItem[];
  currentUser: UserType;
  technicalManager: string;
  onRefreshData: () => Promise<void>;
}

export const PickingView: React.FC<PickingViewProps> = ({
  pickingOrders,
  products,
  stock,
  currentUser,
  technicalManager,
  onRefreshData,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<PickingOrder | null>(
    pickingOrders.find((o) => o.status === 'in_progress') || pickingOrders[0] || null
  );

  // New Picking Order Modal
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderPriority, setOrderPriority] = useState('normal');
  const [orderDock, setOrderDock] = useState('Doca 01 - Carga Geral');
  const [orderNotes, setOrderNotes] = useState('');
  const [orderItemsList, setOrderItemsList] = useState<{ productId: string; quantity: number }[]>([
    { productId: products[0]?.id || '', quantity: 2 },
  ]);

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Confirm item picked
  const handleConfirmItem = async (orderId: string, itemId: string, qty: number) => {
    setLoading(true);
    try {
      const res = await api.updatePickingItem(orderId, itemId, qty, currentUser.name);
      await onRefreshData();
      if (res && res.order) {
        setSelectedOrder(res.order);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao confirmar item.');
    } finally {
      setLoading(false);
    }
  };

  // Complete Order
  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('Deseja finalizar a separação deste pedido e liberar para expedição/packing?')) {
      return;
    }
    setLoading(true);
    try {
      const res = await api.updatePickingOrderStatus(orderId, 'completed', currentUser.name, technicalManager);
      await onRefreshData();
      if (res && res.order) {
        setSelectedOrder(res.order);
      }
      setStatusMessage({ type: 'success', text: 'Pedido finalizado com sucesso e baixado do estoque!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao finalizar pedido.');
    } finally {
      setLoading(false);
    }
  };

  // Start Order
  const handleStartOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const res = await api.updatePickingOrderStatus(orderId, 'in_progress', currentUser.name, technicalManager);
      await onRefreshData();
      if (res && res.order) {
        setSelectedOrder(res.order);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar pedido.');
    } finally {
      setLoading(false);
    }
  };

  // Submit New Order
  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || orderItemsList.length === 0) {
      setStatusMessage({ type: 'error', text: 'Preencha o cliente e inclua itens.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const newOrder = await api.createPickingOrder({
        customer: customerName,
        priority: orderPriority,
        dispatchDock: orderDock,
        notes: orderNotes,
        items: orderItemsList,
        technicalManager,
      });

      await onRefreshData();
      setSelectedOrder(newOrder);
      setShowNewOrderModal(false);
      setCustomerName('');
      setOrderItemsList([{ productId: products[0]?.id || '', quantity: 2 }]);
      setStatusMessage({ type: 'success', text: 'Ordem de separação criada com roteirização inteligente!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Erro ao criar ordem de separação.' });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Urgente</span>;
      case 'high':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Alta</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Normal</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'completed':
        return (
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Separado & Expedido
          </span>
        );
      case 'in_progress':
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" /> Em Separação
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">
              Separação de Pedidos (Picking & Packing Digital)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geração de listas digitais automáticas, ordenação otimizada de rota (S-Shape) e conferência em tempo real.
          </p>
        </div>

        <button
          onClick={() => setShowNewOrderModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" /> Gerar Nova Lista de Separação
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Orders List (Left) & Active Picking Screen (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Orders List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ordens de Separação ({pickingOrders.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">Fila de Produção</span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {pickingOrders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              const percent = ord.totalItems > 0 ? Math.round((ord.pickedItems / ord.totalItems) * 100) : 0;

              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  className={`bg-white rounded-xl p-4 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 shadow-xs ring-1 ring-blue-500'
                      : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-xs text-blue-700 block">
                        {ord.orderNumber}
                      </span>
                      <h3 className="font-semibold text-slate-900 text-xs mt-0.5 truncate max-w-[180px]">
                        {ord.customer}
                      </h3>
                    </div>
                    {getPriorityBadge(ord.priority)}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {ord.dispatchDock || 'Doca 01'}
                    </span>
                    {getStatusBadge(ord.status)}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>Progresso de Separação</span>
                      <span className="font-mono font-semibold">
                        {ord.pickedItems} / {ord.totalItems} itens ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${percent === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Operator Picking Terminal */}
        <div className="lg:col-span-2">
          {selectedOrder ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Order Header Terminal Bar */}
              <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-blue-400 font-bold bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                        {selectedOrder.orderNumber}
                      </span>
                      {getPriorityBadge(selectedOrder.priority)}
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    <h2 className="text-lg font-bold text-white mt-1">
                      Cliente: {selectedOrder.customer}
                    </h2>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{selectedOrder.dispatchDock}</span>
                      <span>•</span>
                      <span>Responsável Técnico: {selectedOrder.technicalManager || technicalManager}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedOrder.status === 'pending' && (
                      <button
                        onClick={() => handleStartOrder(selectedOrder.id)}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" /> Iniciar Separação
                      </button>
                    )}

                    {selectedOrder.status === 'in_progress' && (
                      <button
                        onClick={() => handleCompleteOrder(selectedOrder.id)}
                        disabled={loading || selectedOrder.pickedItems < selectedOrder.totalItems}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                      >
                        <PackageCheck className="w-4 h-4" /> Concluir Separação & Packing
                      </button>
                    )}
                  </div>
                </div>

                {/* Intelligent Route Optimization Notice */}
                <div className="mt-4 bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Roteirização Otimizada:</strong> Os itens estão sequenciados pela rota mais curta (Setor → Corredor → Prateleira).
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">Algoritmo Snake Routing Ativo</span>
                </div>
              </div>

              {/* Items List for Operator */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-bold text-slate-700">
                    Itens da Lista de Separação ({selectedOrder.items.length} posições)
                  </span>
                  <span className="text-slate-500">
                    Operador Ativo: <strong>{currentUser.name}</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => {
                    const isPicked = item.status === 'picked';

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl p-4 border transition-all ${
                          isPicked
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* Location highlight */}
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {idx + 1}
                            </div>

                            <div>
                              {/* Big Hierarchical Address Badge */}
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs bg-blue-100 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">
                                  {item.locationLabel}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Setor {item.sector} • Corredor {item.aisle} • Nível P0{item.shelf}
                                </span>
                              </div>

                              <h3 className="font-bold text-slate-900 text-sm mt-1">
                                {item.productName}
                              </h3>

                              <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-600">
                                <span className="font-mono text-blue-700 font-semibold">{item.sku}</span>
                                <span>•</span>
                                <span className="font-mono bg-amber-50 text-amber-900 px-1 rounded border border-amber-200/60">
                                  Lote: {item.lot}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quantity & Confirmation Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                                Qtd Separar
                              </span>
                              <span className="text-base font-bold text-slate-900 font-mono">
                                {item.quantityRequired} un
                              </span>
                            </div>

                            {isPicked ? (
                              <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Separado ({item.pickedBy || 'Operador'})</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleConfirmItem(selectedOrder.id, item.id, item.quantityRequired)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                              >
                                <Barcode className="w-4 h-4" /> Confirmar Separação
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              Selecione uma ordem de separação ao lado para visualizar a lista digital.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nova Ordem de Separação */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">Gerar Nova Ordem de Separação (Picking)</h3>
              </div>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cliente / Destinatário <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Magazine Varejo Brasil S/A"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prioridade</label>
                  <select
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="urgent">Urgente</option>
                    <option value="high">Alta</option>
                    <option value="normal">Normal</option>
                    <option value="low">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doca de Expedição</label>
                  <select
                    value={orderDock}
                    onChange={(e) => setOrderDock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Doca 01 - Carga Geral">Doca 01 - Carga Geral</option>
                    <option value="Doca 02 - Saída Expresso">Doca 02 - Saída Expresso</option>
                    <option value="Doca 03 - Farmacêuticos">Doca 03 - Farmacêuticos</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Produtos a Separar</label>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderItemsList([...orderItemsList, { productId: products[0]?.id || '', quantity: 1 }])
                    }
                    className="text-blue-600 font-semibold text-[11px] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Adicionar Outro Item
                  </button>
                </div>

                {orderItemsList.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={row.productId}
                      onChange={(e) => {
                        const updated = [...orderItemsList];
                        updated[idx].productId = e.target.value;
                        setOrderItemsList(updated);
                      }}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => {
                        const updated = [...orderItemsList];
                        updated[idx].quantity = Number(e.target.value);
                        setOrderItemsList(updated);
                      }}
                      className="w-16 bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold"
                    />

                    {orderItemsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setOrderItemsList(orderItemsList.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 p-1 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações do Pedido</label>
                <input
                  type="text"
                  placeholder="Ex: Embalar com plástico bolha reforçado"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  {loading ? 'Criando...' : 'Gerar Ordem de Picking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
