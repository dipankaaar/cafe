import { InventoryModel, SupplierModel, PurchaseModel } from '../models/Inventory.model.js';
import { ExpenseModel } from '../models/System.model.js';
import { AuditLogModel, NotificationModel } from '../models/System.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// --- INVENTORY ---
export const getInventory = asyncHandler(async (req, res) => {
  const { low_stock_only } = req.query;
  let items = InventoryModel.findAll();
  if (low_stock_only === 'true') items = items.filter((i) => i.status === 'Low Stock' || i.currentStock <= i.minStock);
  return ApiResponse.success(res, items);
});

export const getInventoryById = asyncHandler(async (req, res) => {
  const item = InventoryModel.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Inventory item not found');
  return ApiResponse.success(res, item);
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Item name is required');
  const created = InventoryModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const updated = InventoryModel.update(req.params.id, req.body);
  if (!updated) throw new ApiError(404, 'Inventory item not found');
  return ApiResponse.success(res, updated, 'Inventory item updated');
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const success = InventoryModel.delete(req.params.id);
  if (!success) throw new ApiError(404, 'Inventory item not found');
  return ApiResponse.success(res, { id: req.params.id, success: true }, 'Inventory item deleted');
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const b = req.body || {};
  // Accept aliases: {itemId|id|inventoryId} + {delta|quantity+type|qty}
  const itemId = b.itemId || b.id || b.inventoryId;
  let delta = b.delta;
  if (delta === undefined) {
    const qty = Number(b.quantity ?? b.qty ?? 0);
    const type = String(b.type || b.direction || 'IN').toUpperCase();
    delta = (type === 'OUT' || type === 'DEDUCT' || type === 'DECREASE' || type === 'REMOVE') ? -Math.abs(qty) : Math.abs(qty);
  }
  const reason = b.reason || b.note || 'Manual count';
  if (!itemId || delta === undefined || Number.isNaN(Number(delta))) {
    throw new ApiError(400, 'Item ID and adjustment delta/quantity are required');
  }

  const updated = InventoryModel.adjustStock(itemId, Number(delta));
  if (!updated) throw new ApiError(404, 'Inventory item not found');

  if (updated.status === 'Low Stock') {
    const lowNotif = NotificationModel.create({
      title: 'Low Stock Alert',
      message: `${updated.name} stock has dropped to ${updated.currentStock} ${updated.unit}`,
      type: 'warning',
      link: '/inventory'
    });
    eventHub.broadcast('NEW_NOTIFICATION', lowNotif);
    eventHub.broadcast('LOW_STOCK_ALERT', lowNotif);
  }

  AuditLogModel.log({
    user: 'Staff',
    action: 'ADJUST_STOCK',
    category: 'Inventory',
    details: `Adjusted ${updated.name} stock by ${Number(delta) > 0 ? '+' : ''}${delta} ${updated.unit} (${reason})`,
    ip: req.ip || '127.0.0.1'
  });

  return ApiResponse.success(res, updated, 'Inventory stock updated');
});

// --- SUPPLIERS (full CRUD) ---
export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = SupplierModel.findAll();
  return ApiResponse.success(res, suppliers);
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const sup = SupplierModel.findById(req.params.id);
  if (!sup) throw new ApiError(404, 'Supplier not found');
  return ApiResponse.success(res, sup);
});

export const createSupplier = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Supplier name is required');
  const created = SupplierModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const updated = SupplierModel.update(req.params.id, req.body);
  if (!updated) throw new ApiError(404, 'Supplier not found');
  return ApiResponse.success(res, updated, 'Supplier updated');
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  const success = SupplierModel.delete(req.params.id);
  if (!success) throw new ApiError(404, 'Supplier not found');
  return ApiResponse.success(res, { id: req.params.id, success: true }, 'Supplier deleted');
});

