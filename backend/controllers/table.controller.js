import { TableModel } from '../models/Table.model.js';
import { eventHub } from '../services/eventHub.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTables = asyncHandler(async (req, res) => {
  const tables = TableModel.findAll();
  return ApiResponse.success(res, tables);
});

export const createTable = asyncHandler(async (req, res) => {
  const { tableNumber, zone, capacity } = req.body;
  if (!tableNumber) throw new ApiError(400, 'Table number is required');
  const created = TableModel.create({ tableNumber, zone, capacity });
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
