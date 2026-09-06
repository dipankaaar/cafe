import { TableModel } from '../models/Table.model.js';
import { AuditLogModel } from '../models/System.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { TABLE_STATUS } from '../config/constants.js';

const ALLOWED_STATUSES = Object.values(TABLE_STATUS); // Available, Occupied, Reserved, Cleaning

export const getTables = asyncHandler(async (req, res) => {
  const tables = TableModel.findAll();
  // Attach active orders count to each table for the dashboard
  const enriched = tables.map(t => {
    const active = TableModel.getActiveOrders(t.id);
    return {
      ...t,
      activeOrdersCount: active.length,
      activeOrders: active
    };
  });
  return ApiResponse.success(res, enriched);
});

export const getTableById = asyncHandler(async (req, res) => {
  const table = TableModel.findById(req.params.id);
  if (!table) throw new ApiError(404, 'Table not found');
  return ApiResponse.success(res, table);
});

export const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, zone, capacity, seats } = req.body;
  if (!tableNumber || !String(tableNumber).trim()) throw new ApiError(400, 'Table number is required');
  const cap = Number(capacity ?? seats ?? 4);
  if (!Number.isInteger(cap) || cap < 1 || cap > 30) {
    throw new ApiError(400, 'Seat count (capacity) must be an integer 1-30');
  }
  let created;
  try {
    created = TableModel.create({ tableNumber: String(tableNumber).trim(), zone, capacity: cap });
  } catch (e) {
    throw new ApiError(409, e.message || 'Table number already exists');
  }
  AuditLogModel.log({
    user: 'Staff', action: 'CREATE_TABLE', category: 'Tables',
    details: `Added table ${created.tableNumber} (${created.zone}, seats ${created.capacity})`,
    ip: req.ip || '127.0.0.1'
  });
  eventHub.broadcast('TABLE_CREATED', created);
  return ApiResponse.created(res, created);
});

// Admin edit: table number / zone / seat count
export const updateTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = TableModel.findById(id);
  if (!existing) throw new ApiError(404, 'Table not found');
  const capRaw = req.body.capacity !== undefined ? req.body.capacity : req.body.seats;
  if (capRaw !== undefined) {
    const cap = Number(capRaw);
    if (!Number.isInteger(cap) || cap < 1 || cap > 30) {
      throw new ApiError(400, 'Seat count (capacity) must be an integer 1-30');
    }
  }
  if (req.body.tableNumber !== undefined && !String(req.body.tableNumber).trim()) {
    throw new ApiError(400, 'Table number cannot be empty');
  }
  let updated;
  try {
    updated = TableModel.update(id, req.body);
  } catch (e) {
    throw new ApiError(409, e.message);
  }
  AuditLogModel.log({
    user: 'Staff', action: 'UPDATE_TABLE', category: 'Tables',
    details: `Edited table ${updated.tableNumber} (${updated.zone}, seats ${updated.capacity})`,
    ip: req.ip || '127.0.0.1'
  });
  eventHub.broadcast('TABLE_STATUS_CHANGED', { id, status: updated.status });
  return ApiResponse.success(res, updated, 'Table updated');
});

export const deleteTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = TableModel.findById(id);
  if (!existing) throw new ApiError(404, 'Table not found');
  try {
    TableModel.delete(id);
  } catch (e) {
    throw new ApiError(409, e.message);
  }
  AuditLogModel.log({
    user: 'Staff', action: 'DELETE_TABLE', category: 'Tables',
    details: `Deleted table ${existing.tableNumber}`,
    ip: req.ip || '127.0.0.1'
  });
  eventHub.broadcast('TABLE_DELETED', { id });
  return ApiResponse.success(res, { id }, 'Table deleted');
});

export const updateTableStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, customerName, currentOrderId } = req.body;
  if (!status) throw new ApiError(400, 'Status is required');
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
  }
  const existing = TableModel.findById(id);
  if (!existing) throw new ApiError(404, 'Table not found');
  const updated = TableModel.updateStatus(id, status, customerName, currentOrderId);
  if (!updated) throw new ApiError(404, 'Table not found');
  eventHub.broadcast('TABLE_STATUS_CHANGED', { id, status });
  eventHub.broadcast('table_updated', updated);
  return ApiResponse.success(res, updated, 'Table status updated');
});

