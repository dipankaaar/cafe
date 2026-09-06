/**
 * General Utilities & Data Formatting Helpers
 */

// SQLite parameter sanitizer (prevents undefined from throwing)
export function sanitize(val, fallback = null) {
  return val === undefined ? fallback : val;
}

// Generate human-friendly sequential or random order IDs (canonical DN-XXXX format)
export function generateOrderNumber(prefix = 'DN') {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${rand}`;
}

// Safe JSON parser with fallback
export function parseJSON(str, fallback = []) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

// Round to 2 decimal places for financial calculations
export function roundCurrency(amount) {
  return Number((Math.round(amount * 100) / 100).toFixed(2));
}

// ISO Date string
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

// --- Shared validation helpers (Customers / Loyalty / Coupons / Reservations / Tables) ---

// Normalize Indian phone: strip +91, spaces, dashes, brackets. Returns 10-digit string or ''.
export function normalizeIndianPhone(phone) {
  if (phone === undefined || phone === null) return '';
  let s = String(phone).trim().replace(/[\s\-()]/g, '');
  if (s.startsWith('+91')) s = s.slice(3);
  else if (s.startsWith('91') && s.length === 12) s = s.slice(2);
  else if (s.startsWith('0') && s.length === 11) s = s.slice(1);
  return s;
}

// 10-digit India mobile: must start with 6-9
export function isValidIndianPhone(phone) {
  const n = normalizeIndianPhone(phone);
  return /^[6-9]\d{9}$/.test(n);
}

export function isValidEmail(email) {
  if (!email) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

// YYYY-MM-DD format check (calendar-valid, timezone-safe)
export function isValidDateString(str) {
  if (!str || typeof str !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

// True if date string is before today (local date compare on YYYY-MM-DD strings)
export function isPastDateString(str) {
  if (!isValidDateString(str)) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return str < todayStr;
}

// HH:MM (24h) -> minutes since midnight, NaN if invalid
export function timeToMinutes(t) {
  if (!t || typeof t !== 'string') return NaN;
  const m = t.match(/^([01]?\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/);
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function isValidTimeString(t) {
  return !isNaN(timeToMinutes(t));
}

// Tier from lifetime spend (single source of truth)
export function tierForSpend(totalSpent) {
  const s = Number(totalSpent || 0);
  if (s >= 10000) return 'Platinum';
  if (s >= 5000) return 'Gold';
  if (s >= 2500) return 'Silver';
  return 'Bronze';
}

// Points earn rule: 1 pt per Rs100 of grand total
export function pointsForAmount(grandTotal, ratePerHundred = 1) {
  const total = Number(grandTotal || 0);
  if (total <= 0) return 0;
  return Math.floor(total / 100) * Number(ratePerHundred || 1);
}
