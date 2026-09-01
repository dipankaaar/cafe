import { OrderModel } from '../models/Order.model.js';
import { OrderService } from '../services/order.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getOrders = asyncHandler(async (req, res) => {
  const { status, type, search, limit, offset } = req.query;
  const orders = OrderModel.findAll({
    status,
    type,
    search,
    limit: limit ? Number(limit) : 100,
    offset: offset ? Number(offset) : 0
  });
  return ApiResponse.success(res, orders);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = OrderModel.findById(id);
  if (!order) throw new ApiError(404, 'Order not found');
  return ApiResponse.success(res, order);
});

export const trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const order = OrderModel.findByOrderNumber(orderNumber);
  if (!order) throw new ApiError(404, `Order "${orderNumber}" not found`);
  return ApiResponse.success(res, {
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    status: order.status,
    orderTime: order.orderTime,
    customerName: order.customerName,
    items: order.items,
    grandTotal: order.grandTotal,
    kitchenAcceptedAt: order.kitchenAcceptedAt,
    kitchenReadyAt: order.kitchenReadyAt,
    completedAt: order.completedAt
  });
});

export const createOrder = asyncHandler(async (req, res) => {
  const created = OrderService.createOrder(req.body, req.ip || '127.0.0.1');
  return ApiResponse.created(res, created);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  if (!status) throw new ApiError(400, 'Status is required');
  const updated = OrderService.updateStatus(id, status, reason, req.ip || '127.0.0.1');
  return ApiResponse.success(res, updated, `Order status updated to ${status}`);
});
