/**
 * Backend-Grade Strict Coupon Validation and Discount Calculator Engine
 */

export function validateAndCalculateCoupon({
  couponCode,
  cartItems = [],
  subtotal = 0,
  orderType = 'dine-in',
  customer = null,
  allCoupons = [],
  existingCoupon = null,
  enableCouponStacking = false
}) {
  if (!couponCode || couponCode.trim() === '') {
    return { isValid: false, error: 'Coupon code cannot be blank.' };
  }

  const cleanCode = couponCode.trim().toUpperCase();
  const coupon = allCoupons.find(
    (c) => c.code.toUpperCase() === cleanCode
  );

  if (!coupon) {
    return {
      isValid: false,
      error: `Coupon "${cleanCode}" is invalid or does not exist.`
    };
  }

  // 1. Status Check
  if (coupon.status !== 'active') {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" is currently ${coupon.status}.`
    };
  }

  // 2. Expiry & Date Range Check
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (coupon.startDate && todayStr < coupon.startDate) {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" is scheduled to start on ${coupon.startDate}.`
    };
  }

  if (coupon.expiryDate && todayStr > coupon.expiryDate) {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" has expired on ${coupon.expiryDate}.`
    };
  }

  // 3. Overall Usage Limit
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" global usage limit has been reached.`
    };
  }

  // 4. Minimum Order Requirement
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    return {
      isValid: false,
      error: `Minimum order value of ₹${coupon.minOrderValue} required for coupon "${coupon.code}". (Current: ₹${subtotal.toFixed(2)})`
    };
  }

  // 5. Maximum Order Restriction
  if (coupon.maxOrderValue && subtotal > coupon.maxOrderValue) {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" is only valid on orders up to ₹${coupon.maxOrderValue}.`
    };
  }

  // 6. Order Type Check
  if (
    coupon.applicableOrderTypes &&
    coupon.applicableOrderTypes.length > 0 &&
    !coupon.applicableOrderTypes.includes(orderType.toLowerCase())
  ) {
    return {
      isValid: false,
      error: `Coupon "${coupon.code}" is not valid for ${orderType} orders. Allowed: ${coupon.applicableOrderTypes.join(', ')}.`
    };
  }

  // 7. Customer Eligibility Check
  if (coupon.customerEligibility === 'new') {
    if (customer && customer.totalOrders > 0) {
      return {
        isValid: false,
        error: `Coupon "${coupon.code}" is exclusively reserved for first-time guests.`
      };
    }
  }

  if (coupon.customerEligibility === 'vip') {
    if (!customer || !['Gold', 'Platinum'].includes(customer.tier)) {
      return {
        isValid: false,
        error: `Coupon "${coupon.code}" is reserved for Gold and Platinum Loyalty members.`
      };
    }
  }

  // 8. Category Restrictions Check
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const hasMatchingCategory = cartItems.some((item) =>
      coupon.applicableCategories.includes(item.category)
    );
    if (!hasMatchingCategory) {
      return {
        isValid: false,
        error: `Coupon "${coupon.code}" is only valid on select categories.`
      };
    }
  }

  // 9. Stacking Check
  if (existingCoupon && !enableCouponStacking) {
    return {
      isValid: false,
      error: 'Coupon stacking is disabled. Please remove the current coupon first.'
    };
  }

  // 10. Calculate Exact Discount Amount
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    const rawDiscount = (subtotal * coupon.discountValue) / 100;
    discountAmount = coupon.maxDiscount
      ? Math.min(rawDiscount, coupon.maxDiscount)
      : rawDiscount;
  } else if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  // Prevent negative balance or excessive discount
  discountAmount = Math.max(0, Math.min(discountAmount, subtotal));

  return {
    isValid: true,
    coupon,
    discountAmount: Number(discountAmount.toFixed(2)),
    successMessage: `Coupon "${coupon.code}" applied! You saved ₹${discountAmount.toFixed(2)} (${coupon.name})`
  };
}
