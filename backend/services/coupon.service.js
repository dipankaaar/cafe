import { CouponModel, CustomerModel } from '../models/Customer.model.js';
import { OrderModel } from '../models/Order.model.js';
import { ApiError } from '../utils/ApiError.js';
import { roundCurrency } from '../utils/helpers.js';

export class CouponService {
  /**
   * Strictly validate coupon against current cart and rules.
   * Checks: existence, status active, valid_from/to, usage_limit,
   * min_spend/max, %/flat + max_discount cap, categories, order types,
   * customer eligibility, per-customer limit.
   */
  static validateCoupon({ couponCode, code, subtotal, cartItems = [], orderType = 'dine-in', customerId, customerPhone, customer }) {
    const rawCode = couponCode || code;
    if (!rawCode || !String(rawCode).trim()) {
      throw new ApiError(400, 'Coupon code cannot be empty');
    }

    const cleanCode = String(rawCode).trim().toUpperCase();
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

    // Order-type restriction
    const oType = String(orderType || 'dine-in').toLowerCase();
    if (coupon.applicableOrderTypes && coupon.applicableOrderTypes.length > 0) {
      const allowed = coupon.applicableOrderTypes.map((t) => String(t).toLowerCase());
      if (!allowed.includes(oType)) {
        throw new ApiError(400, `Coupon "${coupon.code}" is not valid for ${orderType} orders. Allowed: ${coupon.applicableOrderTypes.join(', ')}.`);
      }
    }

    // Category restriction: at least one cart item must match
    if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
      const items = Array.isArray(cartItems) ? cartItems : [];
      const hasMatch = items.some((it) => {
        const cat = it.category || it.categoryName || it.categoryId;
        return cat && coupon.applicableCategories.includes(cat);
      });
      if (!hasMatch) {
        throw new ApiError(400, `Coupon "${coupon.code}" is only valid on select categories (${coupon.applicableCategories.join(', ')}).`);
      }
    }

    // Customer eligibility
    const cust = customer || (customerId ? CustomerModel.findById(customerId) : null);
    const eligibility = coupon.customerEligibility || 'all';
    if (eligibility === 'new') {
      if (cust && Number(cust.totalOrders || 0) > 0) {
        throw new ApiError(400, `Coupon "${coupon.code}" is exclusively reserved for first-time guests.`);
      }
    } else if (eligibility === 'vip') {
      if (!cust || !['Gold', 'Platinum'].includes(cust.tier)) {
        throw new ApiError(400, `Coupon "${coupon.code}" is reserved for Gold & Platinum loyalty members.`);
      }
    }

    // Per-customer usage limit (counted from orders history)
    const perLimit = Number(coupon.perCustomerLimit || 0);
    if (perLimit > 0 && (customerId || customerPhone || cust)) {
      const used = OrderModel.countCouponUsageByCustomer(
        coupon.code,
        customerId || cust?.id,
        customerPhone || cust?.phone
      );
      if (used >= perLimit) {
        throw new ApiError(400, `Coupon "${coupon.code}" per-customer limit (${perLimit}) already reached.`);
      }
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
