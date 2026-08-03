const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string || '/api'),
  appName: (import.meta.env.VITE_APP_NAME as string) ?? 'PlaceMux',
  appEnv: (import.meta.env.VITE_APP_ENV as string) ?? 'development',
  enableMockDelay: import.meta.env.VITE_ENABLE_MOCK_DELAY === 'true',
  mockDelayMs: Number(import.meta.env.VITE_MOCK_DELAY_MS) || 600,
  tokenKey: 'placemux_token',
  refreshTokenKey: 'placemux_refresh_token',
  userKey: 'placemux_user',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const

export default env
