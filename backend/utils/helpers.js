/**
 * General Utilities & Data Formatting Helpers
 */

// SQLite parameter sanitizer (prevents undefined from throwing)
export function sanitize(val, fallback = null) {
  return val === undefined ? fallback : val;
}

// Generate human-friendly sequential or random order IDs
export function generateOrderNumber(prefix = 'DIN') {
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
