import { CouponModel } from '../models/Customer.model.js';
import { ApiError } from '../utils/ApiError.js';
import { roundCurrency } from '../utils/helpers.js';

export class CouponService {
  /**
   * Strictly validate coupon against current cart and rules
   */
  static validateCoupon({ couponCode, subtotal, cartItems = [], orderType = 'dine-in', customerId }) {
    if (!couponCode || !couponCode.trim()) {
      throw new ApiError(400, 'Coupon code cannot be empty');
    }

    const cleanCode = couponCode.trim().toUpperCase();
    const coupon = CouponModel.findByCode(cleanCode);

    if (!coupon) {
      throw new ApiError(400, `Coupon "${cleanCode}" is invalid or does not exist.`);
    }

    if (coupon.status !== 'active') {
      throw new ApiError(400, `Coupon "${coupon.code}" is currently ${coupon.status}.`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (coupon.startDate && todayStr < coupon.startDate) {
      throw new ApiError(400, `Coupon "${coupon.code}" starts on ${coupon.startDate}.`);
    }

    if (coupon.expiryDate && todayStr > coupon.expiryDate) {
      throw new ApiError(400, `Coupon "${coupon.code}" expired on ${coupon.expiryDate}.`);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, `Coupon "${coupon.code}" total usage limit has been reached.`);
    }

    const totalNum = Number(subtotal || 0);
    if (coupon.minOrderValue && totalNum < coupon.minOrderValue) {
      throw new ApiError(400, `Min order value of ₹${coupon.minOrderValue} required for coupon "${coupon.code}". (Current: ₹${totalNum.toFixed(2)})`);
    }

    if (coupon.maxOrderValue && totalNum > coupon.maxOrderValue) {
      throw new ApiError(400, `Coupon "${coupon.code}" only valid up to ₹${coupon.maxOrderValue}.`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      const raw = (totalNum * coupon.discountValue) / 100;
      discountAmount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    } else {
      discountAmount = Math.min(coupon.discountValue, totalNum);
    }

    discountAmount = Math.max(0, Math.min(discountAmount, totalNum));
    discountAmount = roundCurrency(discountAmount);

    return {
      isValid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discountAmount,
      successMessage: `Coupon "${coupon.code}" applied! You save ₹${discountAmount.toFixed(2)}`
    };
  }
}
