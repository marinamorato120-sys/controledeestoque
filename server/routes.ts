import express, { Request, Response } from 'express';
import {
  loadDatabase,
  saveDatabase,
  calculateKPIs,
  suggestSmartLocation,
  createBackupSnapshot,
  restoreDatabase,
  resetDatabaseToDemo,
} from './db.js';
import { Product, StockItem, StockMovement, PickingOrder, PickingItem, WarehouseLocation } from '../src/types.js';

export const router = express.Router();

// Health Check
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Settings & Technical Manager
router.get('/settings', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.settings);
});

router.put('/settings', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { technicalManager, companyName, warehouseName, shelvesPerAisle, aislesPerSector, autoSuggestPickingRoute } = req.body;

  if (technicalManager !== undefined) db.settings.technicalManager = technicalManager;
  if (companyName !== undefined) db.settings.companyName = companyName;
  if (warehouseName !== undefined) db.settings.warehouseName = warehouseName;
  if (shelvesPerAisle !== undefined) db.settings.shelvesPerAisle = Number(shelvesPerAisle);
  if (aislesPerSector !== undefined) db.settings.aislesPerSector = Number(aislesPerSector);
  if (autoSuggestPickingRoute !== undefined) db.settings.autoSuggestPickingRoute = Boolean(autoSuggestPickingRoute);

  saveDatabase(db);
  res.json({ success: true, settings: db.settings });
});

// Users
router.get('/users', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.users);
});

router.post('/users', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { name, email, role, active } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e E-mail são obrigatórios.' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    role: role || 'operator',
    active: active !== undefined ? active : true,
  };

  db.users.push(newUser as any);
  saveDatabase(db);
  res.status(201).json(newUser);
});

// Products
router.get('/products', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.products);
});

