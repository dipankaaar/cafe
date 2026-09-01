import { CustomerModel, CouponModel } from '../models/Customer.model.js';
import { CouponService } from '../services/coupon.service.js';
import { AuditLogModel } from '../models/System.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// --- CUSTOMERS ---
export const getCustomers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const customers = CustomerModel.findAll({ search });
  return ApiResponse.success(res, customers);
});

export const getCustomerByPhone = asyncHandler(async (req, res) => {
  const { phone } = req.query;
  if (!phone) throw new ApiError(400, 'Phone number is required');
  const customer = CustomerModel.findByPhone(phone);
  if (!customer) throw new ApiError(404, 'Customer not found');
  return ApiResponse.success(res, customer);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const { name, phone, email, notes } = req.body;
  if (!name || !phone) throw new ApiError(400, 'Customer name and phone are required');
  const created = CustomerModel.create({ name, phone, email, notes });
  return ApiResponse.created(res, created);
});

export const adjustLoyalty = asyncHandler(async (req, res) => {
  const { customerId, delta, reason } = req.body;
  if (!customerId || delta === undefined) {
    throw new ApiError(400, 'Customer ID and point adjustment delta are required');
  }

  const updated = CustomerModel.updateLoyalty(customerId, delta);
  if (!updated) throw new ApiError(404, 'Customer not found');

  AuditLogModel.log({
    user: 'Staff',
    action: 'ADJUST_LOYALTY',
    category: 'Customers',
    details: `Adjusted loyalty points by ${delta > 0 ? '+' : ''}${delta} for ${updated.name} (${reason || 'Manual adjustment'})`,
    ip: req.ip || '127.0.0.1'
  });

  return ApiResponse.success(res, updated, 'Loyalty points adjusted');
});

// --- COUPONS ---
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
