import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LineChartWidget, PieChartWidget } from '@/components/ui/chart'
import { MetricCard } from '@/components/shared/metric-card'
import { EmptyState } from '@/components/shared/empty-state'
import { jobService } from '@/services/job'
import { applicationService } from '@/services/application'
import { interviewService } from '@/services/interview'
import { assessmentService } from '@/services/assessment'
import { useAuth } from '@/lib/auth-context'
import { UserPlus, ArrowRight, User, Briefcase, TrendingUp, Users, CheckCircle2, Calendar } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { useNavigate } from 'react-router-dom'

export function CompanyDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [totalJobs, setTotalJobs] = useState(0)
  const [activeJobs, setActiveJobs] = useState(0)
  const [totalApplicants, setTotalApplicants] = useState(0)
  const [interviews, setInterviews] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsData, appsData, interviewsData, assessmentsData] = await Promise.all([
          jobService.getAll(),
          applicationService.getAll(),
          interviewService.getAll(),
          assessmentService.getAll(),
        ])
        setTotalJobs(jobsData.length)
        setActiveJobs(jobsData.filter(j => j.status === 'active').length)
        setTotalApplicants(appsData.length)
        setInterviews(interviewsData)
        setApplications(appsData)
        setAssessments(assessmentsData)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load dashboard data')
      } finally { setPageLoading(false) }
    }
    fetchData()
  }, [])

  // Funnel analytics
  const funnel = useMemo(() => {
    const applied = applications.length
    const shortlisted = applications.filter(a => a.status === 'Shortlisted' || a.status === 'Assessment Assigned' || a.status === 'Interview' || a.status === 'Offered' || a.status === 'Accepted').length
    const interviewed = applications.filter(a => a.status === 'Interview' || a.status === 'Offered' || a.status === 'Accepted').length
    const offered = applications.filter(a => a.status === 'Offered' || a.status === 'Accepted').length
    const accepted = applications.filter(a => a.status === 'Accepted').length

    return {
      applied, shortlisted, interviewed, offered, accepted,
      shortlistRate: applied > 0 ? Math.round((shortlisted / applied) * 100) : 0,
      interviewRate: shortlisted > 0 ? Math.round((interviewed / shortlisted) * 100) : 0,
      offerRate: interviewed > 0 ? Math.round((offered / interviewed) * 100) : 0,
      acceptanceRate: offered > 0 ? Math.round((accepted / offered) * 100) : 0,
      overallConversion: applied > 0 ? Math.round((accepted / applied) * 100) : 0,
    }
  }, [applications])

  const metrics = useMemo(() => [
    { label: 'Total Jobs', value: totalJobs, change: 0, trend: 'neutral' as const },
    { label: 'Active Jobs', value: activeJobs, change: 0, trend: 'neutral' as const },
    { label: 'Total Applicants', value: totalApplicants, change: 0, trend: 'neutral' as const },
    { label: 'Hiring Rate', value: funnel.overallConversion + '%', change: 0, trend: 'neutral' as const },
  ], [totalJobs, activeJobs, totalApplicants, funnel])

  const chartData = useMemo(() => {
    const byMonth: Record<string, { month: string; applications: number; shortlisted: number; interviews: number; offers: number; hires: number }> = {}
    applications.forEach((app: any) => {
      const month = app.appliedAt ? app.appliedAt.substring(0, 7) : ''
      if (!month) return
      if (!byMonth[month]) {
        const date = new Date(app.appliedAt)
        byMonth[month] = { month: date.toLocaleString('en-US', { month: 'short' }), applications: 0, shortlisted: 0, interviews: 0, offers: 0, hires: 0 }
      }
      byMonth[month].applications++
      if (app.status === 'Shortlisted' || app.status === 'Interview' || app.status === 'Offered' || app.status === 'Accepted') byMonth[month].shortlisted++
      if (app.status === 'Interview' || app.status === 'Offered' || app.status === 'Accepted') byMonth[month].interviews++
      if (app.status === 'Offered' || app.status === 'Accepted') byMonth[month].offers++
      if (app.status === 'Accepted') byMonth[month].hires++
    })
    return Object.values(byMonth).slice(-6)
  }, [applications])

  const recentApplicants = useMemo(() => applications.slice(0, 4), [applications])

  if (pageLoading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Company Dashboard</h1><p className="text-muted-foreground mt-1">{user?.name || 'Company'} &middot; Hiring Overview</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="success" className="px-3 py-1.5"><TrendingUp className="h-3.5 w-3.5 mr-1" /> {funnel.overallConversion}% Conversion</Badge>
          <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => navigate('/company/jobs')}><UserPlus className="h-4 w-4 mr-2" /> Manage Jobs</Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => <MetricCard key={m.label} {...m} delay={i * 0.1} />)}
      </section>

      {/* Funnel Analytics */}
      <Card>
        <CardHeader><CardTitle>Hiring Funnel</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-3xl font-bold text-primary">{funnel.applied}</p>
              <p className="text-xs text-muted-foreground">Applied</p>
              <p className="text-[10px] text-primary">100%</p>
            </div>
            <div className="flex items-center justify-center text-muted-foreground"><ArrowRight className="h-6 w-6" /></div>
            <div className="text-center p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <p className="text-3xl font-bold text-purple-500">{funnel.shortlisted}</p>
              <p className="text-xs text-muted-foreground">Shortlisted</p>
              <p className="text-[10px] text-purple-500">{funnel.shortlistRate}%</p>
            </div>
            <div className="flex items-center justify-center text-muted-foreground"><ArrowRight className="h-6 w-6" /></div>
            <div className="text-center p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <p className="text-3xl font-bold text-orange-500">{funnel.interviewed}</p>
              <p className="text-xs text-muted-foreground">Interviewed</p>
              <p className="text-[10px] text-orange-500">{funnel.interviewRate}%</p>
            </div>
            <div className="flex items-center justify-center text-muted-foreground"><ArrowRight className="h-6 w-6" /></div>
            <div className="text-center p-4 rounded-lg bg-warning/5 border border-warning/20">
              <p className="text-3xl font-bold text-warning">{funnel.offered}</p>
              <p className="text-xs text-muted-foreground">Offered</p>
              <p className="text-[10px] text-warning">{funnel.offerRate}%</p>
            </div>
            <div className="flex items-center justify-center text-muted-foreground"><ArrowRight className="h-6 w-6" /></div>
            <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
              <p className="text-3xl font-bold text-success">{funnel.accepted}</p>
              <p className="text-xs text-muted-foreground">Hired</p>
              <p className="text-[10px] text-success">{funnel.acceptanceRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Hiring Activity</CardTitle></CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <LineChartWidget data={chartData} lines={[
                { dataKey: 'applications', name: 'Applications', color: '#6c5ce7' },
                { dataKey: 'shortlisted', name: 'Shortlisted', color: '#a29bfe' },
                { dataKey: 'interviews', name: 'Interviews', color: '#74b9ff' },
                { dataKey: 'hires', name: 'Hired', color: '#00b894' },
              ]} xKey="month" height={280} />
            ) : <EmptyState icon={Briefcase} title="No hiring data yet" className="py-12" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Total Jobs', value: totalJobs.toString(), icon: Briefcase },
              { label: 'Total Applicants', value: totalApplicants.toString(), icon: Users },
              { label: 'Upcoming Interviews', value: interviews.filter(i => i.status === 'Scheduled').length.toString(), icon: Calendar },
              { label: 'Conversion Rate', value: funnel.overallConversion + '%', icon: TrendingUp },
              { label: 'Offer Acceptance', value: funnel.acceptanceRate + '%', icon: CheckCircle2 },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2"><s.icon className="h-4 w-4 text-muted-foreground" /><p className="text-sm text-muted-foreground">{s.label}</p></div>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Recent Applicants</CardTitle></CardHeader>
          <CardContent>
            {recentApplicants.length === 0 ? (
              <EmptyState icon={User} title="No applicants yet" />
            ) : (
              recentApplicants.map((app: any) => (
                <div key={app.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">{(app.candidateName || '?').split(' ').map((n: string) => n[0]).join('')}</div>
                  <div className="flex-1"><p className="text-sm font-medium">{app.candidateName || 'Anonymous'}</p><p className="text-xs text-muted-foreground">{app.jobTitle}</p></div>
                  <Badge variant={app.status === 'Accepted' ? 'success' : app.status === 'Rejected' ? 'destructive' : app.status === 'Interview' || app.status === 'Offered' ? 'info' : 'warning'} className="text-[10px]">{app.status}</Badge>
                </div>
              ))
            )}
            {recentApplicants.length > 0 && <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => navigate('/company/candidates')}>View All <ArrowRight className="h-3 w-3 ml-1" /></Button>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Conversion Analytics</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Applied → Shortlisted', rate: funnel.shortlistRate, total: funnel.applied, converted: funnel.shortlisted },
              { label: 'Shortlisted → Interviewed', rate: funnel.interviewRate, total: funnel.shortlisted, converted: funnel.interviewed },
              { label: 'Interviewed → Offered', rate: funnel.offerRate, total: funnel.interviewed, converted: funnel.offered },
              { label: 'Offered → Accepted', rate: funnel.acceptanceRate, total: funnel.offered, converted: funnel.accepted },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-bold">{item.converted}/{item.total} ({item.rate}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all" style={{ width: `${Math.min(item.rate, 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
