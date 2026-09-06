/**
 * Canonical Order Status Enum — shared by POS, KDS and Orders modules.
 *
 * Canonical (lowercase): placed, accepted, brewing, ready, completed, cancelled, refunded
 * Legacy aliases (old DB rows / caches): New->placed, Preparing->brewing (capitalized variants too)
 */

export const ORDER_STATUSES = [
  'placed',
  'accepted',
  'brewing',
  'ready',
  'completed',
  'cancelled',
  'refunded'
];

export const ACTIVE_ORDER_STATUSES = ['placed', 'accepted', 'brewing', 'ready'];

// KDS forward workflow: placed -> accepted -> brewing -> ready -> completed
export const ORDER_STATUS_FLOW = ['placed', 'accepted', 'brewing', 'ready', 'completed'];

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

export function normalizeOrderStatus(status) {
  if (status === undefined || status === null) return 'placed';
  const key = String(status).trim().toLowerCase();
  return LEGACY_STATUS_MAP[key] || 'placed';
}

export function isActiveOrder(orderOrStatus) {
  const s = typeof orderOrStatus === 'string' ? normalizeOrderStatus(orderOrStatus) : normalizeOrderStatus(orderOrStatus?.status);
  return ACTIVE_ORDER_STATUSES.includes(s);
}

export function getStatusLabel(status) {
  const s = normalizeOrderStatus(status);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Badge variant mapping for the shared <Badge> component
export function getStatusBadgeVariant(status) {
  switch (normalizeOrderStatus(status)) {
    case 'completed':
      return 'success';
    case 'ready':
      return 'primary';
    case 'brewing':
      return 'warning';
    case 'accepted':
      return 'info';
    case 'cancelled':
    case 'refunded':
      return 'error';
    case 'placed':
    default:
      return 'info';
  }
}

// Next KDS action for a given status: { action, label } or null when terminal
export function getNextStatusAction(status) {
  switch (normalizeOrderStatus(status)) {
    case 'placed':
      return { action: 'accepted', label: 'Accept Order' };
    case 'accepted':
      return { action: 'brewing', label: 'Start Brewing' };
    case 'brewing':
      return { action: 'ready', label: 'Mark Ready to Serve' };
    case 'ready':
      return { action: 'completed', label: 'Complete & Clear' };
    default:
      return null;
  }
}

export function getElapsedMinutes(orderTime, now = new Date()) {
  const diffMs = now - new Date(orderTime);
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
}

export function isOverdue(orderTime, thresholdMins = 15, now = new Date()) {
  return getElapsedMinutes(orderTime, now) >= thresholdMins;
}

// Build a status timeline for the Orders detail modal.
// Each step: { key, label, time, done, current }
export function buildStatusTimeline(order) {
  if (!order) return [];
  const status = normalizeOrderStatus(order.status);
  const cancelled = status === 'cancelled';
  const refunded = status === 'refunded';

  const steps = [
    { key: 'placed', label: 'Placed', time: order.orderTime },
    { key: 'accepted', label: 'Accepted', time: order.kitchenAcceptedAt },
    { key: 'brewing', label: 'Brewing', time: order.brewingStartedAt || null },
    { key: 'ready', label: 'Ready', time: order.kitchenReadyAt },
    { key: 'completed', label: 'Completed', time: order.completedAt }
  ];

  // Brewing timestamp fallback: use accepted time when brewing started but not tracked separately
  const flowIdx = ORDER_STATUS_FLOW.indexOf(status);
  return steps.map((step, idx) => ({
    ...step,
    done: cancelled || refunded ? idx === 0 : flowIdx >= idx && Boolean(idx === 0 ? true : step.time || flowIdx > idx),
    current: !cancelled && !refunded && flowIdx === idx
  }));
}

export function generateOrderNumber(prefix = 'DN') {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}
