import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { ClipboardCheck, Clock, Brain, BarChart3, Play } from 'lucide-react'
import { assessmentService } from '@/services/assessment'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import type { Assessment } from '@/types'

export function StudentAssessments() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allAssessments, completedHistory] = await Promise.all([
          assessmentService.getAll(),
          assessmentService.getHistory(),
        ])
        
        // Map ScoreRecord[] to Assessment[] for the merge
        const completedAssessments: Assessment[] = completedHistory.map(s => ({
          id: s.assessmentId,
          title: s.assessmentTitle,
          type: s.assessmentType as Assessment['type'],
          score: s.score,
          maxScore: s.maxScore,
          completedAt: s.completedAt,
          duration: s.timeTakenSec ? Math.round(s.timeTakenSec / 60) : 0,
          status: 'completed' as const,
        }))
        
        const completedIds = new Set(completedAssessments.map(a => a.id))
        const pendingFromList = allAssessments.filter(a => !completedIds.has(a.id))
        
        setAssessments([...completedAssessments, ...pendingFromList.map(a => ({ ...a, status: 'pending' as const }))])
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load assessments')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => setPageError(null)} /></PageTransition>

  const pendingAssessments = assessments.filter(a => a.status === 'pending')
  const completedAssessments = assessments.filter(a => a.status === 'completed')
  const avgScore = completedAssessments.length > 0
    ? Math.round(completedAssessments.reduce((a, b) => a + (b.maxScore > 0 ? (b.score / b.maxScore) * 100 : 0), 0) / completedAssessments.length)
    : 0

  const handleStart = (id: string) => {
    navigate(`/student/assessments/${id}/start`)
  }

  return (
    <main className="space-y-8" aria-label="Assessments">
      <div><h1 className="text-3xl font-bold">Assessments</h1><p className="text-muted-foreground mt-1">Take skill assessments to boost your profile</p></div>

      <section aria-label="Assessment statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 text-center"><ClipboardCheck className="h-8 w-8 text-primary mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{assessments.length}</p><p className="text-xs text-muted-foreground">Total Tests</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Brain className="h-8 w-8 text-success mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{completedAssessments.length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-warning mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{pendingAssessments.length}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><BarChart3 className="h-8 w-8 text-info mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{avgScore}%</p><p className="text-xs text-muted-foreground">Avg Score</p></CardContent></Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label="Available assessments" className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle id="available-title">Available Assessments</CardTitle></CardHeader>
            <CardContent aria-labelledby="available-title" className="space-y-4">
              {pendingAssessments.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="No pending assessments" description="You've completed all available assessments" />
              ) : (
                pendingAssessments.map((a) => (
                  <Card key={a.id} className="border-border/30 hover:border-primary/30 transition-all hover:shadow-sm">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
                          <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.type} &middot; {a.duration} mins</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-2" onClick={() => handleStart(a.id)} aria-label={`Start ${a.title}`}><Play className="h-3.5 w-3.5" /> Start</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </section>
        <aside aria-label="Performance overview">
          <Card>
            <CardHeader><CardTitle id="perf-title">Performance Overview</CardTitle></CardHeader>
            <CardContent aria-labelledby="perf-title" className="space-y-4">
              {completedAssessments.length === 0 ? (
                <EmptyState icon={BarChart3} title="No assessments completed" description="Complete assessments to see your performance" />
              ) : (
                completedAssessments.map((a) => (
                  <div key={a.id} className="space-y-1">
                    <div className="flex justify-between text-sm"><span>{a.title}</span><span className="font-medium">{a.score}/{a.maxScore}</span></div>
                    <Progress value={a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0} aria-label={`${a.title}: ${a.score} out of ${a.maxScore}`} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
