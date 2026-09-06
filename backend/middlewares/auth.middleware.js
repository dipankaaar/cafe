import { ApiError } from '../utils/ApiError.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Access Control Matrix (single source of truth)
 * - PUBLIC: no role header required, never blocked
 * - ADMIN: any active staff role (Admin, Manager, Cashier, Kitchen Staff, Waiter)
 *   with per-module RBAC enforced on the frontend via ROLE_PERMISSIONS.
 */
export const PUBLIC_ROUTES = [
  'GET /api/health',
  'GET /api/menu/products',
  'GET /api/menu/products/:id',
  'GET /api/menu/categories',
  'GET /api/menu/addons',
  'GET /api/tables/qr/validate/:token',
  'GET /api/orders/track/:orderNumber',
  'POST /api/orders',            // public storefront / QR self-ordering
  'GET /api/orders/track/:orderNumber',
  'POST /api/reservations',      // public table booking
  'GET /api/settings',           // storefront footer / branding (read-only)
  'GET /api/events',             // SSE stream (read-only live feed)
  'POST /api/coupons/validate',  // checkout coupon check
  'POST /api/auth/login',        // staff login
  'POST /api/auth/login-pin'     // staff PIN login
];

export const ADMIN_ROUTES = [
  'ALL /api/auth/staff*',
  'POST|PUT|DELETE /api/menu/*',
  'PATCH /api/orders/:id/status',
  'ALL /api/tables (except qr/validate)',
  'ALL /api/inventory/*',
  'ALL /api/expenses/*',
  'ALL /api/reports/*',
  'GET|PATCH|POST /api/notifications* (read + mark-read; POST create is internal/system)',
  'GET /api/audit-logs',
  'PUT /api/settings'
];

/**
 * Role-Based Access Control (RBAC) Middleware
 * IMPORTANT: never blocks public routes. If no x-user-role header is sent,
 * the request is treated as a public/storefront guest (role = 'Guest')
 * instead of throwing — admin-only routes opt in via allowedRoles.
 * @param  {...string} allowedRoles Roles permitted to access the route
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    // Public routes (no allowedRoles specified) always pass through.
    if (allowedRoles.length === 0) {
      req.userRole = req.headers['x-user-role'] || 'Guest';
      return next();
    }

    const roleHeader = req.headers['x-user-role'] || 'Guest';

    if (!allowedRoles.includes(roleHeader)) {
      throw new ApiError(403, `Access denied: Role "${roleHeader}" is not authorized for this resource.`);
    }

    req.userRole = roleHeader;
    next();
  };
}

/**
 * Optional auth: attaches role if present, never rejects.
 * Safe to mount globally in front of public routes
 * (/order/:qrToken page, /api/tables/qr/:token, /api/menu/products).
 */
export function optionalAuth(req, res, next) {
  req.userRole = req.headers['x-user-role'] || 'Guest';
  req.userName = req.headers['x-user-name'] || 'Guest';
  next();
}
