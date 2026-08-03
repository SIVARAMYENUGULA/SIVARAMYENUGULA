const env = require('./env');

const corsOptions = {
  origin(origin, callback) {
    // In development, allow any origin (including requests without Origin header)
    if (env.isDev) {
      return callback(null, true);
    }
    // In production/staging, check against the whitelist
    if (!origin || env.corsOrigin.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
module.exports = corsOptions;