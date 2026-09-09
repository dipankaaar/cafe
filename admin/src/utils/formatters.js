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

export const FALLBACK_PRODUCT_IMAGE =
  'https://reactheme.com/products/wordpress/dinenos/wp-content/uploads/2023/03/latte.jpg';

export function getProductPrice(product) {
  return Number(product?.sellingPrice ?? product?.price ?? product?.unitPrice ?? 0);
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

export function formatRelativeTime(dateString) {
  if (!dateString) return 'Just now';
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(dateString);
  } catch (e) {
    return dateString;
  }
}
