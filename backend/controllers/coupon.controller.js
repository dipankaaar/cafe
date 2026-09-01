import { CouponModel } from '../models/Customer.model.js';
import { CouponService } from '../services/coupon.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

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