router.post('/products', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { sku, name, description, category, unit, minStock, maxStock, weightKg, volumeM3, abcClass, barcode } = req.body;

  if (!sku || !name) {
    return res.status(400).json({ error: 'SKU e Nome do produto são obrigatórios.' });
  }

  const existing = db.products.find((p) => p.sku.trim().toUpperCase() === sku.trim().toUpperCase());
  if (existing) {
    return res.status(400).json({ error: `Já existe um produto cadastrado com o SKU ${sku}.` });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    sku: sku.trim().toUpperCase(),
    name: name.trim(),
    description: description || '',
    category: category || 'Geral',
    unit: unit || 'UN',
    minStock: Number(minStock) || 0,
    maxStock: Number(maxStock) || 1000,
    weightKg: Number(weightKg) || 0.5,
    volumeM3: Number(volumeM3) || 0.005,
    abcClass: abcClass || 'B',
    barcode: barcode || `${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  saveDatabase(db);
  res.status(201).json(newProduct);
});

router.put('/products/:id', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { id } = req.params;
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const updated: Product = {
    ...db.products[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  db.products[index] = updated;
  saveDatabase(db);
  res.json(updated);
});

// Warehouse Locations & Map
router.get('/locations', (_req: Request, res: Response) => {
  const db = loadDatabase();
  
  // Attach occupancy data to each location
  const locationsWithOccupancy = db.locations.map((loc) => {
    const items = db.stock.filter((s) => s.locationId === loc.id && s.quantity > 0);
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    const usedVol = items.reduce((sum, item) => {
      const p = db.products.find((prod) => prod.id === item.productId);
      return sum + (p ? p.volumeM3 * item.quantity : 0);
    }, 0);
    const usedWeight = items.reduce((sum, item) => {
      const p = db.products.find((prod) => prod.id === item.productId);
      return sum + (p ? p.weightKg * item.quantity : 0);
    }, 0);

    const occupancyPercent = loc.maxVolumeM3 > 0 ? Math.min(100, Math.round((usedVol / loc.maxVolumeM3) * 100)) : 0;

    return {
      ...loc,
      itemsCount: items.length,
      totalUnits,
      usedVolumeM3: Math.round(usedVol * 1000) / 1000,
      usedWeightKg: Math.round(usedWeight * 10) / 10,
      occupancyPercent,
      items: items.map((i) => ({
        id: i.id,
        sku: i.sku,
        productName: i.productName,
        lot: i.lot,
        quantity: i.quantity,
        status: i.status,
      })),
    };
  });

  res.json(locationsWithOccupancy);
});

// Smart Location Suggestion Endpoint
router.get('/locations/suggest', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { productId, quantity } = req.query;

  if (!productId) {
    return res.status(400).json({ error: 'productId é obrigatório.' });
  }

  const product = db.products.find((p) => p.id === productId || p.sku === productId);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado para sugestão.' });
  }

  const qty = Number(quantity) || 1;
  const suggestion = suggestSmartLocation(db, product, qty);

  if (!suggestion) {
    return res.status(404).json({ error: 'Nenhum local disponível com capacidade no momento.' });
  }

  res.json({
    product,
    recommendedLocation: suggestion.location,
    reason: suggestion.reason,
  });
});

// Configure Shelves per Aisle
router.post('/locations/configure', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { sectorId, shelvesCount } = req.body;

  if (!sectorId || !shelvesCount || shelvesCount < 1) {
    return res.status(400).json({ error: 'Setor e quantidade de prateleiras válidos são obrigatórios.' });
  }

  const count = Number(shelvesCount);
  const targetSector = sectorId.toUpperCase();

  // Find aisles for this sector
  const currentLocs = db.locations.filter((l) => l.sectorId === targetSector);
  const aisleNames = Array.from(new Set(currentLocs.map((l) => l.aisle)));

  // Remove existing locations for this sector that exceed or need regeneration
  // Preserve locations that have existing stock!
  const stockInSector = db.stock.filter((s) => s.sectorId === targetSector && s.quantity > 0);
  const occupiedLocIds = new Set(stockInSector.map((s) => s.locationId));

  // Remove empty locations for this sector
  db.locations = db.locations.filter((l) => l.sectorId !== targetSector || occupiedLocIds.has(l.id));

  // Add new shelves up to count for each aisle
  aisleNames.forEach((aisle) => {
    for (let s = 1; s <= count; s++) {
      const label = `${targetSector}-${aisle}-P0${s}`;
      const locId = `loc-${label.toLowerCase()}`;
      if (!db.locations.some((l) => l.id === locId)) {
        db.locations.push({
          id: locId,
          sectorId: targetSector,
          sectorName: `Setor ${targetSector}`,
          aisle,
          shelf: s,
          label,
          maxVolumeM3: s === 1 ? 4.5 : 2.5,
          maxWeightKg: s === 1 ? 2000 : 800,
          distanceFromDispatch: (targetSector.charCodeAt(0) - 64) * 2 + parseInt(aisle.replace(/\D/g, '') || '1') * 0.5 + s * 0.1,
          status: 'active',
        });
      }
    }
  });

  db.settings.shelvesPerAisle = count;
  saveDatabase(db);

  res.json({ success: true, message: `Estrutura do Setor ${targetSector} atualizada com ${count} prateleiras por corredor.` });
});

// Stock & Real-time Inventory
router.get('/stock', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.stock);
});

// Inbound Registration
router.post('/stock/inbound', (req: Request, res: Response) => {
  const db = loadDatabase();
  const {
    productId,
    quantity,
    lot,
    locationId,
    manufacturingDate,
    expiryDate,
    documentRef,
    reason,
    operatorName,
    technicalManager,
  } = req.body;

  if (!productId || !quantity || Number(quantity) <= 0 || !locationId) {
    return res.status(400).json({ error: 'Produto, quantidade positiva e local de armazenagem são obrigatórios.' });
  }

  const product = db.products.find((p) => p.id === productId || p.sku === productId);
  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  const location = db.locations.find((l) => l.id === locationId || l.label === locationId);
  if (!location) {
    return res.status(404).json({ error: 'Localização informada não encontrada.' });
  }

  const qty = Number(quantity);
  const lotNumber = lot ? lot.trim() : `LT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
  const techMgr = technicalManager || db.settings.technicalManager;
  const operator = operatorName || 'Operador Padrão';

  // Calculate previous total stock for this product
  const prevProductStock = db.stock.filter((s) => s.productId === product.id).reduce((sum, s) => sum + s.quantity, 0);

  // Check if stock item with same product, lot, and location already exists
  const existingStockItem = db.stock.find(
    (s) => s.productId === product.id && s.lot === lotNumber && s.locationId === location.id
  );

  let updatedStockItem: StockItem;
  if (existingStockItem) {
    existingStockItem.quantity += qty;
    existingStockItem.lastUpdated = new Date().toISOString();
    updatedStockItem = existingStockItem;
  } else {
    updatedStockItem = {
      id: `stk-${Date.now()}`,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      locationId: location.id,
      locationLabel: location.label,
      sectorId: location.sectorId,
      aisle: location.aisle,
      shelf: location.shelf,
      lot: lotNumber,
      manufacturingDate,
      expiryDate,
      quantity: qty,
      reservedQuantity: 0,
      unit: product.unit,
      status: 'available',
      lastUpdated: new Date().toISOString(),
    };
    db.stock.unshift(updatedStockItem);
  }

  // Record Stock Movement with audit information
  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'INBOUND',
    productId: product.id,
    sku: product.sku,
    productName: product.name,
    lot: lotNumber,
    quantity: qty,
    previousBalance: prevProductStock,
    newBalance: prevProductStock + qty,
    toLocationLabel: location.label,
    documentRef: documentRef || `REC-${Date.now().toString().slice(-6)}`,
    reason: reason || 'Entrada de mercadorias / Recebimento',
    operatorName: operator,
    technicalManager: techMgr,
  };

  db.movements.unshift(movement);
  saveDatabase(db);

  res.status(201).json({
    success: true,
    movement,
    stockItem: updatedStockItem,
    totalProductStock: prevProductStock + qty,
  });
});

