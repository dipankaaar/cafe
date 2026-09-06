import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawCorsOrigin = process.env.CORS_ORIGIN || '*';

// Normalize: '*' stays wildcard (credentials MUST be false then);
// otherwise parse comma-separated allowlist for origin reflection.
function parseCorsOrigin(raw) {
  if (!raw || raw.trim() === '' || raw.trim() === '*') return '*';
  return raw.split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
}

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  HOST: process.env.HOST || '0.0.0.0',
  CORS_ORIGIN: parseCorsOrigin(rawCorsOrigin),
  CORS_ORIGIN_RAW: rawCorsOrigin,
  DB_PATH: process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cafe.db'),
  STATIC_DIR: path.join(__dirname, '..', '..', 'frontend', 'dist'),
  API_PREFIX: '/api',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 500,
  // Auth: required once JWT issuance/verification is enabled (login is currently
  // staff-email lookup only — no password/JWT check; see auth.controller.js TODO).
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-change-me',
  // Tax & charges: canonical server-side rates (settings.taxRate is the display copy;
  // services fall back to these when settings rows are missing).
  TAX_RATE: Number(process.env.TAX_RATE || 5.0),
  SERVICE_CHARGE_RATE: Number(process.env.SERVICE_CHARGE_RATE || 0.0)
};
