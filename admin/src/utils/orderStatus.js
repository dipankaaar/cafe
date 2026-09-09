/**
 * Canonical Order Status Enum — shared by POS, KDS and Orders modules.
 *
 * Canonical (lowercase): placed, accepted, brewing, ready, out_for_delivery, delivered, completed, cancelled, refunded
 * Legacy aliases (old DB rows / caches): New->placed, Preparing->brewing (capitalized variants too)
 * Delivery leg (delivery orders only): ready -> out_for_delivery -> delivered
 */

export const ORDER_STATUSES = [
  'placed',
  'accepted',
  'brewing',
  'ready',
  'out_for_delivery',
  'delivered',
  'completed',
  'cancelled',
  'refunded'
];

export const ACTIVE_ORDER_STATUSES = ['placed', 'accepted', 'brewing', 'ready', 'out_for_delivery'];

// KDS forward workflow: placed -> accepted -> brewing -> ready -> completed
// Delivery leg: ready -> out_for_delivery -> delivered
export const ORDER_STATUS_FLOW = ['placed', 'accepted', 'brewing', 'ready', 'completed'];
export const DELIVERY_STATUS_FLOW = ['placed', 'accepted', 'brewing', 'ready', 'out_for_delivery', 'delivered'];

const LEGACY_STATUS_MAP = {
  new: 'placed',
  placed: 'placed',
  accepted: 'accepted',
  preparing: 'brewing',
  brewing: 'brewing',
  ready: 'ready',
  out_for_delivery: 'out_for_delivery',
  outfordelivery: 'out_for_delivery',
  'out for delivery': 'out_for_delivery',
  delivered: 'delivered',
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
  if (s === 'out_for_delivery') return 'Out for Delivery';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Badge variant mapping for the shared <Badge> component
export function getStatusBadgeVariant(status) {
  switch (normalizeOrderStatus(status)) {
    case 'completed':
    case 'delivered':
      return 'success';
    case 'ready':
    case 'out_for_delivery':
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
// Delivery orders continue past ready via the delivery leg.
export function getNextStatusAction(status, orderType = '') {
  const s = normalizeOrderStatus(status);
  const isDelivery = String(orderType || '').toLowerCase() === 'delivery';
  switch (s) {
    case 'placed':
      return { action: 'accepted', label: 'Accept Order' };
    case 'accepted':
      return { action: 'brewing', label: 'Start Brewing' };
    case 'brewing':
      return { action: 'ready', label: 'Mark Ready to Serve' };
    case 'ready':
      return isDelivery
        ? { action: 'out_for_delivery', label: 'Dispatch for Delivery' }
        : { action: 'completed', label: 'Complete & Clear' };
    case 'out_for_delivery':
      return { action: 'delivered', label: 'Mark Delivered (OTP)' };
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
// Delivery orders extend the flow with out_for_delivery -> delivered.
export function buildStatusTimeline(order) {
  if (!order) return [];
  const status = normalizeOrderStatus(order.status);
  const cancelled = status === 'cancelled';
  const refunded = status === 'refunded';
  const isDelivery = String(order.orderType || '').toLowerCase() === 'delivery';

  const steps = [
    { key: 'placed', label: 'Placed', time: order.orderTime },
    { key: 'accepted', label: 'Accepted', time: order.kitchenAcceptedAt },
    { key: 'brewing', label: 'Brewing', time: order.brewingStartedAt || null },
    { key: 'ready', label: 'Ready', time: order.kitchenReadyAt },
    ...(isDelivery
      ? [
          { key: 'out_for_delivery', label: 'Out for Delivery', time: order.outForDeliveryAt },
          { key: 'delivered', label: 'Delivered', time: order.deliveredAt || order.completedAt }
        ]
      : [{ key: 'completed', label: 'Completed', time: order.completedAt }])
  ];

  // Brewing timestamp fallback: use accepted time when brewing started but not tracked separately
  const flow = isDelivery ? DELIVERY_STATUS_FLOW : ORDER_STATUS_FLOW;
  const flowIdx = flow.indexOf(status);
  return steps.map((step, idx) => ({
    ...step,
    done: cancelled || refunded ? idx === 0 : flowIdx >= idx && Boolean(idx === 0 ? true : step.time || flowIdx > idx),
    current: !cancelled && !refunded && flowIdx === idx
  }));
}

export function generateOrderNumber(prefix = 'DN') {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}
