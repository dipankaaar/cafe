import { CouponModel } from '../models/Customer.model.js';
import { CouponService } from '../services/coupon.service.js';
import { AuditLogModel } from '../models/System.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { isValidDateString } from '../utils/helpers.js';

function validateCouponPayload(body, { isUpdate = false } = {}) {
  const { code, discountType, discountValue, maxDiscount, minOrderValue, maxOrderValue, startDate, expiryDate, usageLimit, perCustomerLimit, status } = body;

  if (!isUpdate || code !== undefined) {
    if (!code || !String(code).trim() || !/^[A-Z0-9_-]{3,20}$/i.test(String(code).trim())) {
      throw new ApiError(400, 'Coupon code must be 3-20 chars (letters/numbers/_/-)');
    }
  }
  if (!isUpdate || discountType !== undefined) {
    if (!['percentage', 'fixed'].includes(discountType || (isUpdate ? 'percentage' : '')) && !isUpdate) {
      throw new ApiError(400, 'discountType must be "percentage" or "fixed"');
    }
    if (discountType !== undefined && !['percentage', 'fixed'].includes(discountType)) {
      throw new ApiError(400, 'discountType must be "percentage" or "fixed"');
    }
  }
  if (!isUpdate || discountValue !== undefined) {
    const v = Number(discountValue);
    if (!Number.isFinite(v) || v <= 0) throw new ApiError(400, 'discountValue must be a positive number');
    const type = discountType || 'percentage';
    if (type === 'percentage' && v > 90) throw new ApiError(400, 'Percentage discount cannot exceed 90%');
    if (type === 'fixed' && v > 5000) throw new ApiError(400, 'Flat discount cannot exceed Rs5000');
  }
  if (maxDiscount !== undefined && maxDiscount !== '' && maxDiscount !== null) {
    if (!Number.isFinite(Number(maxDiscount)) || Number(maxDiscount) <= 0) {
      throw new ApiError(400, 'maxDiscount must be a positive number');
    }
  }
  if (minOrderValue !== undefined && minOrderValue !== '' && minOrderValue !== null) {
    if (!Number.isFinite(Number(minOrderValue)) || Number(minOrderValue) < 0) {
      throw new ApiError(400, 'minOrderValue (min_spend) must be >= 0');
    }
  }
  if (maxOrderValue !== undefined && maxOrderValue !== '' && maxOrderValue !== null) {
    if (!Number.isFinite(Number(maxOrderValue)) || Number(maxOrderValue) <= 0) {
      throw new ApiError(400, 'maxOrderValue must be a positive number');
    }
  }
  if (startDate) {
    if (!isValidDateString(startDate)) throw new ApiError(400, 'startDate (valid_from) must be YYYY-MM-DD');
  }
  if (expiryDate) {
    if (!isValidDateString(expiryDate)) throw new ApiError(400, 'expiryDate (valid_to) must be YYYY-MM-DD');
  }
  if (startDate && expiryDate && expiryDate < startDate) {
    throw new ApiError(400, 'expiryDate (valid_to) cannot be before startDate (valid_from)');
  }
  if (usageLimit !== undefined && usageLimit !== '' && usageLimit !== null) {
    if (!Number.isInteger(Number(usageLimit)) || Number(usageLimit) <= 0) {
      throw new ApiError(400, 'usageLimit must be a positive integer');
    }
  }
  if (perCustomerLimit !== undefined && perCustomerLimit !== '' && perCustomerLimit !== null) {
    if (!Number.isInteger(Number(perCustomerLimit)) || Number(perCustomerLimit) <= 0) {
      throw new ApiError(400, 'perCustomerLimit must be a positive integer');
    }
  }
  if (status !== undefined && !['active', 'disabled', 'expired'].includes(status)) {
    throw new ApiError(400, 'status must be active/disabled/expired');
  }
}

export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = CouponModel.findAll();
  return ApiResponse.success(res, coupons);
});

export const getCouponById = asyncHandler(async (req, res) => {
  const coupon = CouponModel.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found');
  return ApiResponse.success(res, coupon);
});

// Strict validate endpoint: POST /api/coupons/validate
export const validateCoupon = asyncHandler(async (req, res) => {
  const result = CouponService.validateCoupon(req.body);
  return ApiResponse.success(res, result);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountValue } = req.body;
  if (!code || discountValue === undefined) {
    throw new ApiError(400, 'Coupon code and discount value are required');
  }
  validateCouponPayload(req.body);
  const normalized = { ...req.body, code: String(code).trim().toUpperCase() };
  if (CouponModel.findByCode(normalized.code)) {
    throw new ApiError(409, `Coupon code "${normalized.code}" already exists`);
  }
  const created = CouponModel.create(normalized);
  AuditLogModel.log({
    user: 'Staff', action: 'CREATE_COUPON', category: 'Coupons',
    details: `Created coupon "${created.code}" (${created.discountType} ${created.discountValue})`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.created(res, created);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = CouponModel.findById(id);
  if (!existing) throw new ApiError(404, 'Coupon not found');
  validateCouponPayload(req.body, { isUpdate: true });
  const payload = { ...req.body };
  if (payload.code !== undefined) payload.code = String(payload.code).trim().toUpperCase();
  let updated;
  try {
    updated = CouponModel.update(id, payload);
  } catch (e) {
    throw new ApiError(409, e.message);
  }
  AuditLogModel.log({
    user: 'Staff', action: 'UPDATE_COUPON', category: 'Coupons',
    details: `Updated coupon "${updated.code}"`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, updated, 'Coupon updated');
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = CouponModel.findById(id);
  if (!existing) throw new ApiError(404, 'Coupon not found');
  if (Number(existing.usedCount || 0) > 0) {
    throw new ApiError(409, `Cannot delete "${existing.code}": already redeemed ${existing.usedCount} time(s). Disable it instead.`);
  }
  CouponModel.delete(id);
  AuditLogModel.log({
    user: 'Staff', action: 'DELETE_COUPON', category: 'Coupons',
    details: `Deleted coupon "${existing.code}"`,
    ip: req.ip || '127.0.0.1'
  });
  return ApiResponse.success(res, { id }, 'Coupon deleted');
});

export const toggleCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const toggled = CouponModel.toggleStatus(id);
  if (!toggled) throw new ApiError(404, 'Coupon not found');
  return ApiResponse.success(res, toggled, 'Coupon status toggled');
});