// POST /api/tables/:id/occupy — seat guests (status Occupied, optional name/order link)
export const occupyTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customerName = null, currentOrderId = null } = req.body || {};
  const existing = TableModel.findById(id);
  if (!existing) throw new ApiError(404, 'Table not found');
  const updated = TableModel.updateStatus(id, 'Occupied', customerName, currentOrderId);
  eventHub.broadcast('TABLE_STATUS_CHANGED', { id, status: 'Occupied' });
  eventHub.broadcast('table_updated', updated);
  return ApiResponse.success(res, updated, `Table ${updated.tableNumber} is now occupied`);
});

// POST /api/tables/:id/release — free the table (status Available, clear guest/order)
export const releaseTable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = TableModel.findById(id);
  if (!existing) throw new ApiError(404, 'Table not found');
  const updated = TableModel.updateStatus(id, 'Available', null, null);
  eventHub.broadcast('TABLE_STATUS_CHANGED', { id, status: 'Available' });
  eventHub.broadcast('table_updated', updated);
  return ApiResponse.success(res, updated, `Table ${updated.tableNumber} released and available`);
});

// --- QR CODE CONTROLLERS (Agent 4 owns customer QR ordering; admin read/toggle kept) ---

export const getTableQr = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const table = TableModel.findById(id);
  if (!table) throw new ApiError(404, 'Table not found');
  const activeOrders = TableModel.getActiveOrders(id);
  return ApiResponse.success(res, {
    ...table,
    activeOrdersCount: activeOrders.length,
    activeOrders
  });
});

export const regenerateQrToken = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = TableModel.regenerateQrToken(id);
  if (!updated) throw new ApiError(404, 'Table not found');
  eventHub.broadcast('TABLE_QR_REGENERATED', { id, qrToken: updated.qrToken });
  return ApiResponse.success(res, updated, 'Table QR code regenerated successfully');
});

export const setQrStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status || !['active', 'disabled'].includes(status)) {
    throw new ApiError(400, 'Valid QR status ("active" or "disabled") is required');
  }
  const updated = TableModel.setQrStatus(id, status);
  if (!updated) throw new ApiError(404, 'Table not found');
  eventHub.broadcast('TABLE_QR_STATUS_CHANGED', { id, qrStatus: updated.qrStatus });
  return ApiResponse.success(res, updated, `QR Table ordering ${status === 'active' ? 'enabled' : 'disabled'}`);
});

export const validateQrToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) throw new ApiError(400, 'QR Token is required');

  const table = TableModel.findByQrToken(token);
  if (!table) {
    throw new ApiError(404, 'This QR code is invalid, expired, or no longer active.');
  }

  if (table.qrStatus === 'disabled') {
    throw new ApiError(403, `Ordering from Table ${table.tableNumber} is currently unavailable.`);
  }

  const activeOrders = TableModel.getActiveOrders(table.id);

  return ApiResponse.success(res, {
    valid: true,
    table: {
      id: table.id,
      tableNumber: table.tableNumber,
      zone: table.zone,
      capacity: table.capacity,
      seats: table.seats ?? table.capacity,
      status: table.status,
      qrToken: table.qrToken,
      qr_token: table.qrToken,
      qrStatus: table.qrStatus,
      currentOrderId: table.currentOrderId,
      current_order_id: table.currentOrderId,
      activeOrdersCount: activeOrders.length,
      activeOrders: activeOrders
    }
  });
});

export const getTableActiveOrders = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const table = TableModel.findById(id);
  if (!table) throw new ApiError(404, 'Table not found');
  const orders = TableModel.getActiveOrders(id);
  return ApiResponse.success(res, orders);
});

export const getTableOrderHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const table = TableModel.findById(id);
  if (!table) throw new ApiError(404, 'Table not found');
  const history = TableModel.getOrderHistory(id);
  return ApiResponse.success(res, history);
});
