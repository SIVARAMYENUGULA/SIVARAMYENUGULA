import { Navigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallbackPath?: string
}

export function RoleGuard({ allowedRoles, children, fallbackPath = '/' }: RoleGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
