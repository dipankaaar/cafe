import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

// Required for correct req.ip / rate-limiting behind reverse proxies
app.set('trust proxy', 1);

// --- Minimal helmet-equivalent security headers (zero extra deps) ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  // HSTS only makes sense over HTTPS; harmless on http (browsers ignore)
  if (ENV.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  // Allow private-network preflights (Chrome PNA) for LAN POS devices
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  next();
});

// --- CORS: '*' wildcard MUST NOT combine with credentials:true ---
const corsOptions =
  ENV.CORS_ORIGIN === '*'
    ? { origin: '*', credentials: false }
    : {
        origin(origin, callback) {
          // Allow non-browser clients (curl, EventSource without Origin, health checks)
          if (!origin) return callback(null, true);
          const normalized = origin.replace(/\/$/, '');
          if (
            ENV.CORS_ORIGIN.includes(normalized) ||
            /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized) ||
            /\.vercel\.app$/.test(normalized) ||
            /\.railway\.app$/.test(normalized) ||
            /\.trycloudflare\.com$/.test(normalized)
          ) {
            return callback(null, true);
          }
          return callback(null, false);
        },
        credentials: true
      };
app.use(cors(corsOptions));

// --- Lightweight in-memory sliding-window rate limiter (zero extra deps) ---
const rateBuckets = new Map();
function apiRateLimiter(req, res, next) {
  // Never throttle health checks or the SSE stream itself
  if (req.path === '/health' || req.path === '/events') return next();
  const now = Date.now();
  const key = req.ip || 'unknown';
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.windowStart > ENV.RATE_LIMIT_WINDOW_MS) {
    bucket = { windowStart: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > ENV.RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((ENV.RATE_LIMIT_WINDOW_MS - (now - bucket.windowStart)) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    return next(new ApiError(429, 'Too many requests. Please slow down and retry.'));
  }
  // Opportunistic cleanup to bound memory
  if (rateBuckets.size > 10000) {
    for (const [k, b] of rateBuckets) {
      if (now - b.windowStart > ENV.RATE_LIMIT_WINDOW_MS) rateBuckets.delete(k);
    }
  }
  next();
}

// --- Body parsing with strict limits ---
app.use(express.json({ limit: '1mb', strict: true }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- JSON syntax validation → consistent 400 (must sit right after parsers) ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return next(new ApiError(400, 'Invalid JSON payload. Check request body syntax.'));
  }
  if (err && err.type === 'entity.too.large') {
    return next(new ApiError(413, 'Request payload too large.'));
  }
  return next(err);
});

// --- API rate limiting ---
app.use(ENV.API_PREFIX, apiRateLimiter);

// Request Logging
app.use(requestLogger);

// Mount API Root
app.use(ENV.API_PREFIX, apiRouter);

// Serve Admin Panel Static Assets (Production SPA)
app.use('/admin', express.static(ENV.ADMIN_STATIC_DIR));
// Express 5 (path-to-regexp v8) rejects '/admin*' — regex keeps it version-agnostic
app.get(/^\/admin(\/.*)?$/, (req, res, next) => {
  res.sendFile(path.join(ENV.ADMIN_STATIC_DIR, 'index.html'), (err) => {
    if (err) return next();
  });
});

// Serve Frontend Static Assets (Production SPA Fallback)
app.use(express.static(ENV.STATIC_DIR));

// Fallback to client-side index.html for React SPA
app.use((req, res, next) => {
  if (req.originalUrl.startsWith(ENV.API_PREFIX)) return next();
  res.sendFile(path.join(ENV.STATIC_DIR, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('☕ Petuk Adda Cafe Fullstack API Server is online. Start Vite client on port 5173 for UI.');
    }
  });
});

// 404 & Global Error Handling Pipeline
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
