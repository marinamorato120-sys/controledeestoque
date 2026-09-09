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

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Data fetching routine using atomic /sync with graceful degradation
  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // Primary: Fast single-trip synchronization
      const syncData = await api.syncAll();

      setKpis(syncData.kpis);
      setProducts(syncData.products);
      setStock(syncData.stock);
      setLocations(syncData.locations);
      setMovements(syncData.movements);
      setPickingOrders(syncData.pickingOrders);
      setUsers(syncData.users);
      setSettings(syncData.settings);

      // Default user to Marina Morato if available
      const foundMarina = syncData.users.find((u: User) => u.name.toLowerCase().includes('marina'));
      if (foundMarina) {
        setCurrentUser((prev) => (prev.id === foundMarina.id ? prev : foundMarina));
      }

      setLastSyncTime(new Date());
      setIsOnline(true);
      setError(null);
      setRetryCount(0);
    } catch (err: any) {
      console.warn('Erro ao sincronizar via /sync, tentando fallback:', err);
      try {
        // Fallback: individual endpoints
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
        setLastSyncTime(new Date());
        setIsOnline(true);
        setError(null);
      } catch (fallbackErr: any) {
        console.error('Falha na sincronização WMS:', fallbackErr);
        setIsOnline(false);
        setError('Falha de conexão com o servidor WMS. Tentando reconectar automaticamente...');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load with immediate retry if needed
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Online / focus event listeners for automatic recovery
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      loadAllData(true);
    };
    const handleFocus = () => {
      loadAllData(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadAllData]);

  // Polling every 12 seconds for real-time warehouse sync
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllData(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  if (loading && !products.length) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-4 max-w-md">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">Iniciando WMS Enterprise...</h2>
            <p className="text-xs text-slate-400 mt-1">
              Conectando aos serviços de estoque em tempo real e endereçamento inteligente.
            </p>
          </div>
          {error && (
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl w-full text-xs text-slate-300 mt-2">
              <p className="text-amber-400 font-medium mb-2">{error}</p>
              <button
                onClick={() => loadAllData()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg inline-flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reconectar Agora
              </button>
            </div>
          )}
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
        isOnline={isOnline}
        isSyncing={refreshing}
        onManualSync={() => loadAllData()}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Connection Notice banner when offline/reconnecting */}
        {!isOnline && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl flex items-center justify-between text-xs shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold">Serviço WMS desconectado temporariamente.</span>{' '}
                <span className="text-amber-700">Tentando reconexão automática em segundo plano...</span>
              </div>
            </div>
            <button
              onClick={() => loadAllData()}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Reconectar Agora
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
