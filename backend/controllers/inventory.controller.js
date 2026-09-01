import { InventoryModel, SupplierModel, PurchaseModel } from '../models/Inventory.model.js';
import { AuditLogModel, NotificationModel } from '../models/System.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// --- INVENTORY ---
export const getInventory = asyncHandler(async (req, res) => {
  const items = InventoryModel.findAll();
  return ApiResponse.success(res, items);
});

export const adjustInventory = asyncHandler(async (req, res) => {
  const { itemId, delta, reason } = req.body;
  if (!itemId || delta === undefined) {
    throw new ApiError(400, 'Item ID and adjustment delta are required');
  }

  const updated = InventoryModel.adjustStock(itemId, delta);
  if (!updated) throw new ApiError(404, 'Inventory item not found');

  if (updated.status === 'Low Stock') {
    NotificationModel.create({
      title: 'Low Stock Alert',
      message: `${updated.name} stock has dropped to ${updated.currentStock} ${updated.unit}`,
      type: 'warning',
      link: '/inventory'
    });
  }

  AuditLogModel.log({
    user: 'Staff',
    action: 'ADJUST_STOCK',
    category: 'Inventory',
    details: `Adjusted ${updated.name} stock by ${delta > 0 ? '+' : ''}${delta} ${updated.unit} (${reason || 'Manual count'})`,
    ip: req.ip || '127.0.0.1'
  });

  return ApiResponse.success(res, updated, 'Inventory stock updated');
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Item name is required');
  const created = InventoryModel.create(req.body);
  return ApiResponse.created(res, created);
});

// --- SUPPLIERS & PURCHASES ---
export const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = SupplierModel.findAll();
  return ApiResponse.success(res, suppliers);
});

export const createSupplier = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name) throw new ApiError(400, 'Supplier name is required');
  const created = SupplierModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const getPurchases = asyncHandler(async (req, res) => {
  const purchases = PurchaseModel.findAll();
  return ApiResponse.success(res, purchases);
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { supplierName, items } = req.body;
  if (!items || items.length === 0) {
    throw new ApiError(400, 'Purchase Order must have at least one line item');
  }
  const created = PurchaseModel.create(req.body);

  NotificationModel.create({
    title: 'Purchase Order Received',
    message: `Received ${items.length} items from ${supplierName || 'Supplier'} (PO #${created.poNumber})`,
    type: 'inventory',
    link: '/purchases'
  });

  return ApiResponse.created(res, created);
});
