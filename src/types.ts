export type UserRole = 'admin' | 'supervisor' | 'operator' | 'inspector';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  active: boolean;
}

export type ABCClassification = 'A' | 'B' | 'C';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: string; // 'UN', 'CX', 'KG', 'PALLET', etc.
  minStock: number;
  maxStock: number;
  weightKg: number;
  volumeM3: number;
  abcClass: ABCClassification;
  barcode: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  sectorId: string; // 'A', 'B', 'C', 'D'
  sectorName: string;
  aisle: string; // 'C01', 'C02', etc.
  shelf: number; // 1, 2, 3, 4, 5, etc.
  label: string; // e.g., "A-01-02"
  maxVolumeM3: number;
  maxWeightKg: number;
  distanceFromDispatch: number; // distance score (1 = closest, 10 = furthest)
  status: 'active' | 'blocked' | 'maintenance';
}

export type StockItemStatus = 'available' | 'reserved' | 'quarantine';

export interface StockItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  locationId: string;
  locationLabel: string;
  sectorId: string;
  aisle: string;
  shelf: number;
  lot: string;
  manufacturingDate?: string;
  expiryDate?: string;
  quantity: number;
  reservedQuantity: number;
  unit: string;
  status: StockItemStatus;
  lastUpdated: string;
}

export type MovementType = 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  timestamp: string;
  type: MovementType;
  productId: string;
  sku: string;
  productName: string;
  lot: string;
  quantity: number;
  previousBalance: number;
  newBalance: number;
  fromLocationLabel?: string;
  toLocationLabel?: string;
  documentRef?: string; // NF, Pedido, etc.
  reason?: string;
  operatorName: string;
  technicalManager: string;
}

export type PickingStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type PickingPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface PickingItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  locationId: string;
  locationLabel: string;
  sector: string;
  aisle: string;
  shelf: number;
  lot: string;
  quantityRequired: number;
  quantityPicked: number;
  status: 'pending' | 'picked' | 'divergent';
  pickedAt?: string;
  pickedBy?: string;
  notes?: string;
}

export interface PickingOrder {
  id: string;
  orderNumber: string;
  customer: string;
  priority: PickingPriority;
  status: PickingStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  assignedTo?: string;
  technicalManager: string;
  items: PickingItem[];
  totalItems: number;
  pickedItems: number;
  notes?: string;
  dispatchDock?: string;
}

export interface OperationalSuggestion {
  id: string;
  type: 'reorganization' | 'bottleneck' | 'capacity' | 'quality';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionableStep: string;
  relatedSku?: string;
  relatedLocation?: string;
}

export interface WarehouseKPIs {
  inventoryAccuracy: number; // e.g. 98.6%
  avgPickingTimeMinutes: number; // e.g. 8.4 mins
  totalVolumeMovedUnits: number;
  totalVolumeMovedM3: number;
  occupancyRate: number; // e.g. 74.2%
  criticalStockCount: number;
  totalProducts: number;
  totalStockUnits: number;
  openPickingOrders: number;
  suggestions: OperationalSuggestion[];
}

export interface WarehouseSettings {
  technicalManager: string;
  companyName: string;
  warehouseName: string;
  shelvesPerAisle: number;
  defaultShelvesPerAisle?: number;
  occupancyAlertThreshold?: number;
  aislesPerSector: number;
  enableBarcodeScanner: boolean;
  autoSuggestPickingRoute: boolean;
}

export interface DatabaseState {
  users: User[];
  products: Product[];
  locations: WarehouseLocation[];
  stock: StockItem[];
  movements: StockMovement[];
  pickingOrders: PickingOrder[];
  settings: WarehouseSettings;
  backupHistory: { id: string; timestamp: string; note: string; recordCount: number }[];
}
