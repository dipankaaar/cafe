/**
 * Async handler to wrap async Express controllers and forward unhandled exceptions to next()
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
