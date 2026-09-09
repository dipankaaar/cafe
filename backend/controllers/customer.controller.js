import { CustomerModel, CouponModel } from '../models/Customer.model.js';
import { OrderModel } from '../models/Order.model.js';
import { CouponService } from '../services/coupon.service.js';
import { AuditLogModel } from '../models/System.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidIndianPhone, normalizeIndianPhone, isValidEmail } from '../utils/helpers.js';

function validateCustomerPayload({ name, phone, email }, { requireAll = true } = {}) {
  if (requireAll || name !== undefined) {
    if (!name || !String(name).trim() || String(name).trim().length < 2) {
      throw new ApiError(400, 'Customer name must be at least 2 characters');
    }
  }
  if (requireAll || phone !== undefined) {
    if (!phone || !isValidIndianPhone(phone)) {
      throw new ApiError(400, 'Enter a valid 10-digit Indian mobile number (starts with 6-9)');
    }
  }
  if (email !== undefined && email !== '' && email !== null && !isValidEmail(email)) {
    throw new ApiError(400, 'Enter a valid email address');
  }
}

// --- CUSTOMERS ---
export const getCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const customers = CustomerModel.findAll({ search });
  return ApiResponse.success(res, customers);
});

export const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = CustomerModel.findById(id);
  if (!customer) throw new ApiError(404, 'Customer not found');
  return ApiResponse.success(res, customer);
});

export const getCustomerByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.query;
  if (!phone) throw new ApiError(400, 'Phone number is required');
  const customer = CustomerModel.findByPhone(phone);
  if (!customer) {
    return ApiResponse.success(res, null, 'Customer not found');
  }
  return ApiResponse.success(res, customer);
});

// Order history per customer (id or phone)
export const getCustomerOrders = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const customer = CustomerModel.findById(id);
  const lookupKey = customer ? customer.id : id;
  let orders = OrderModel.findByCustomer(lookupKey);
  if (orders.length === 0 && customer?.phone) {
    orders = OrderModel.findByCustomer(customer.phone);
  }
  return ApiResponse.success(res, orders);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, notes } = req.body;
  if (!name || !phone) throw new ApiError(400, 'Customer name and phone are required');
  validateCustomerPayload({ name, phone, email });
  const normalized = normalizeIndianPhone(phone);
  const existing = CustomerModel.findByPhone(normalized);
  if (existing) throw new ApiError(409, `Customer with phone ${normalized} already exists (${existing.name})`);
  const created = CustomerModel.create({ ...req.body, name: String(name).trim(), phone: normalized });
  AuditLogModel.log({
    user: 'Staff',
    action: 'CREATE_CUSTOMER',
    category: 'Customers',
    details: `Created customer profile for "${created.name}" (${created.phone})`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.created(res, created);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = CustomerModel.findById(id);
  if (!existing) throw new ApiError(404, 'Customer not found');
  validateCustomerPayload(req.body, { requireAll: false });
  if (req.body.phone !== undefined) {
    const normalized = normalizeIndianPhone(req.body.phone);
    const clash = CustomerModel.findByPhone(normalized);
    if (clash && clash.id !== id) {
      throw new ApiError(409, `Phone ${normalized} already belongs to ${clash.name}`);
    }
    req.body.phone = normalized;
  }
  if (req.body.name !== undefined) req.body.name = String(req.body.name).trim();
  const updated = CustomerModel.update(id, req.body);
  AuditLogModel.log({
    user: 'Staff',
    action: 'UPDATE_CUSTOMER',
    category: 'Customers',
    details: `Updated customer profile for "${updated.name}" (${updated.phone})`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, updated, 'Customer updated');
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = CustomerModel.findById(id);
  if (!existing) throw new ApiError(404, 'Customer not found');
  const linked = OrderModel.findByCustomer(id);
  if (linked.length > 0) {
    throw new ApiError(409, `Cannot delete ${existing.name}: ${linked.length} order(s) linked. Keep profile for history.`);
  }
  CustomerModel.delete(id);
  AuditLogModel.log({
    user: 'Staff',
    action: 'DELETE_CUSTOMER',
    category: 'Customers',
    details: `Deleted customer profile "${existing.name}" (${existing.phone})`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, { id }, 'Customer deleted');
});

export const adjustLoyalty = asyncHandler(async (req, res) => {
  const { customerId, delta, reason } = req.body;
  if (!customerId || delta === undefined) {
    throw new ApiError(400, 'Customer ID and point adjustment delta are required');
  }
  const n = Number(delta);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new ApiError(400, 'Points delta must be an integer');
  }
  if (Math.abs(n) > 10000) throw new ApiError(400, 'Points adjustment too large (max ±10000)');

  const updated = CustomerModel.updateLoyalty(customerId, n);
  if (!updated) throw new ApiError(404, 'Customer not found');

  AuditLogModel.log({
    user: 'Staff',
    action: 'ADJUST_LOYALTY',
    category: 'Customers',
    details: `Adjusted loyalty points by ${n > 0 ? '+' : ''}${n} for ${updated.name} (${reason || 'Manual adjustment'})`,
    ip: req.ip || '127.0.0.1'
  });

  return ApiResponse.success(res, updated, 'Loyalty points adjusted');
});

// Redeem flow: 1 pt = Rs1, min threshold enforced
export const redeemLoyalty = asyncHandler(async (req, res) => {
  const { customerId, points, minThreshold } = req.body;
  if (!customerId || points === undefined) {
    throw new ApiError(400, 'customerId and points are required');
  }
  const threshold = Number(minThreshold || 50);
  const result = CustomerModel.redeemPoints(customerId, points, threshold);
  if (result.error) throw new ApiError(400, result.error);

  AuditLogModel.log({
    user: 'Staff',
    action: 'REDEEM_LOYALTY',
    category: 'Customers',
    details: `Redeemed ${points} loyalty points (Rs${points}) for ${result.customer.name}`,
    ip: req.ip || '127.0.0.1'
  });

  return ApiResponse.success(res, {
    customer: result.customer,
    pointsRedeemed: Math.floor(Number(points)),
    discountValue: result.discountValue
  }, `${points} points redeemed (Rs${points} off)`);
});

// --- COUPONS (legacy mirror; canonical routes live in coupon.controller.js) ---
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = CouponModel.findAll();
  return ApiResponse.success(res, coupons);
});

export const validateCoupon = asyncHandler(async (req, res) => {
  const result = CouponService.validateCoupon(req.body);
  return ApiResponse.success(res, result);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountValue } = req.body;
  if (!code || discountValue === undefined) {
    throw new ApiError(400, 'Coupon code and discount value are required');
  }
  const created = CouponModel.create(req.body);
  return ApiResponse.created(res, created);
});

export const toggleCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const toggled = CouponModel.toggleStatus(id);
  if (!toggled) throw new ApiError(404, 'Coupon not found');
  return ApiResponse.success(res, toggled, 'Coupon status toggled');
});
