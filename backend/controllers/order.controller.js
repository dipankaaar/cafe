import { OrderModel } from '../models/Order.model.js';
import { CustomerModel } from '../models/Customer.model.js';
import { AuditLogModel } from '../models/System.model.js';
import { OrderService } from '../services/order.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getOrders = asyncHandler(async (req, res) => {
  const { status, type, source, search, date, branchId, deliveryStatus, limit, offset } = req.query;
  const orders = OrderModel.findAll({
    status,
    type,
    source,
    search,
    date,
    branchId,
    deliveryStatus,
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
  const isDelivery = String(order.orderType || '').toLowerCase() === 'delivery';
  const otpVisible = isDelivery && ['out_for_delivery', 'delivered'].includes(String(order.status || '').toLowerCase());
  return ApiResponse.success(res, {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    orderSource: order.orderSource,
    tableId: order.tableId,
    tableNumber: order.tableNumber,
    branchId: order.branchId,
    status: order.status,
    orderTime: order.orderTime,
    customerName: order.customerName,
    items: order.items,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    taxAmount: order.taxAmount,
    grandTotal: order.grandTotal,
    kitchenAcceptedAt: order.kitchenAcceptedAt,
    kitchenReadyAt: order.kitchenReadyAt,
    completedAt: order.completedAt,
    // Delivery leg (address + rider always visible; OTP only after dispatch)
    deliveryAddress: order.deliveryAddress || '',
    deliveryLandmark: order.deliveryLandmark || '',
    deliveryInstructions: order.deliveryInstructions || '',
    deliveryStatus: order.deliveryStatus || null,
    riderName: order.riderName || '',
    riderPhone: order.riderPhone || '',
    deliveryOtp: otpVisible ? order.deliveryOtp : null,
    outForDeliveryAt: order.outForDeliveryAt || null,
    deliveredAt: order.deliveredAt || null
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
  return ApiResponse.success(res, updated, `Order status updated to ${updated.status}`);
});

export const refundOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  const updated = OrderService.refundOrder(id, reason || 'Refund via Orders dashboard', req.ip || '127.0.0.1');
  return ApiResponse.success(res, updated, `Order ${updated.orderNumber} refunded`);
});

export const assignRider = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { riderName, riderPhone, riderId } = req.body || {};
  const updated = OrderService.assignRider(id, { riderName, riderPhone, riderId }, req.ip || '127.0.0.1');
  return ApiResponse.success(res, updated, `Rider assigned to order ${updated.orderNumber}`);
});

export const verifyDelivery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { otp } = req.body || {};
  if (!otp) throw new ApiError(400, 'Handover OTP is required');
  const updated = OrderService.verifyDeliveryOtp(id, otp, req.ip || '127.0.0.1');
  return ApiResponse.success(res, updated, `Order ${updated.orderNumber} delivered`);
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = OrderModel.delete(id);
  if (!deleted) throw new ApiError(404, 'Order not found');
  AuditLogModel.log({
    user: 'Staff',
    action: 'DELETE_ORDER',
    category: 'Orders',
    details: `Deleted order ${id}`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, { id, success: true }, 'Order deleted successfully');
});

export const purgeDemoOrders = asyncHandler(async (req, res) => {
  const orderCount = OrderModel.purgeDemo();
  const customerCount = CustomerModel.purgeDemo();
  AuditLogModel.log({
    user: 'Admin',
    action: 'PURGE_DEMO_DATA',
    category: 'System',
    details: `Purged ${orderCount} legacy demo orders and ${customerCount} demo customer profiles`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, { purgedOrders: orderCount, purgedCustomers: customerCount, success: true }, `Purged ${orderCount} demo orders and ${customerCount} demo customers`);
});

