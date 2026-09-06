export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

export const ORDER_STATUS = {
  PLACED: 'placed',
  ACCEPTED: 'accepted',
  BREWING: 'brewing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Terminal states — order leaves the active queue
export const ACTIVE_ORDER_STATUSES = ['placed', 'accepted', 'brewing', 'ready'];

// Canonical KDS workflow: placed -> accepted -> brewing -> ready -> completed
export const ORDER_STATUS_FLOW = ['placed', 'accepted', 'brewing', 'ready', 'completed'];

// Legacy (pre-standardization) capitalized values still found in older DB rows / caches
const LEGACY_STATUS_MAP = {
  new: 'placed',
  placed: 'placed',
  accepted: 'accepted',
  preparing: 'brewing',
  brewing: 'brewing',
  ready: 'ready',
  completed: 'completed',
  cancelled: 'cancelled',
  refunded: 'refunded'
};

/**
 * Normalize any incoming/legacy status string to the canonical lowercase enum.
 * Returns null for unknown values so callers can reject them.
 */
export function normalizeOrderStatus(status) {
  if (status === undefined || status === null) return null;
  const key = String(status).trim().toLowerCase();
  return LEGACY_STATUS_MAP[key] || null;
}

export function isValidOrderStatus(status) {
  return normalizeOrderStatus(status) !== null;
}

// Allowed forward transitions (cancelled/refunded reachable from any non-terminal state)
const STATUS_TRANSITIONS = {
  placed: ['accepted', 'brewing', 'cancelled'],
  accepted: ['brewing', 'ready', 'cancelled'],
  brewing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: ['refunded'],
  cancelled: [],
  refunded: []
};

export function isValidStatusTransition(from, to) {
  const normFrom = normalizeOrderStatus(from);
  const normTo = normalizeOrderStatus(to);
  if (!normFrom || !normTo) return false;
  if (normFrom === normTo) return true; // idempotent retry
  return (STATUS_TRANSITIONS[normFrom] || []).includes(normTo);
}

export const ORDER_TYPE = {
  DINE_IN: 'dine-in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery'
};

export const TABLE_STATUS = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  CLEANING: 'Cleaning'
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  KITCHEN: 'Kitchen Staff',
  WAITER: 'Waiter'
};

export const INVENTORY_STATUS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock'
};