// Outbound Registration with Lot Tracking
router.post('/stock/outbound', (req: Request, res: Response) => {
  const db = loadDatabase();
  const {
    stockItemId,
    quantity,
    documentRef,
    reason,
    destination,
    operatorName,
    technicalManager,
  } = req.body;

  if (!stockItemId || !quantity || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'Item de estoque e quantidade válida são obrigatórios.' });
  }

  const stockItem = db.stock.find((s) => s.id === stockItemId);
  if (!stockItem) {
    return res.status(404).json({ error: 'Registro de estoque com o lote selecionado não foi encontrado.' });
  }

  const qty = Number(quantity);
  const availableQty = stockItem.quantity - stockItem.reservedQuantity;

  if (qty > availableQty) {
    return res.status(400).json({
      error: `Saldo insuficiente no lote ${stockItem.lot}. Disponível: ${availableQty} ${stockItem.unit} (Total: ${stockItem.quantity}, Reservado: ${stockItem.reservedQuantity})`,
    });
  }

  const prevProductStock = db.stock.filter((s) => s.productId === stockItem.productId).reduce((sum, s) => sum + s.quantity, 0);

  stockItem.quantity -= qty;
  stockItem.lastUpdated = new Date().toISOString();

  // If quantity reaches 0 and not reserved, can clean up or keep at 0
  if (stockItem.quantity <= 0 && stockItem.reservedQuantity <= 0) {
    db.stock = db.stock.filter((s) => s.id !== stockItem.id);
  }

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'OUTBOUND',
    productId: stockItem.productId,
    sku: stockItem.sku,
    productName: stockItem.productName,
    lot: stockItem.lot,
    quantity: -qty,
    previousBalance: prevProductStock,
    newBalance: prevProductStock - qty,
    fromLocationLabel: stockItem.locationLabel,
    documentRef: documentRef || (destination ? `DEST: ${destination}` : `EXP-${Date.now().toString().slice(-6)}`),
    reason: reason || (destination ? `Expedição para ${destination}` : 'Saída de mercadorias com rastreamento de lote'),
    operatorName: operatorName || 'Operador Padrão',
    technicalManager: technicalManager || db.settings.technicalManager,
  };

  db.movements.unshift(movement);
  saveDatabase(db);

  res.json({
    success: true,
    movement,
    remainingLotQuantity: Math.max(0, stockItem.quantity),
  });
});

