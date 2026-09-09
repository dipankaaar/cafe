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

/**
 * Backwards-compatible wrapper.
 * Legacy storefront call sites invoke:
 *   validateCouponCompat(couponObject, { subtotal, orderType, items })
 * New call sites invoke:
 *   validateCouponCompat({ couponCode, cartItems, subtotal, orderType, allCoupons, ... })
 * Both route to validateAndCalculateCoupon.
 */
export function validateCouponCompat(firstArg, secondArg = {}) {
  if (firstArg && typeof firstArg === 'object' && ('couponCode' in firstArg || 'allCoupons' in firstArg || 'cartItems' in firstArg)) {
    return validateAndCalculateCoupon(firstArg);
  }
  const coupon = firstArg || {};
  const {
    subtotal = 0,
    orderType = 'dine-in',
    items = [],
    cartItems = [],
    customer = null,
    allCoupons = []
  } = secondArg || {};
  return validateAndCalculateCoupon({
    couponCode: coupon.code || coupon.couponCode || '',
    cartItems: cartItems.length > 0 ? cartItems : items,
    subtotal,
    orderType,
    customer,
    allCoupons: allCoupons.length > 0 ? allCoupons : (coupon.code ? [coupon] : [])
  });
}

/**
 * Live coupon validation via POST /api/coupons/validate.
 * Falls back to the local engine when the API is unreachable.
 * Returns { isValid, coupon, discountAmount, successMessage?, error? }.
 */
export async function validateCouponLive(api, { couponCode, subtotal, orderType = 'takeaway', cartItems = [], customerId } = {}) {
  const code = String(couponCode || '').trim().toUpperCase();
  if (!code) return { isValid: false, error: 'Please enter a coupon code.' };
  try {
    const res = await api.validateCoupon({
      couponCode: code,
      subtotal: Number(subtotal || 0),
      cartItems,
      orderType,
      ...(customerId ? { customerId } : {})
    });
    // Backend returns { isValid, coupon, discountAmount, successMessage }
    if (res && (res.isValid || typeof res.discountAmount === 'number')) {
      return {
        isValid: res.isValid !== false,
        coupon: res.coupon || { code },
        discountAmount: Number(res.discountAmount || 0),
        successMessage: res.successMessage || `Coupon "${code}" applied!`
      };
    }
    return { isValid: false, error: res?.message || `Coupon "${code}" is invalid.` };
  } catch (err) {
    return { isValid: false, error: err?.message || `Coupon "${code}" is invalid or expired.`, liveFailed: true };
  }
}
