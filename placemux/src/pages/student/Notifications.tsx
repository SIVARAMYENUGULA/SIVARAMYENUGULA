import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { Bell, CheckCheck, ArrowLeft, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotificationItem {
  _id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}

export function StudentNotifications() {
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [markingAll, setMarkingAll] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications')
      const data = res.data?.data
      setNotifications(data?.notifications || [])
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch {
      addToast({ title: 'Error', description: 'Failed to mark as read', variant: 'error' })
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await apiClient.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      addToast({ title: 'All Marked Read', description: 'All notifications marked as read', variant: 'success' })
    } catch {
      addToast({ title: 'Error', description: 'Failed to mark all as read', variant: 'error' })
    } finally {
      setMarkingAll(false)
    }
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-success" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />
      default: return <Info className="h-4 w-4 text-info" />
    }
  }

  if (loading) return <PageTransition><TableSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={() => fetchNotifications()} /></PageTransition>

  const typeBadge = (t: string) => {
    const map: Record<string, 'info' | 'success' | 'warning' | 'destructive'> = {
      info: 'info', success: 'success', warning: 'warning', error: 'destructive',
    }
    return <Badge variant={map[t] || 'info'} className="text-[10px]">{t}</Badge>
  }

  return (
    <main className="space-y-6" aria-label="Notifications">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markingAll} className="gap-2">
            <CheckCheck className="h-4 w-4" />
            {markingAll ? 'Marking...' : 'Mark All as Read'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5 text-primary" />
            All Notifications
            {unreadCount > 0 && (
              <Badge variant="default" className="ml-2 text-[10px]">{unreadCount} new</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" description="You have no notifications at this time" />
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/10',
                    !n.isRead ? 'border-primary/20 bg-primary/[0.02]' : 'border-transparent'
                  )}
                  onClick={() => !n.isRead && handleMarkRead(n._id)}
                >
                  <div className={cn(
                    'flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center',
                    !n.isRead ? 'bg-primary/10' : 'bg-muted/20'
                  )}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</p>
                        {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {typeBadge(n.type)}
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!n.isRead && (
                    <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {notifications.length > 0 && (
        <div className="text-center text-xs text-muted-foreground">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''} total
        </div>
      )}
    </main>
  )
}