// Stock Adjustment (Inventory count adjustments)
router.post('/stock/adjustment', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { stockItemId, newQuantity, reason, operatorName, technicalManager } = req.body;

  if (!stockItemId || newQuantity === undefined || Number(newQuantity) < 0) {
    return res.status(400).json({ error: 'Item de estoque e nova quantidade são obrigatórios.' });
  }

  const stockItem = db.stock.find((s) => s.id === stockItemId);
  if (!stockItem) {
    return res.status(404).json({ error: 'Item de estoque não encontrado.' });
  }

  const targetQty = Number(newQuantity);
  const diff = targetQty - stockItem.quantity;

  if (diff === 0) {
    return res.json({ message: 'Nenhuma alteração de quantidade detectada.' });
  }

  const prevProductStock = db.stock.filter((s) => s.productId === stockItem.productId).reduce((sum, s) => sum + s.quantity, 0);

  stockItem.quantity = targetQty;
  stockItem.lastUpdated = new Date().toISOString();

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'ADJUSTMENT',
    productId: stockItem.productId,
    sku: stockItem.sku,
    productName: stockItem.productName,
    lot: stockItem.lot,
    quantity: diff,
    previousBalance: prevProductStock,
    newBalance: prevProductStock + diff,
    fromLocationLabel: stockItem.locationLabel,
    documentRef: 'AJUSTE-AUDITORIA',
    reason: reason || 'Ajuste de inventário rotativo',
    operatorName: operatorName || 'Conferente de Auditoria',
    technicalManager: technicalManager || db.settings.technicalManager,
  };

  db.movements.unshift(movement);
  saveDatabase(db);

  res.json({ success: true, movement, stockItem });
});

