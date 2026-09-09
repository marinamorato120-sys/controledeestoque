import {
  Product,
  StockItem,
  StockMovement,
  PickingOrder,
  WarehouseLocation,
  WarehouseKPIs,
  WarehouseSettings,
  User,
} from '../types.js';

const BASE_URL = '/api';

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request<T>(endpoint: string, options: RequestInit = {}, retries = 2): Promise<T> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!res.ok) {
        let errorMsg = `Erro ${res.status} na requisição ao servidor.`;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            errorMsg = data.error || errorMsg;
          }
        } catch {
          // ignore json parse error
        }

        // Only retry on 502, 503, 504 server warmup errors
        if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
          await wait(400 * (attempt + 1));
          continue;
        }

        throw new Error(errorMsg);
      }

      return await res.json();
    } catch (err: any) {
      lastError = err;
      // Retry on network errors (e.g. Failed to fetch while server starts)
      if (attempt < retries) {
        await wait(400 * (attempt + 1));
      }
    }
  }

  throw lastError || new Error('Falha de conexão com o servidor WMS.');
}

export const api = {
  // Sync all in a single fast call
  syncAll: () =>
    request<{
      kpis: WarehouseKPIs;
      products: Product[];
      stock: StockItem[];
      locations: (WarehouseLocation & {
        itemsCount: number;
        totalUnits: number;
        usedVolumeM3: number;
        usedWeightKg: number;
        occupancyPercent: number;
        items: { id: string; sku: string; productName: string; lot: string; quantity: number; status: string }[];
      })[];
      movements: StockMovement[];
      pickingOrders: PickingOrder[];
      users: User[];
      settings: WarehouseSettings;
      timestamp: string;
    }>('/sync'),

  // Settings & Users
  getSettings: () => request<WarehouseSettings>('/settings'),
  updateSettings: (settings: Partial<WarehouseSettings>) =>
    request<{ success: boolean; settings: WarehouseSettings }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getUsers: () => request<User[]>('/users'),
  createUser: (userData: Partial<User>) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  // Products
  getProducts: () => request<Product[]>('/products'),
  createProduct: (product: Partial<Product>) =>
    request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  updateProduct: (id: string, product: Partial<Product>) =>
    request<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),

  // Warehouse & Locations
  getLocations: () =>
    request<
      (WarehouseLocation & {
        itemsCount: number;
        totalUnits: number;
        usedVolumeM3: number;
        usedWeightKg: number;
        occupancyPercent: number;
        items: { id: string; sku: string; productName: string; lot: string; quantity: number; status: string }[];
      })[]
    >('/locations'),
  configureLocations: (sectorId: string, shelvesCount: number) =>
    request<{ success: boolean; message: string }>('/locations/configure', {
      method: 'POST',
      body: JSON.stringify({ sectorId, shelvesCount }),
    }),
  suggestSmartLocation: (productId: string, quantity: number) =>
    request<{
      product: Product;
      recommendedLocation: WarehouseLocation;
      reason: string;
    }>(`/locations/suggest?productId=${encodeURIComponent(productId)}&quantity=${quantity}`),

  // Stock & Inventory
  getStock: () => request<StockItem[]>('/stock'),
  registerInbound: (data: {
    productId: string;
    quantity: number;
    lot?: string;
    locationId: string;
    manufacturingDate?: string;
    expiryDate?: string;
    documentRef?: string;
    reason?: string;
    operatorName: string;
    technicalManager?: string;
  }) =>
    request<{ success: boolean; movement: StockMovement; stockItem: StockItem; totalProductStock: number }>(
      '/stock/inbound',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  registerOutbound: (data: {
    stockItemId: string;
    quantity: number;
    documentRef?: string;
    reason?: string;
    destination?: string;
    operatorName: string;
    technicalManager?: string;
  }) =>
    request<{ success: boolean; movement: StockMovement; remainingLotQuantity: number }>('/stock/outbound', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registerAdjustment: (data: {
    stockItemId: string;
    newQuantity: number;
    reason: string;
    operatorName: string;
    technicalManager?: string;
  }) =>
    request<{ success: boolean; movement: StockMovement; stockItem: StockItem }>('/stock/adjustment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registerTransfer: (data: {
    stockItemId: string;
    targetLocationId: string;
    quantity: number;
    reason?: string;
    operatorName: string;
    technicalManager?: string;
  }) =>
    request<{ success: boolean; movement: StockMovement }>('/stock/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Movements (Audit Log)
  getMovements: () => request<StockMovement[]>('/movements'),

  // Picking
  getPickingOrders: () => request<PickingOrder[]>('/picking'),
  createPickingOrder: (data: {
    customer: string;
    priority?: string;
    notes?: string;
    dispatchDock?: string;
    items: { productId: string; quantity: number }[];
    technicalManager?: string;
  }) =>
    request<PickingOrder>('/picking', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePickingItem: (orderId: string, itemId: string, quantityPicked: number, operatorName: string) =>
    request<{ success: boolean; order: PickingOrder; item: any }>(`/picking/${orderId}/item/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantityPicked, operatorName }),
    }),
  updatePickingOrderStatus: (
    orderId: string,
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled',
    operatorName: string,
    technicalManager?: string
  ) =>
    request<{ success: boolean; order: PickingOrder }>(`/picking/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, operatorName, technicalManager }),
    }),

  // KPIs
  getKPIs: () => request<WarehouseKPIs>('/kpis'),
  getDashboardKPIs: () => request<WarehouseKPIs>('/kpis'),

  // Backup & Maintenance
  exportBackupUrl: () => `${BASE_URL}/backup/export`,
  getBackupData: () => request<any>('/backup/export'),
  createSnapshot: (note: string) =>
    request<{ success: boolean; snapshot: any; history: any[] }>('/backup/snapshot', {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
  restoreBackup: (backupData: any) =>
    request<{ success: boolean; message: string }>('/backup/restore', {
      method: 'POST',
      body: JSON.stringify(backupData),
    }),
  restoreBackupData: (backupData: any) =>
    request<{ success: boolean; message: string }>('/backup/restore', {
      method: 'POST',
      body: JSON.stringify(backupData),
    }),
  resetDemoData: () =>
    request<{ success: boolean; message: string; data: any }>('/backup/reset-demo', {
      method: 'POST',
    }),
  resetToSeed: () =>
    request<{ success: boolean; message: string; data: any }>('/backup/reset-demo', {
      method: 'POST',
    }),
};
