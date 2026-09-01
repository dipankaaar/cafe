/**
 * Uniform Standard JSON Response Formatter
 */
export class ApiResponse {
  constructor(statusCode = 200, data = null, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }

  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json(data);
  }

  static created(res, data, message = 'Resource created successfully') {
    return res.status(201).json(data);
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
