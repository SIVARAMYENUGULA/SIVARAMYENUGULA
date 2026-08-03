import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { assignmentService, type AssignmentAnalytics } from '@/services/assignment'
import { BarChart3, TrendingUp, Users, Award, Star, GraduationCap, Target, Zap } from 'lucide-react'

export function AssessmentAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AssignmentAnalytics | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await assignmentService.getAnalytics()
      setAnalytics(data)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load analytics')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchData} /></PageTransition>
  if (!analytics) return <PageTransition><EmptyState icon={BarChart3} title="No analytics data" /></PageTransition>

  const { summary, topPerformers, departmentBreakdown, assessmentBreakdown } = analytics
  const isGoodScore = summary.avgScore >= 60

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Assessment Analytics</h1>
        <p className="text-muted-foreground mt-1">Deep insights into candidate assessment performance</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary.completionRate}%</p>
            <p className="text-xs text-muted-foreground">Completion Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className={`h-8 w-8 mx-auto mb-2 ${isGoodScore ? 'text-success' : 'text-destructive'}`}>
              <TrendingUp className="h-8 w-8" />
            </div>
            <p className={`text-2xl font-bold ${isGoodScore ? 'text-success' : 'text-destructive'}`}>{summary.avgScore}%</p>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary.highestScore}%</p>
            <p className="text-xs text-muted-foreground">Highest Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Target className="h-8 w-8 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary.lowestScore}%</p>
            <p className="text-xs text-muted-foreground">Lowest Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="h-8 w-8 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">{summary.passedCount}/{summary.totalAssignments}</p>
            <p className="text-xs text-muted-foreground">Passed</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPerformers.length === 0 ? (
            <EmptyState icon={Users} title="No completed assessments" description="Results will appear as candidates complete their assessments" />
          ) : (
            <DataTable data={topPerformers} columns={[
              { key: 'studentName', header: 'Name', sortable: true, render: (p: any) => <span className="font-medium">{p.studentName}</span> },
              { key: 'studentEmail', header: 'Email' },
              { key: 'assessmentTitle', header: 'Assessment' },
              { key: 'course', header: 'Course' },
              { key: 'percentage', header: 'Score', sortable: true, render: (p: any) => <Badge variant={p.percentage >= 80 ? 'success' : p.percentage >= 60 ? 'warning' : 'destructive'}>{p.percentage}%</Badge> },
              { key: 'grade', header: 'Grade', render: (p: any) => <span className="text-xs font-medium">{p.grade}</span> },
              { key: 'passed', header: 'Passed', render: (p: any) => <Badge variant={p.passed ? 'success' : 'destructive'}>{p.passed ? 'Yes' : 'No'}</Badge> },
            ]} searchable searchPlaceholder="Search performers..." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Department-wise Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {departmentBreakdown.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No department data" />
            ) : (
              <div className="space-y-4">
                {departmentBreakdown.map((dept) => (
                  <div key={dept.course} className="p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{dept.course}</p>
                      <Badge variant={dept.avgScore >= 60 ? 'success' : 'warning'}>{dept.avgScore}% avg</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{dept.total} student{dept.total !== 1 ? 's' : ''}</span>
                      <span className="text-success">{dept.passed} passed</span>
                      <span className="text-info">{dept.passRate}% pass rate</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all" style={{ width: dept.passRate + '%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-warning" />
              Per-Assessment Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessmentBreakdown.length === 0 ? (
              <EmptyState icon={Zap} title="No assessment data" />
            ) : (
              <div className="space-y-4">
                {assessmentBreakdown.map((a) => (
                  <div key={a.assessmentId} className="p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{a.assessmentTitle}</p>
                      <Badge variant="secondary" className="text-[10px]">{a.assessmentType}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{a.total} total</span>
                      <span className="text-success">{a.completed} done</span>
                      <span className="text-warning">{a.inProgress} in progress</span>
                      {a.expired > 0 && <span className="text-destructive">{a.expired} expired</span>}
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden flex">
                      <div className="h-full bg-success transition-all" style={{ width: (a.total > 0 ? (a.completed / a.total) * 100 : 0) + '%' }} />
                      <div className="h-full bg-warning transition-all" style={{ width: (a.total > 0 ? (a.inProgress / a.total) * 100 : 0) + '%' }} />
                      {a.expired > 0 && <div className="h-full bg-destructive transition-all" style={{ width: (a.expired / a.total * 100) + '%' }} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
        <CardHeader><CardTitle>Key Insights</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-background/80">
              <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
              <p className={`text-2xl font-bold ${summary.completionRate >= 70 ? 'text-success' : summary.completionRate >= 40 ? 'text-warning' : 'text-destructive'}`}>
                {summary.completionRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.completionRate >= 70 ? 'Great engagement!' : summary.completionRate >= 40 ? 'Moderate engagement' : 'Needs improvement'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/80">
              <p className="text-sm text-muted-foreground mb-1">Average Score vs Passing</p>
              <p className={`text-2xl font-bold ${summary.avgScore >= 60 ? 'text-success' : 'text-destructive'}`}>{summary.avgScore}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.avgScore >= 60 ? 'Above average performance' : 'Below average performance'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-background/80">
              <p className="text-sm text-muted-foreground mb-1">Top Departments</p>
              <p className="text-2xl font-bold text-info">{departmentBreakdown.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Departments with assessed candidates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
