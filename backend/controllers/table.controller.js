import { TableModel } from '../models/Table.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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

export const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, zone, capacity } = req.body;
  if (!tableNumber) throw new ApiError(400, 'Table number is required');
  const created = TableModel.create({ tableNumber, zone, capacity });
  eventHub.broadcast('TABLE_CREATED', created);
  return ApiResponse.created(res, created);
});

export const updateTableStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, customerName, currentOrderId } = req.body;
  if (!status) throw new ApiError(400, 'Status is required');
  const updated = TableModel.updateStatus(id, status, customerName, currentOrderId);
  if (!updated) throw new ApiError(404, 'Table not found');
  eventHub.broadcast('TABLE_STATUS_CHANGED', { id, status });
  return ApiResponse.success(res, updated, 'Table status updated');
});

// --- QR CODE CONTROLLERS ---

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
      status: table.status,
      qrStatus: table.qrStatus,
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
