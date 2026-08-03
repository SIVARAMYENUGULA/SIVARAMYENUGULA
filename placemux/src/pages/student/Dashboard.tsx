import { Briefcase, GraduationCap, Clock, Calendar, Building2, ArrowRight, Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MetricCard } from '@/components/shared/metric-card'
import { DataTable } from '@/components/ui/table'
import { LineChartWidget } from '@/components/ui/chart'
import { EmptyState } from '@/components/shared/empty-state'
import { applicationService } from '@/services/application'
import { assessmentService } from '@/services/assessment'
import { interviewService } from '@/services/interview'
import { jobService } from '@/services/job'
import { profileService } from '@/services/profile'
import { useAuth } from '@/lib/auth-context'
import { Link } from 'react-router-dom'

import { useState, useEffect, useMemo } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import type { Application, Job, Interview } from '@/types'

export function StudentDashboard() {
  const { user } = useAuth()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [interviews, setUpcomingInterviews] = useState<Interview[]>([])
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([])
  const [completedAssessments, setCompletedAssessments] = useState(0)
  const [avgAssessmentScore, setAvgAssessmentScore] = useState(0)
  const [profileCompleted, setProfileCompleted] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apps, interviewsData, jobsData, assessmentHistory, profileData] = await Promise.all([
          applicationService.getAll(),
          interviewService.getAll(),
          jobService.getRecommended(),
          assessmentService.getHistory(),
          profileService.getProfile(),
        ])
        setApplications(apps)
        setUpcomingInterviews(interviewsData.filter(i => i.status === 'Scheduled'))
        setRecommendedJobs(jobsData)
        setCompletedAssessments(assessmentHistory.length)
        if (assessmentHistory.length > 0) {
          const avg = Math.round(assessmentHistory.reduce((a, b) => a + (b.maxScore > 0 ? (b.score / b.maxScore) * 100 : 0), 0) / assessmentHistory.length)
          setAvgAssessmentScore(avg)
        }
        setProfileCompleted(profileData.profile?.profileCompleted ?? null)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load dashboard data')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  const metrics = useMemo(() => [
    { label: 'Total Applications', value: applications.length, change: 0, trend: 'neutral' as const },
    { label: 'Completed Assessments', value: completedAssessments, change: 0, trend: 'neutral' as const },
    { label: 'Upcoming Interviews', value: interviews.length, change: 0, trend: 'neutral' as const },
    { label: 'Avg Assessment Score', value: `${avgAssessmentScore}%`, change: 0, trend: 'neutral' as const },
  ], [applications.length, completedAssessments, interviews.length, avgAssessmentScore])

  // Build chart data from applications
  const chartData = useMemo(() => {
    const byMonth: Record<string, { month: string; applications: number; shortlisted: number; interviews: number }> = {}
    applications.forEach(app => {
      const month = app.appliedAt ? app.appliedAt.substring(0, 7) : ''
      if (!month) return
      if (!byMonth[month]) {
        const date = new Date(app.appliedAt)
        byMonth[month] = {
          month: date.toLocaleString('en-US', { month: 'short' }),
          applications: 0, shortlisted: 0, interviews: 0,
        }
      }
      byMonth[month].applications++
      if (app.status === 'Shortlisted' || app.status === 'Interview') byMonth[month].shortlisted++
      if (app.status === 'Interview') byMonth[month].interviews++
    })
    return Object.values(byMonth).slice(-6)
  }, [applications])

  const recentActivity = useMemo(() => {
    const activity: { action: string; detail: string; time: string; icon: any }[] = []
    applications.slice(0, 3).forEach(app => {
      activity.push({
        action: `Applied to ${app.company}`,
        detail: app.jobTitle,
        time: app.appliedAt || '',
        icon: Briefcase,
      })
    })
    return activity
  }, [applications])

  if (pageLoading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  return (
    <main className="space-y-8" aria-label="Student dashboard">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Student'}! 👋</h1>
          <p className="text-muted-foreground mt-1">Your placement overview</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="info" aria-label="Student role"><GraduationCap className="h-3.5 w-3.5 mr-1" /> Student</Badge>
          <Badge variant="success">Profile: {profileCompleted !== null ? `${profileCompleted}%` : '--'}</Badge>
        </div>
      </div>

      <section aria-label="Key metrics">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => <MetricCard key={m.label} {...m} delay={i * 0.1} />)}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle id="app-overview-title">Application Overview</CardTitle></CardHeader>
          <CardContent aria-labelledby="app-overview-title">
            {chartData.length > 0 ? (
              <LineChartWidget data={chartData} lines={[
                { dataKey: 'applications', name: 'Applications', color: '#6c5ce7' },
                { dataKey: 'shortlisted', name: 'Shortlisted', color: '#a29bfe' },
                { dataKey: 'interviews', name: 'Interviews', color: '#74b9ff' },
              ]} xKey="month" height={280} />
            ) : (
              <EmptyState icon={Briefcase} title="No application data yet" description="Apply to jobs to see your application trends" className="py-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle id="upcoming-interviews-title">Upcoming Interviews</CardTitle></CardHeader>
          <CardContent aria-labelledby="upcoming-interviews-title" className="space-y-4">
            {interviews.length === 0 ? (
              <EmptyState icon={Calendar} title="No upcoming interviews" description="Interviews will appear here once scheduled" />
            ) : (
              interviews.slice(0, 3).map((int) => (
                <div key={int.id} className="rounded-lg border border-border/50 bg-muted/20 p-4 transition-all hover:border-primary/30">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{int.jobTitle}</p>
                        <p className="text-xs text-muted-foreground">{int.candidate}</p>
                      </div>
                    </div>
                    <Badge variant="info" className="text-[10px]">{int.type}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                    <span><Calendar className="h-3 w-3 inline mr-1" />{int.date}</span>
                    <span><Clock className="h-3 w-3 inline mr-1" />{int.time}</span>
                  </div>
                </div>
              ))
            )}
            {interviews.length > 0 && (
              <Link to="/student/my-interviews">
                <Button variant="ghost" size="sm" className="w-full text-xs">View All</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle id="recent-activity-title">Recent Activity</CardTitle></CardHeader>
          <CardContent aria-labelledby="recent-activity-title">
            {recentActivity.length === 0 ? (
              <EmptyState icon={Bell} title="No recent activity" description="Your recent actions will appear here" />
            ) : (
              recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted/30 transition-all">
                  <div className="bg-primary/5 rounded-lg p-2"><a.icon className="h-4 w-4 text-primary" /></div>
                  <div className="flex-1"><p className="text-sm font-medium">{a.action}</p><p className="text-xs text-muted-foreground">{a.detail}</p></div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle id="assessments-title">Assessment Summary</CardTitle></CardHeader>
          <CardContent aria-labelledby="assessments-title" className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Completed</span>
              <span className="font-medium">{completedAssessments}</span>
            </div>
            <Progress value={completedAssessments > 0 ? Math.min(completedAssessments * 20, 100) : 0} aria-label={`${completedAssessments} assessments completed`} />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-lg bg-muted/20 text-center">
                <p className="text-2xl font-bold text-primary">{completedAssessments}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/20 text-center">
                <p className="text-2xl font-bold text-primary">{avgAssessmentScore}%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </div>
            <Link to="/student/assessments">
              <Button variant="outline" size="sm" className="w-full">
                View Assessments <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle id="recommended-jobs-title">Recommended Jobs</CardTitle>
          <Link to="/student/jobs"><Button variant="ghost" size="sm">View All <ArrowRight className="ml-1 h-3 w-3" /></Button></Link>
        </CardHeader>
        <CardContent aria-labelledby="recommended-jobs-title">
          {recommendedJobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No jobs available" description="Check back later for new opportunities" />
          ) : (
            <DataTable data={recommendedJobs.slice(0, 5)} columns={[
              { key: 'title', header: 'Position', sortable: true, render: (j: any) => <span className="font-medium">{j.title}</span> },
              { key: 'company', header: 'Company' },
              { key: 'location', header: 'Location' },
              { key: 'salary', header: 'Salary' },
              { key: 'type', header: 'Type', render: (j: any) => <Badge variant="info" className="text-[10px]">{j.type}</Badge> },
            ]} />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
