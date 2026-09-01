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
  NEW: 'New',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded'
};

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
