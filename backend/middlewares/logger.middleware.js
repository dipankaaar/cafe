export function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const logColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    
    // Only log API requests or non-static
    if (req.originalUrl.startsWith('/api')) {
      console.log(
        `[HTTP] ${req.method} ${req.originalUrl} ${logColor}${status}${reset} - ${duration}ms`
      );
    }
  });

  next();
}
