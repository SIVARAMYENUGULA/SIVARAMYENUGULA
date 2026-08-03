import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { User, UserRole } from '@/types'
import env from '@/config/env'
import apiClient from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const resolveAvatarUrl = (avatar: string | undefined, name: string): string => {
  if (!avatar) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name?.toLowerCase().replace(/\s/g, '')}`
  }
  // If it's already an absolute URL, use it as-is
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  // If it's a relative path starting with /uploads, prepend the API base URL
  if (avatar.startsWith('/uploads')) {
    const baseUrl = env.apiUrl.replace('/api', '')
    return `${baseUrl}${avatar}`
  }
  return avatar
}

const mapBackendUser = (data: any): User => ({
  id: data._id || data.id,
  name: data.name,
  email: data.email,
  role: data.role,
  avatar: resolveAvatarUrl(data.avatar, data.name),
  joinedAt: data.createdAt || data.joinedAt || new Date().toISOString(),
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // On mount, try to restore session from stored tokens
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(env.tokenKey)
      if (!token) {
        setState({ user: null, isAuthenticated: false, isLoading: false })
        return
      }
      try {
        const res = await apiClient.get('/auth/profile')
        const user = mapBackendUser(res.data.data.user)
        localStorage.setItem(env.userKey, JSON.stringify(user))
        setState({ user, isAuthenticated: true, isLoading: false })
      } catch {
        // Token invalid or expired — clear storage
        localStorage.removeItem(env.tokenKey)
        localStorage.removeItem(env.refreshTokenKey)
        localStorage.removeItem(env.userKey)
        setState({ user: null, isAuthenticated: false, isLoading: false })
      }
    }
    restoreSession()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const res = await apiClient.post('/auth/login', { email, password })
      const { user: backendUser, token, refreshToken } = res.data.data
      const user = mapBackendUser(backendUser)
      localStorage.setItem(env.tokenKey, token)
      localStorage.setItem(env.refreshTokenKey, refreshToken)
      localStorage.setItem(env.userKey, JSON.stringify(user))
      setState({ user, isAuthenticated: true, isLoading: false })
      return user
    } catch (error: any) {
      localStorage.removeItem(env.tokenKey)
      localStorage.removeItem(env.refreshTokenKey)
      localStorage.removeItem(env.userKey)
      setState(prev => ({ ...prev, isLoading: false }))
      // Normalize error to always have a user-friendly message
      if (error?.response?.data?.error?.message) {
        // Backend returned a structured error - pass as-is
        throw error
      } else if (error?.code === 'ERR_NETWORK' || !error?.response) {
        // Network error (server down, CORS, etc.)
        const networkErr = new Error('network_error')
        ;(networkErr as any).isNetworkError = true
        ;(networkErr as any).originalError = error
        throw networkErr
      } else {
        throw error
      }
    }
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string, role: UserRole) => {
    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const res = await apiClient.post('/auth/signup', { name, email, password, role })
      const { token, refreshToken } = res.data.data
      localStorage.setItem(env.tokenKey, token)
      localStorage.setItem(env.refreshTokenKey, refreshToken)
      // Don't set user yet — wait for email verification
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem(env.tokenKey)
    localStorage.removeItem(env.refreshTokenKey)
    localStorage.removeItem(env.userKey)
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }, [])

  const updateUser = useCallback((user: User) => {
    localStorage.setItem(env.userKey, JSON.stringify(user))
    setState({ user, isAuthenticated: true, isLoading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export { AuthContext }
export default AuthContext
