import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from '@/components/shared/metric-card'
import { adminService } from '@/services/admin'
import { Users, Building2, GraduationCap, Activity, ArrowRight, Settings, Briefcase, BookOpen, FileText, LifeBuoy, BarChart3, TrendingUp, Zap, Calendar } from 'lucide-react'

import { useState, useEffect, useMemo } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { useNavigate } from 'react-router-dom'

export function AdminDashboard() {
  const navigate = useNavigate()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, analyticsData] = await Promise.all([
          adminService.getStats(),
          adminService.getAnalytics().catch(() => null),
        ])
        setStats(statsData)
        setAnalytics(analyticsData)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load dashboard')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  const metrics = useMemo(() => [
    { label: 'Total Users', value: stats?.totalUsers || 0, change: 0, trend: 'neutral' as const },
    { label: 'Students', value: stats?.totalStudents || 0, change: 0, trend: 'neutral' as const },
    { label: 'Companies', value: stats?.totalCompanies || 0, change: 0, trend: 'neutral' as const },
    { label: 'Colleges', value: stats?.totalColleges || 0, change: 0, trend: 'neutral' as const },
  ], [stats])

  if (pageLoading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const roleDist = analytics?.roleDistribution || []
  const statusDist = analytics?.statusDistribution || []
  const userGrowth = analytics?.userGrowth || []
  const appTrend = analytics?.appTrend || []

  const quickActions = [
    {label:'Manage Users',icon:Users,desc:'View and manage all platform users',onClick:() => navigate('/admin/users')},
    {label:'Manage Companies',icon:Building2,desc:'Verify company registrations',onClick:() => navigate('/admin/companies')},
    {label:'Manage Colleges',icon:GraduationCap,desc:'Manage college affiliations',onClick:() => navigate('/admin/colleges')},
    {label:'Audit Logs',icon:Activity,desc:'Review security and activity logs',onClick:() => navigate('/admin/audit')},
    {label:'Support Tickets',icon:LifeBuoy,desc:'Handle student support requests',onClick:() => navigate('/admin/support-tickets')},
    {label:'Settings',icon:Settings,desc:'Configure platform settings',onClick:() => navigate('/admin/settings')},
  ]

  return (
    <main className="space-y-8" aria-label="Admin dashboard">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="text-muted-foreground mt-1">Platform overview and system health</p></div>
        <div className="flex gap-2">
          <Badge variant="info" className="px-3 py-1.5"><Briefcase className="h-3.5 w-3.5 mr-1" /> {stats?.activeJobs || 0} Active Jobs</Badge>
          <Badge variant="warning" className="px-3 py-1.5"><LifeBuoy className="h-3.5 w-3.5 mr-1" /> {stats?.openTickets || 0} Open Tickets</Badge>
        </div>
      </div>

      <section aria-label="Key metrics">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => <MetricCard key={m.label} {...m} delay={i * 0.1} />)}
        </div>
      </section>

      <section aria-label="Platform metrics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 flex items-center gap-3"><Zap className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{stats?.totalDrives || 0}</p><p className="text-xs text-muted-foreground">Total Drives ({stats?.publishedDrives || 0} active)</p></div></CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3"><BookOpen className="h-8 w-8 text-info" /><div><p className="text-2xl font-bold">{stats?.totalAssessments || 0}</p><p className="text-xs text-muted-foreground">Assessments Created</p></div></CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3"><FileText className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{stats?.totalApplications || 0}</p><p className="text-xs text-muted-foreground">Total Applications</p></div></CardContent></Card>
          <Card><CardContent className="pt-6 flex items-center gap-3"><TrendingUp className="h-8 w-8 text-warning" /><div><p className="text-2xl font-bold">{stats?.totalTickets || 0}</p><p className="text-xs text-muted-foreground">Support Tickets</p></div></CardContent></Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle id="stats-title">Platform Statistics</CardTitle></CardHeader>
          <CardContent aria-labelledby="stats-title" className="space-y-4">
            {[
              { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-primary' },
              { label: 'Students', value: stats?.totalStudents || 0, icon: GraduationCap, color: 'text-info' },
              { label: 'Companies', value: stats?.totalCompanies || 0, icon: Building2, color: 'text-success' },
              { label: 'Colleges', value: stats?.totalColleges || 0, icon: GraduationCap, color: 'text-warning' },
              { label: 'Active Jobs', value: stats?.activeJobs || 0, icon: Briefcase, color: 'text-primary' },
              { label: 'Total Drives', value: stats?.totalDrives || 0, icon: Calendar, color: 'text-info' },
              { label: 'Total Applications', value: stats?.totalApplications || 0, icon: FileText, color: 'text-success' },
              { label: 'Support Tickets (Open)', value: stats?.openTickets || 0, icon: LifeBuoy, color: 'text-warning' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2"><s.icon className={`h-4 w-4 ${s.color}`} /><span className="text-sm">{s.label}</span></div>
                <span className="text-lg font-bold">{s.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle id="users-by-role">Users by Role</CardTitle></CardHeader>
            <CardContent aria-labelledby="users-by-role" className="space-y-3">
              {roleDist.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users yet</p>
              ) : (
                roleDist.map((r: any) => {
                  const total = roleDist.reduce((s: number, x: any) => s + x.count, 0)
                  const pct = total > 0 ? Math.round((r.count / total) * 100) : 0
                  const colors: Record<string, string> = { student: 'bg-info', company: 'bg-success', college: 'bg-warning', admin: 'bg-destructive' }
                  return (
                    <div key={r._id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{r._id}</span>
                        <span className="font-medium">{r.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${colors[r._id] || 'bg-primary'}`} style={{ width: pct + '%' }} />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle id="actions-title">Quick Actions</CardTitle></CardHeader>
            <CardContent aria-labelledby="actions-title" className="space-y-2">
              {quickActions.map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-all cursor-pointer" onClick={item.onClick} role="button" tabIndex={0}>
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><item.icon className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1"><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle id="analytics-title">Platform Analytics</CardTitle></CardHeader>
        <CardContent aria-labelledby="analytics-title">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-3">User Growth (12 months)</h4>
              {userGrowth.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-2">
                  {userGrowth.slice(0, 6).map((m: any) => (
                    <div key={m._id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{m._id}</span>
                      <div className="flex-1 h-5 rounded bg-muted/30 overflow-hidden">
                        <div className="h-full rounded bg-gradient-to-r from-primary to-purple-500" style={{ width: Math.min(100, (m.count / Math.max(...userGrowth.map((x: any) => x.count)) * 100)) + '%' }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{m.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3">Applications Trend (12 months)</h4>
              {appTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data available</p>
              ) : (
                <div className="space-y-2">
                  {appTrend.slice(-6).map((m: any) => (
                    <div key={m._id} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16">{m._id}</span>
                      <div className="flex-1 h-5 rounded bg-muted/30 overflow-hidden">
                        <div className="h-full rounded bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: Math.min(100, (m.count / Math.max(...appTrend.map((x: any) => x.count || 1))) * 100) + '%' }} />
                      </div>
                      <span className="text-xs font-medium w-8 text-right">{m.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {analytics?.topColleges && analytics.topColleges.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Top Colleges by Students</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              {analytics.topColleges.map((c: any, i: number) => (
                <div key={c._id} className="p-3 rounded-lg bg-muted/20 text-center">
                  <p className="text-lg font-bold">{c.studentCount || 0}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.collegeName || 'Unnamed'}</p>
                  <Badge variant={c.verified ? 'success' : 'warning'} className="text-[10px] mt-1">{c.verified ? 'Verified' : 'Pending'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