// Stock Transfer between locations
router.post('/stock/transfer', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { stockItemId, targetLocationId, quantity, reason, operatorName, technicalManager } = req.body;

  if (!stockItemId || !targetLocationId || !quantity || Number(quantity) <= 0) {
    return res.status(400).json({ error: 'Item de estoque, local de destino e quantidade são obrigatórios.' });
  }

  const stockItem = db.stock.find((s) => s.id === stockItemId);
  if (!stockItem) {
    return res.status(404).json({ error: 'Item de estoque original não encontrado.' });
  }

  const targetLocation = db.locations.find((l) => l.id === targetLocationId || l.label === targetLocationId);
  if (!targetLocation) {
    return res.status(404).json({ error: 'Local de destino não encontrado.' });
  }

  const qty = Number(quantity);
  if (qty > stockItem.quantity) {
    return res.status(400).json({ error: `Quantidade para transferência excede o saldo (${stockItem.quantity}).` });
  }

  const fromLabel = stockItem.locationLabel;
  stockItem.quantity -= qty;
  stockItem.lastUpdated = new Date().toISOString();

  // Find or create in target location
  const existingInTarget = db.stock.find(
    (s) => s.productId === stockItem.productId && s.lot === stockItem.lot && s.locationId === targetLocation.id
  );

  if (existingInTarget) {
    existingInTarget.quantity += qty;
    existingInTarget.lastUpdated = new Date().toISOString();
  } else {
    db.stock.unshift({
      id: `stk-${Date.now()}`,
      productId: stockItem.productId,
      sku: stockItem.sku,
      productName: stockItem.productName,
      locationId: targetLocation.id,
      locationLabel: targetLocation.label,
      sectorId: targetLocation.sectorId,
      aisle: targetLocation.aisle,
      shelf: targetLocation.shelf,
      lot: stockItem.lot,
      manufacturingDate: stockItem.manufacturingDate,
      expiryDate: stockItem.expiryDate,
      quantity: qty,
      reservedQuantity: 0,
      unit: stockItem.unit,
      status: 'available',
      lastUpdated: new Date().toISOString(),
    });
  }

  if (stockItem.quantity <= 0 && stockItem.reservedQuantity <= 0) {
    db.stock = db.stock.filter((s) => s.id !== stockItem.id);
  }

  const currentProductStock = db.stock.filter((s) => s.productId === stockItem.productId).reduce((sum, s) => sum + s.quantity, 0);

  const movement: StockMovement = {
    id: `mov-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'TRANSFER',
    productId: stockItem.productId,
    sku: stockItem.sku,
    productName: stockItem.productName,
    lot: stockItem.lot,
    quantity: qty,
    previousBalance: currentProductStock,
    newBalance: currentProductStock,
    fromLocationLabel: fromLabel,
    toLocationLabel: targetLocation.label,
    documentRef: `TRF-${Date.now().toString().slice(-6)}`,
    reason: reason || 'Transferência interna para otimização de armazenagem',
    operatorName: operatorName || 'Operador Empilhadeira',
    technicalManager: technicalManager || db.settings.technicalManager,
  };

  db.movements.unshift(movement);
  saveDatabase(db);

  res.json({ success: true, movement });
});

// Movements (Audit Log)
router.get('/movements', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.movements);
});

// Picking Orders
router.get('/picking', (_req: Request, res: Response) => {
  const db = loadDatabase();
  res.json(db.pickingOrders);
});

// Create Picking Order with automatic routing
router.post('/picking', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { customer, priority, notes, dispatchDock, items, technicalManager } = req.body;

  if (!customer || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cliente e lista de itens a separar são obrigatórios.' });
  }

  const orderNumber = `PK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const techMgr = technicalManager || db.settings.technicalManager;

  const pickingItems: PickingItem[] = [];

  for (const it of items) {
    const product = db.products.find((p) => p.id === it.productId || p.sku === it.sku);
    if (!product) continue;

    // Find available stock for this product (FIFO / First available lot)
    const availableStock = db.stock.find((s) => s.productId === product.id && s.quantity - s.reservedQuantity >= (it.quantity || 1));
    const stockToUse = availableStock || db.stock.find((s) => s.productId === product.id && s.quantity > 0);

    const locationLabel = stockToUse ? stockToUse.locationLabel : 'A-C01-P01';
    const locParts = locationLabel.split('-');
    const sector = locParts[0] || 'A';
    const aisle = locParts[1] || 'C01';
    const shelf = parseInt(locParts[2]?.replace(/\D/g, '') || '1');

    const qtyReq = Number(it.quantity) || 1;

    pickingItems.push({
      id: `pki-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      locationId: stockToUse ? stockToUse.locationId : `loc-${locationLabel.toLowerCase()}`,
      locationLabel,
      sector,
      aisle,
      shelf,
      lot: stockToUse ? stockToUse.lot : 'LOTE-PADRÃO',
      quantityRequired: qtyReq,
      quantityPicked: 0,
      status: 'pending',
    });

    // Reserve stock if found
    if (stockToUse) {
      stockToUse.reservedQuantity += qtyReq;
    }
  }

  // Optimize picking route: sort by Sector -> Aisle -> Shelf (S-shape / Snake routing)
  pickingItems.sort((a, b) => {
    if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
    if (a.aisle !== b.aisle) return a.aisle.localeCompare(b.aisle);
    return a.shelf - b.shelf;
  });

  const newOrder: PickingOrder = {
    id: `ord-${Date.now()}`,
    orderNumber,
    customer,
    priority: priority || 'normal',
    status: 'pending',
    createdAt: new Date().toISOString(),
    technicalManager: techMgr,
    items: pickingItems,
    totalItems: pickingItems.length,
    pickedItems: 0,
    notes: notes || '',
    dispatchDock: dispatchDock || 'Doca 01 - Carga Geral',
  };

  db.pickingOrders.unshift(newOrder);
  saveDatabase(db);

  res.status(201).json(newOrder);
});

// Update Picking Item (Confirm Picked)
router.put('/picking/:orderId/item/:itemId', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { orderId, itemId } = req.params;
  const { quantityPicked, operatorName } = req.body;

  const order = db.pickingOrders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Ordem de separação não encontrada.' });
  }

  const item = order.items.find((i) => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item de separação não encontrado.' });
  }

  const qty = Number(quantityPicked) || item.quantityRequired;
  item.quantityPicked = qty;
  item.status = qty >= item.quantityRequired ? 'picked' : 'divergent';
  item.pickedAt = new Date().toISOString();
  item.pickedBy = operatorName || 'Operador Picking';

  // If order was pending, start it
  if (order.status === 'pending') {
    order.status = 'in_progress';
    order.startedAt = new Date().toISOString();
  }

  order.pickedItems = order.items.filter((i) => i.status === 'picked').length;

  saveDatabase(db);
  res.json({ success: true, order, item });
});

// Complete or update status of picking order
router.put('/picking/:orderId/status', (req: Request, res: Response) => {
  const db = loadDatabase();
  const { orderId } = req.params;
  const { status, operatorName, technicalManager } = req.body;

  const order = db.pickingOrders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Ordem de separação não encontrada.' });
  }

  const techMgr = technicalManager || db.settings.technicalManager;
  const operator = operatorName || order.assignedTo || 'Operador de Expedição';

  if (status === 'completed' && order.status !== 'completed') {
    order.status = 'completed';
    order.completedAt = new Date().toISOString();

    // Deduct stock and release reservations, creating outbound movements!
    order.items.forEach((item) => {
      const stockItem = db.stock.find((s) => s.locationLabel === item.locationLabel && s.productId === item.productId);
      const prevBal = db.stock.filter((s) => s.productId === item.productId).reduce((sum, s) => sum + s.quantity, 0);

      if (stockItem) {
        stockItem.quantity = Math.max(0, stockItem.quantity - item.quantityPicked);
        stockItem.reservedQuantity = Math.max(0, stockItem.reservedQuantity - item.quantityRequired);
        stockItem.lastUpdated = new Date().toISOString();
      }

      const movement: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: 'OUTBOUND',
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        lot: item.lot,
        quantity: -item.quantityPicked,
        previousBalance: prevBal,
        newBalance: prevBal - item.quantityPicked,
        fromLocationLabel: item.locationLabel,
        documentRef: `PED: ${order.orderNumber}`,
        reason: `Expedição Picking Cliente: ${order.customer}`,
        operatorName: operator,
        technicalManager: techMgr,
      };

      db.movements.unshift(movement);
    });

    // Cleanup empty stock items
    db.stock = db.stock.filter((s) => s.quantity > 0 || s.reservedQuantity > 0);
  } else if (status) {
    order.status = status;
    if (status === 'in_progress' && !order.startedAt) {
      order.startedAt = new Date().toISOString();
    }
  }

  saveDatabase(db);
  res.json({ success: true, order });
});

// KPIs & Operational Suggestions
router.get('/kpis', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const kpis = calculateKPIs(db);
  res.json(kpis);
});

// Backup: Export full JSON
router.get('/backup/export', (_req: Request, res: Response) => {
  const db = loadDatabase();
  createBackupSnapshot('Download manual de backup do sistema');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="wms_backup_${new Date().toISOString().slice(0, 10)}.json"`);
  res.send(JSON.stringify(db, null, 2));
});

// Backup: Create snapshot
router.post('/backup/snapshot', (req: Request, res: Response) => {
  const { note } = req.body;
  const snapshot = createBackupSnapshot(note || 'Snapshot manual');
  const db = loadDatabase();
  res.json({ success: true, snapshot, history: db.backupHistory });
});

// Backup: Restore
router.post('/backup/restore', (req: Request, res: Response) => {
  try {
    const backupData = req.body;
    restoreDatabase(backupData);
    res.json({ success: true, message: 'Banco de dados restaurado com sucesso!' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Falha na restauração do backup.' });
  }
});

// Reset Demo Data
router.post('/backup/reset-demo', (_req: Request, res: Response) => {
  const freshDb = resetDatabaseToDemo();
  res.json({ success: true, message: 'Base de dados resetada com sucesso para dados de demonstração.', data: freshDb });
});
