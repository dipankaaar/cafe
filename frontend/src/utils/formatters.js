/**
 * Frontend Formatting & Calculation Utilities
 * INR-first: all money goes through Intl.NumberFormat('en-IN', { currency: 'INR' }).
 */
import { useMemo } from 'react';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/** Format any amount as INR, e.g. ₹1,299.00 */
export function formatCurrency(amount, currency = 'INR') {
  const num = Number(amount || 0);
  if (currency && currency !== 'INR' && currency !== '₹') {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      /* fall through to INR */
    }
  }
  return inrFormatter.format(num);
}

/** Alias with explicit intent for menu / cart / billing surfaces. */
export function formatINR(amount, { whole = false } = {}) {
  const num = Number(amount || 0);
  return whole ? inrWholeFormatter.format(num) : inrFormatter.format(num);
}

/**
 * React hook wrapper around Intl for locale-aware INR formatting.
 * Usage: const { formatINR } = useIntl(); formatINR(299)
 */
export function useIntl(locale = 'en-IN', currency = 'INR') {
  return useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const wholeFormatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return {
      locale,
      currency,
      formatINR: (amount) => formatter.format(Number(amount || 0)),
      formatINRWhole: (amount) => wholeFormatter.format(Number(amount || 0)),
      formatNumber: (amount, opts) => new Intl.NumberFormat(locale, opts).format(Number(amount || 0))
    };
  }, [locale, currency]);
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch (e) {
    return dateString;
  }
}

export function formatTime(timeString) {
  if (!timeString) return '';
  try {
    const d = new Date(timeString);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(d);
    }
    return timeString;
  } catch (e) {
    return timeString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}

export const FALLBACK_PRODUCT_IMAGE =
  'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg';

export function getProductPrice(product, mode = 'online') {
  if (!product) return 0;
  if (mode === 'table' && product.tablePrice !== undefined && product.tablePrice !== null && product.tablePrice !== '') {
    return Number(product.tablePrice);
  }
  if (mode === 'online' && product.onlinePrice !== undefined && product.onlinePrice !== null && product.onlinePrice !== '') {
    return Number(product.onlinePrice);
  }
  return Number(product.sellingPrice ?? product.price ?? product.unitPrice ?? 0);
}

export function getProductTablePrice(product) {
  if (!product) return 0;
  if (product.tablePrice !== undefined && product.tablePrice !== null && product.tablePrice !== '') {
    return Number(product.tablePrice);
  }
  return Number(product.sellingPrice ?? product.price ?? product.unitPrice ?? 0);
}

export function getProductOnlinePrice(product) {
  if (!product) return 0;
  if (product.onlinePrice !== undefined && product.onlinePrice !== null && product.onlinePrice !== '') {
    return Number(product.onlinePrice);
  }
  return Number(product.sellingPrice ?? product.price ?? product.unitPrice ?? 0);
}

export function isProductTableEnabled(product) {
  if (!product) return false;
  if (product.tableEnabled !== undefined) return Boolean(product.tableEnabled);
  if (product.table_enabled !== undefined) return Boolean(product.table_enabled);
  return true;
}

export function isProductOnlineEnabled(product) {
  if (!product) return false;
  if (product.onlineEnabled !== undefined) return Boolean(product.onlineEnabled);
  if (product.online_enabled !== undefined) return Boolean(product.online_enabled);
  return true;
}

export function getProductImage(product) {
  return product?.image || product?.imageUrl || product?.img || FALLBACK_PRODUCT_IMAGE;
}

export function handleImageFallback(e) {
  const el = e?.currentTarget;
  if (el && el.src !== FALLBACK_PRODUCT_IMAGE) {
    el.src = FALLBACK_PRODUCT_IMAGE;
  }
}

/** Normalize backend `category` (id string) vs legacy `categoryId`/`categoryName`. */
export function getProductCategoryId(product) {
  if (!product) return '';
  if (typeof product.category === 'string') return product.category;
  if (product.category?.id) return product.category.id;
  return product.categoryId || product.categoryName || '';
}

/** Parse guest counts like "2 Persons" / "3-4 Persons" / 2 -> leading int. */
export function parseGuestsCount(value, fallback = 2) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(1, Math.floor(value));
  const m = String(value ?? '').match(/\d+/);
  return m ? Math.max(1, parseInt(m[0], 10)) : fallback;
}

export function isValidIndianPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10;
}

export function getProductRating(product) {
  if (!product) return { rating: '4.2', count: 120 };
  if (product.rating) {
    return {
      rating: Number(product.rating).toFixed(1),
      count: product.ratingCount || product.reviewsCount || 120
    };
  }
  const str = String(product.id || product.name || 'item');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  // Realistic ratings between 3.8 and 4.9
  const rating = (3.8 + (absHash % 12) / 10).toFixed(1);
  // Realistic rating counts between 35 and 450
  const count = 35 + (absHash % 415);
  return { rating, count };
}

export function getProductPricingInfo(product, mode = 'online') {
  const sellingPrice = getProductPrice(product, mode);
  let originalPrice = product?.originalPrice || product?.mrp || product?.strikePrice;
  
  if (!originalPrice && sellingPrice > 0) {
    // Generate a realistic MRP with ~25% to 50% discount
    const str = String(product?.id || product?.name || 'item');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const markupPct = 25 + (Math.abs(hash) % 35); // 25% to 60% higher
    const rawMrp = Math.round(sellingPrice * (1 + markupPct / 100));
    // Round to clean 5/9 ending or 10s
    originalPrice = rawMrp > 50 ? Math.ceil(rawMrp / 10) * 10 - 1 : rawMrp + 10;
    if (originalPrice <= sellingPrice) originalPrice = sellingPrice + 20;
  }
  
  originalPrice = Number(originalPrice || sellingPrice);
  const discountPercent = product?.discountPercent 
    || (originalPrice > sellingPrice ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0);

  return {
    sellingPrice,
    originalPrice,
    discountPercent
  };
}
