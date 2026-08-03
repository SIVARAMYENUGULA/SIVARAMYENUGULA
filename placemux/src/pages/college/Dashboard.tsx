import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/shared/metric-card'
import { collegeService } from '@/services/college'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Users, GraduationCap, Building2, Briefcase, Calendar, DollarSign, Rocket } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function CollegeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await collegeService.getDashboard()
        setStats(data)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load dashboard')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  const metrics = useMemo(() => [
    { label: 'Total Students', value: stats?.totalStudents || 0, change: 0, trend: 'neutral' as const },
    { label: 'Students Placed', value: stats?.placedCount || 0, change: 0, trend: 'neutral' as const },
    { label: 'Placement Rate', value: (stats?.placementRate || 0) + '%', change: 0, trend: 'neutral' as const },
    { label: 'Avg Package', value: stats?.averagePackage ? '₹' + (stats.averagePackage / 100000).toFixed(1) + 'L' : 'N/A', change: 0, trend: 'neutral' as const },
  ], [stats])

  const quickActions = [
    { label: 'View Analytics', icon: TrendingUp, href: '/college/analytics', color: 'text-blue-400' },
    { label: 'Manage Students', icon: Users, href: '/college/students', color: 'text-green-400' },
    { label: 'Create Drive', icon: Rocket, href: '/college/drives', color: 'text-purple-400' },
    { label: 'View Reports', icon: GraduationCap, href: '/college/reports', color: 'text-orange-400' },
    { label: 'Manage Companies', icon: Building2, href: '/college/companies', color: 'text-pink-400' },
  ]

  if (pageLoading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  return (
    <main className="space-y-8" aria-label="College dashboard">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">College Dashboard</h1><p className="text-muted-foreground mt-1">{user?.name || 'College'} &middot; Placement Overview</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="success" className="px-3 py-1.5"><TrendingUp className="h-3.5 w-3.5 mr-1" /> {stats?.placementRate || 0}% Placed</Badge>
          <Badge variant="info" className="px-3 py-1.5"><Rocket className="h-3.5 w-3.5 mr-1" /> {stats?.activeDrives || 0} Active Drives</Badge>
        </div>
      </div>

      <section aria-label="Key metrics">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => <MetricCard key={m.label} {...m} delay={i * 0.1} />)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle id="placement-stats-title">Placement Statistics</CardTitle></CardHeader>
          <CardContent aria-labelledby="placement-stats-title" className="space-y-6">
            {[
              { label: 'Total Students', value: (stats?.totalStudents || 0).toLocaleString(), icon: Users },
              { label: 'Students Placed', value: (stats?.placedCount || 0).toLocaleString(), icon: TrendingUp },
              { label: 'Placement Rate', value: (stats?.placementRate || 0) + '%', icon: TrendingUp },
              { label: 'Average Package', value: stats?.averagePackage ? '₹' + (stats.averagePackage / 100000).toFixed(1) + ' LPA' : 'N/A', icon: DollarSign },
              { label: 'Total Applications', value: (stats?.totalApplications || 0).toLocaleString(), icon: Briefcase },
              { label: 'Upcoming Interviews', value: (stats?.upcomingInterviews || 0).toString(), icon: Calendar },
              { label: 'Active Drives', value: (stats?.activeDrives || 0).toString(), icon: Rocket },
              { label: 'Total Drives', value: (stats?.totalDrives || 0).toString(), icon: Briefcase },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between border-b border-border/20 pb-3 last:border-0 hover:bg-muted/10 transition-colors rounded-lg p-2 -mx-2">
                <div className="flex items-center gap-2"><s.icon className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-medium">{s.label}</p></div>
                <span className="text-lg font-bold">{s.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle id="quick-actions-title">Quick Actions</CardTitle></CardHeader>
          <CardContent aria-labelledby="quick-actions-title" className="space-y-3">
            {quickActions.map((action) => (
              <Button key={action.label} variant="outline" className="w-full justify-start group" onClick={() => navigate(action.href)}>
                <action.icon className={`h-4 w-4 mr-2 shrink-0 ${action.color}`} />{action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
