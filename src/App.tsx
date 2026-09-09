import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { DashboardView } from './components/DashboardView.js';
import { StockManagementView } from './components/StockManagementView.js';
import { WarehouseMapView } from './components/WarehouseMapView.js';
import { PickingView } from './components/PickingView.js';
import { AuditMovementsView } from './components/AuditMovementsView.js';
import { ReportsView } from './components/ReportsView.js';
import { SettingsView } from './components/SettingsView.js';
import { api } from './services/api.js';
import {
  Product,
  StockItem,
  WarehouseLocation,
  StockMovement,
  PickingOrder,
  User,
  WarehouseSettings,
  WarehouseKPIs,
} from './types.js';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Core WMS data
  const [kpis, setKpis] = useState<WarehouseKPIs | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [pickingOrders, setPickingOrders] = useState<PickingOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-1',
    name: 'Marina Morato',
    email: 'marina.morato@wmslogistica.com.br',
    role: 'admin',
    active: true,
  });
  const [settings, setSettings] = useState<WarehouseSettings>({
    companyName: 'WMS Logística Inteligente do Brasil',
    warehouseName: 'Centro de Distribuição São Paulo - Unidade 01',
    technicalManager: 'Marina Morato',
    defaultShelvesPerAisle: 5,
    occupancyAlertThreshold: 85,
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Data fetching routine
  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const [
        kpisData,
        productsData,
        stockData,
        locationsData,
        movementsData,
        ordersData,
        usersData,
        settingsData,
      ] = await Promise.all([
        api.getDashboardKPIs(),
        api.getProducts(),
        api.getStock(),
        api.getLocations(),
        api.getMovements(),
        api.getPickingOrders(),
        api.getUsers(),
        api.getSettings(),
      ]);

      setKpis(kpisData);
      setProducts(productsData);
      setStock(stockData);
      setLocations(locationsData);
      setMovements(movementsData);
      setPickingOrders(ordersData);
      setUsers(usersData);
      setSettings(settingsData);

      // Default user to Marina Morato if available
      const foundMarina = usersData.find((u: User) => u.name.toLowerCase().includes('marina'));
      if (foundMarina && currentUser.name !== foundMarina.name) {
        setCurrentUser(foundMarina);
      }

      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error('Erro ao carregar dados do WMS:', err);
      setError('Não foi possível sincronizar os dados com o servidor WMS. Verifique a conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser.name]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Polling every 15 seconds for real-time warehouse sync
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  if (loading && !products.length) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <h2 className="text-base font-bold tracking-tight">Carregando Sistema WMS Enterprise...</h2>
          <p className="text-xs text-slate-400">
            Sincronizando inventário em tempo real e mapa de endereçamento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => setCurrentUser(u)}
        settings={settings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert if any */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadAllData()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Tentar Novamente
            </button>
          </div>
        )}

        {/* Dynamic Views */}
        {activeTab === 'dashboard' && (
          <DashboardView
            kpis={kpis}
            movements={movements}
            products={products}
            locations={locations}
            onNavigate={(tab) => setActiveTab(tab)}
            technicalManager={settings.technicalManager}
          />
        )}

        {activeTab === 'stock' && (
          <StockManagementView
            products={products}
            stock={stock}
            locations={locations}
            currentUser={currentUser}
            technicalManager={settings.technicalManager}
            onRefreshData={async () => {
              await loadAllData(true);
            }}
          />
        )}

        {activeTab === 'map' && (
          <WarehouseMapView
            locations={locations}
            products={products}
            stock={stock}
            onRefreshData={async () => {
              await loadAllData(true);
            }}
          />
        )}

        {activeTab === 'picking' && (
          <PickingView
            pickingOrders={pickingOrders}
            products={products}
            stock={stock}
            currentUser={currentUser}
            technicalManager={settings.technicalManager}
            onRefreshData={async () => {
              await loadAllData(true);
            }}
          />
        )}

        {activeTab === 'audit' && (
          <AuditMovementsView
            movements={movements}
            technicalManager={settings.technicalManager}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            stock={stock}
            movements={movements}
            kpis={kpis}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            users={users}
            currentUser={currentUser}
            onSwitchUser={(u) => setCurrentUser(u)}
            onRefreshData={async () => {
              await loadAllData(true);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{settings.companyName}</span>
            <span>•</span>
            <span>{settings.warehouseName}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>
              Responsável Técnico: <strong className="text-slate-800">{settings.technicalManager}</strong>
            </span>
            <span>•</span>
            <span className="font-mono text-slate-400">
              Última Sincronização: {lastSyncTime.toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
