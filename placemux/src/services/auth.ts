import type { User, UserRole } from '@/types'
import apiClient from '@/lib/api'

// Backend response wrapper
interface ApiResponse<T> {
  success: boolean
  data: T
}

interface LoginData {
  user: User
  token: string
  refreshToken: string
}

interface SignupData {
  user: User
  token: string
  refreshToken: string
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginData> => {
    const res = await apiClient.post<ApiResponse<LoginData>>('/auth/login', { email, password })
    return res.data.data
  },
  signup: async (name: string, email: string, password: string, role: UserRole): Promise<SignupData> => {
    const res = await apiClient.post<ApiResponse<SignupData>>('/auth/signup', { name, email, password, role })
    return res.data.data
  },
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
  refreshToken: async (refreshToken: string): Promise<{ token: string; refreshToken: string }> => {
    const res = await apiClient.post<ApiResponse<{ token: string; refreshToken: string }>>('/auth/refresh', { refreshToken })
    return res.data.data
  },
}
