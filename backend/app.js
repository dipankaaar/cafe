import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { ENV } from './config/env.js';
import apiRouter from './routes/index.js';
import { requestLogger } from './middlewares/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

const app = express();

// Security & Parsing Middlewares
app.use(cors({ origin: ENV.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
app.use(requestLogger);

// Mount API Root
app.use(ENV.API_PREFIX, apiRouter);

// Serve Frontend Static Assets (Production SPA Fallback)
app.use(express.static(ENV.STATIC_DIR));

// Fallback to client-side index.html for React SPA
app.use((req, res, next) => {
  if (req.url.startsWith(ENV.API_PREFIX)) return next();
  res.sendFile(path.join(ENV.STATIC_DIR, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('☕ Dinenos Cafe Fullstack API Server is online. Start Vite client on port 5173 for UI.');
    }
  });
});

// 404 & Global Error Handling Pipeline
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
