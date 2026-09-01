import { ApiError } from '../utils/ApiError.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} allowedRoles Roles permitted to access the route
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    const roleHeader = req.headers['x-user-role'] || USER_ROLES.ADMIN;

    if (allowedRoles.length > 0 && !allowedRoles.includes(roleHeader)) {
      throw new ApiError(403, `Access denied: Role "${roleHeader}" is not authorized for this resource.`);
    }

    req.userRole = roleHeader;
    next();
  };
}
