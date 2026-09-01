import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || '0.0.0.0',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cafe.db'),
  STATIC_DIR: path.join(__dirname, '..', '..', 'frontend', 'dist'),
  API_PREFIX: '/api'
};