// --- PURCHASES (PO create -> receive increases stock + records expense) ---
export const getPurchases = asyncHandler(async (req, res) => {
  const { status, supplierId } = req.query;
  let purchases = PurchaseModel.findAll();
  if (status && status !== 'all') purchases = purchases.filter((p) => p.status === status);
  if (supplierId) purchases = purchases.filter((p) => p.supplierId === supplierId);
  return ApiResponse.success(res, purchases);
});

export const getPurchaseById = asyncHandler(async (req, res) => {
  const po = PurchaseModel.findById(req.params.id);
  if (!po) throw new ApiError(404, 'Purchase order not found');
  return ApiResponse.success(res, po);
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const items = b.items || b.items_json || b.lineItems;
  if (!items || items.length === 0) {
    throw new ApiError(400, 'Purchase Order must have at least one line item');
  }
  const created = PurchaseModel.create(b);

  NotificationModel.create({
    title: created.status === 'Pending' ? 'Purchase Order Created' : 'Purchase Order Received',
    message: `${created.status === 'Pending' ? 'Created' : 'Received'} ${items.length} item(s) from ${created.supplierName || 'Supplier'} (PO #${created.poNumber})`,
    type: 'inventory',
    link: '/purchases'
  });

  AuditLogModel.log({
    user: 'Staff',
    action: 'CREATE_PURCHASE',
    category: 'Purchases',
    details: `Created PO #${created.poNumber} (${created.status}) for ₹${Number(created.totalAmount || 0).toFixed(2)}`,
    ip: req.ip || '127.0.0.1'
  });

  return ApiResponse.created(res, created);
});

export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const updated = PurchaseModel.update(req.params.id, req.body);
  if (!updated) throw new ApiError(404, 'Purchase order not found');
  return ApiResponse.success(res, updated, 'Purchase order updated');
});

export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const success = PurchaseModel.delete(req.params.id);
  if (!success) throw new ApiError(404, 'Purchase order not found');
  return ApiResponse.success(res, { id: req.params.id, success: true }, 'Purchase order deleted');
});

/**
 * POST /inventory/purchases/:id/receive
 * Marks PO Received -> bumps inventory stock (idempotent) + records purchase expense.
 */
export const receivePurchaseOrder = asyncHandler(async (req, res) => {
  const existing = PurchaseModel.findById(req.params.id);
  if (!existing) throw new ApiError(404, 'Purchase order not found');

  const { order, alreadyReceived } = PurchaseModel.receive(req.params.id);

  let expense = null;
  if (!alreadyReceived) {
    // Record purchase as an expense (idempotent per PO via title+date match guard)
    try {
      const title = `PO #${order.poNumber} — ${order.supplierName}`;
      const dup = ExpenseModel.findAll({}).find((e) => e.title === title && e.date === order.receivedDate);
      if (!dup) {
        expense = ExpenseModel.create({
          title,
          category: 'Purchases',
          amount: Number(order.totalAmount || 0),
          paymentMethod: req.body?.paymentMethod || 'Cash',
          date: order.receivedDate || new Date().toISOString().split('T')[0],
          loggedBy: 'Inventory'
        });
      }
    } catch (e) { /* expense recording is best-effort */ }

    NotificationModel.create({
      title: 'Purchase Order Received',
      message: `Received ${order.items.length} item(s) from ${order.supplierName} (PO #${order.poNumber}) — stock updated`,
      type: 'inventory',
      link: '/purchases'
    });

    AuditLogModel.log({
      user: 'Staff',
      action: 'RECEIVE_PURCHASE',
      category: 'Purchases',
      details: `Received PO #${order.poNumber} for ₹${Number(order.totalAmount || 0).toFixed(2)}, restocked inventory, recorded expense`,
      ip: req.ip || '127.0.0.1'
    });
  }

  return ApiResponse.success(res, { ...order, expense, alreadyReceived }, alreadyReceived ? 'Purchase order already received' : 'Purchase order received, stock updated');
});
