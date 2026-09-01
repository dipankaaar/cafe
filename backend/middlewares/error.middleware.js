import { ApiError } from '../utils/ApiError.js';
import { ENV } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors?.length > 0 && { errors: error.errors }),
    ...(ENV.NODE_ENV === 'development' && { stack: error.stack })
  };

  console.error(`🚨 [API Error] ${req.method} ${req.originalUrl}:`, error.message);

  return res.status(error.statusCode).json(response);
}

export function notFoundHandler(req, res, next) {
  if (req.originalUrl.startsWith(ENV.API_PREFIX)) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: `API endpoint ${req.method} ${req.originalUrl} not found`
    });
  }
  next();
}
