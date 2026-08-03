require('dotenv').config();
const crypto = require('crypto');

/**
 * Parse CORS_ORIGIN env variable into an array of allowed origins.
 * Supports:
 *  - CORS_ORIGIN as comma-separated list: "http://a.com,http://b.com"
 *  - FRONTEND_URL as single URL (fallback when CORS_ORIGIN not set)
 *  - Defaults to localhost:5173 and localhost:5174 for development
 */
function parseCorsOrigins() {
  if (process.env.CORS_ORIGIN) {
    let raw = process.env.CORS_ORIGIN;
    // Strip any 'CORS_ORIGIN=' prefix that might be embedded in the env var value
    if (raw.startsWith('CORS_ORIGIN=')) {
      raw = raw.substring('CORS_ORIGIN='.length);
      console.warn('[CORS] Stripped embedded CORS_ORIGIN= prefix from env var');
    }
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (process.env.FRONTEND_URL) {
    return [process.env.FRONTEND_URL];
  }
  return ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
}

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/placemux',
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: parseCorsOrigins(),
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',
  turnServerUrl: process.env.TURN_SERVER_URL || '',
  turnUsername: process.env.TURN_USERNAME || '',
  turnCredential: process.env.TURN_CREDENTIAL || '',
  livekitUrl: process.env.LIVEKIT_URL || '',
  livekitKey: process.env.LIVEKIT_API_KEY || '',
  livekitSecret: process.env.LIVEKIT_API_SECRET || '',
  backendPublicUrl: (process.env.BACKEND_PUBLIC_URL || '').replace(/\/+$/, ''),
};

// Warn if using default secrets in production
if (env.isProd && (!env.jwtSecret || !env.jwtRefreshSecret)) {
  console.error('CRITICAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in production!');
  process.exit(1);
}

// Warn in development if using defaults
if (env.isDev && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.warn('WARNING: Using auto-generated JWT secrets for development. Sessions will NOT persist across restarts.');
  if (!process.env.JWT_SECRET) env.jwtSecret = crypto.randomBytes(64).toString('hex');
  if (!process.env.JWT_REFRESH_SECRET) env.jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
}
module.exports = env;