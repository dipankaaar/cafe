/**
 * Uniform Standard JSON Response Formatter
 *
 * Envelope: { success, statusCode, message, data }
 * NOTE: Frontend api.js `request()` must unwrap `payload.data` when
 * `payload.success === true && 'data' in payload` for backward compat
 * with endpoints that previously returned raw arrays/objects.
 */
export class ApiResponse {
  constructor(statusCode = 200, data = null, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data: data === undefined ? null : data
    });
  }

  static created(res, data = null, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      statusCode: 201,
      message,
      data: data === undefined ? null : data
    });
  }

  static error(res, message = 'Error', statusCode = 400, errors = []) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors
    });
  }
}
