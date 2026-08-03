import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { LineChartWidget } from '@/components/ui/chart'
import { EmptyState } from '@/components/shared/empty-state'
import { assessmentService, type ScoreRecord } from '@/services/assessment'
import { Clock, BarChart3, Eye } from 'lucide-react'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function StudentAssessmentHistory() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [history, setHistory] = useState<ScoreRecord[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await assessmentService.getHistory()
        setHistory(data)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load history')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const avgScore = history.length > 0
    ? Math.round(history.reduce((a, b) => a + (b.maxScore > 0 ? (b.score / b.maxScore) * 100 : 0), 0) / history.length)
    : 0

  const passedCount = history.filter(h => h.passed).length

  return (
    <main className="space-y-8" aria-label="Assessment history">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assessment History</h1>
          <p className="text-muted-foreground mt-1">Track your assessment performance over time</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="info" className="px-3 py-1.5">{history.length} Total</Badge>
          <Badge variant="success" className="px-3 py-1.5">{avgScore}% Avg</Badge>
        </div>
      </div>

      <section aria-label="Score statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold">{history.length}</p>
              <p className="text-xs text-muted-foreground">Assessments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold">{avgScore}%</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold">{passedCount}</p>
              <p className="text-xs text-muted-foreground">Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{history.length ? Math.round((passedCount / history.length) * 100) : 0}%</p>
              <p className="text-xs text-muted-foreground">Pass Rate</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle id="score-trend-title">Score Trend</CardTitle></CardHeader>
        <CardContent aria-labelledby="score-trend-title">
          {history.length === 0 ? (
            <EmptyState icon={BarChart3} title="No completed assessments" description="Complete an assessment to see your score trend" />
          ) : (
            <LineChartWidget
              data={history.map(h => ({ name: h.assessmentTitle || h.assessmentType, score: Math.round((h.score / h.maxScore) * 100) }))}
              lines={[{ dataKey: 'score', name: 'Score', color: '#6c5ce7' }]}
              xKey="name"
              height={250}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle id="history-title">Assessment Records</CardTitle></CardHeader>
        <CardContent aria-labelledby="history-title">
          {history.length === 0 ? (
            <EmptyState icon={Clock} title="No assessments completed" description="Complete assessments to see your history here" />
          ) : (
            <DataTable data={history} columns={[
              { key: 'assessmentTitle', header: 'Assessment', sortable: true, render: (h: any) => <span className="font-medium">{h.assessmentTitle || h.assessmentType}</span> },
              { key: 'assessmentType', header: 'Type', render: (h: any) => <Badge variant="secondary">{h.assessmentType}</Badge> },
              { key: 'score', header: 'Score', render: (h: any) => <span className="font-medium">{h.score}/{h.maxScore}</span> },
              { key: 'percentage', header: '%', render: (h: any) => <Badge variant={h.percentage >= 80 ? 'success' : h.percentage >= 60 ? 'warning' : 'destructive'}>{h.percentage}%</Badge> },
              { key: 'grade', header: 'Grade', render: (h: any) => <span className="text-xs">{h.grade}</span> },
              { key: 'passed', header: 'Status', render: (h: any) => <Badge variant={h.passed ? 'success' : 'secondary'}>{h.passed ? 'Passed' : 'Failed'}</Badge> },
              { key: 'completedAt', header: 'Date', render: (h: any) => <span className="text-xs">{h.completedAt ? new Date(h.completedAt).toLocaleDateString() : '-'}</span> },
              { key: 'actions', header: '', render: (h: any) => (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/student/assessments/${h.assessmentId}/results`)} aria-label="View results">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )},
            ]} searchable searchPlaceholder="Search assessments..." />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
