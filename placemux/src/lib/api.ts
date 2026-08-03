import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import env from '@/config/env'

// Retry configuration for transient network errors
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000
const isNetworkError = (error: AxiosError): boolean => {
  return !error.response && !!error.code && error.code !== 'ERR_CANCELED'
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(env.tokenKey)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: number }

    // === RETRY LOGIC: Retry on transient network errors (no response from server) ===
    if (isNetworkError(error) && (originalRequest._retry ?? 0) < MAX_RETRIES) {
      originalRequest._retry = (originalRequest._retry ?? 0) + 1
      console.warn(`[API] Network error, retrying (${originalRequest._retry}/${MAX_RETRIES})...`)
      await delay(RETRY_DELAY_MS)
      return apiClient(originalRequest)
    }

    // === 401 HANDLING: Try to refresh the token ===
    if (error.response?.status === 401) {
      const retryCount = (originalRequest._retry ?? 0)
      if (retryCount === 0) {
        originalRequest._retry = 1
        const refreshToken = localStorage.getItem(env.refreshTokenKey)
        if (refreshToken) {
          try {
            const res = await axios.post(`${env.apiUrl}/auth/refresh`, {
              refreshToken,
            })
            const { token, refreshToken: newRefresh } = res.data
            localStorage.setItem(env.tokenKey, token)
            localStorage.setItem(env.refreshTokenKey, newRefresh)
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          } catch {
            localStorage.removeItem(env.tokenKey)
            localStorage.removeItem(env.refreshTokenKey)
            localStorage.removeItem(env.userKey)
            window.location.href = '/login'
          }
        } else {
          localStorage.removeItem(env.tokenKey)
          localStorage.removeItem(env.userKey)
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
