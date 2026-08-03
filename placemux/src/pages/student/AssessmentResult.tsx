import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { assessmentService } from '@/services/assessment'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Target, CheckCircle, XCircle, TrendingUp, BarChart3, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'

interface ScoreResult {
  _id: string
  sessionId: string
  assessmentId: string
  assessmentTitle: string
  assessmentType: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  grade: string
  correctCount: number
  totalQuestions: number
  timeTakenSec: number
  completedAt: string
}

export function AssessmentResult() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ScoreResult | null>(null)

  useEffect(() => {
    const fetchResults = async () => {
      if (!id) { setError('Assessment ID is required'); setLoading(false); return }
      try {
        const data = await assessmentService.getResults(id)
        setResult(data)
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Failed to load results')
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [id])

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={() => navigate('/student/assessments')} /></PageTransition>
  if (!result) return (
    <PageTransition>
      <EmptyState icon={BarChart3} title="No results available"
        description="This assessment result could not be found"
        action={{ label: 'Back to Assessments', onClick: () => navigate('/student/assessments') }}
      />
    </PageTransition>
  )

  const grade = (() => {
    if (result.percentage >= 90) return { label: 'Excellent', color: 'text-success', badge: 'success' as const }
    if (result.percentage >= 75) return { label: 'Good', color: 'text-info', badge: 'info' as const }
    if (result.percentage >= 60) return { label: 'Average', color: 'text-warning', badge: 'warning' as const }
    return { label: 'Needs Improvement', color: 'text-destructive', badge: 'destructive' as const }
  })()

  const incorrect = result.totalQuestions - result.correctCount
  const percentCorrect = result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0
  const percentIncorrect = 100 - percentCorrect
  const timeDisplay = result.timeTakenSec
    ? `${Math.floor(result.timeTakenSec / 60)}m ${result.timeTakenSec % 60}s`
    : 'N/A'

  return (
    <PageTransition>
      <main className="max-w-4xl mx-auto space-y-8" aria-label="Assessment results">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/assessments')} aria-label="Back to assessments">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Assessment Results</h1>
            <p className="text-muted-foreground mt-1">{result.assessmentTitle}</p>
          </div>
          <Badge variant={grade.badge} className="px-3 py-1.5 text-sm">{grade.label}</Badge>
        </div>

        <section aria-label="Score overview">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
            <CardContent className="relative pt-8">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="relative">
                  <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/10" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - result.percentage / 100)}`}
                      className={grade.badge === 'success' ? 'text-success' : grade.badge === 'info' ? 'text-info' : grade.badge === 'warning' ? 'text-warning' : 'text-destructive'}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold ${grade.color}`}>{result.percentage}%</span>
                    <span className="text-xs text-muted-foreground mt-1">Score</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
                  <div className="text-center p-4 rounded-xl bg-success/5 border border-success/10">
                    <CheckCircle className="h-6 w-6 text-success mx-auto mb-2" />
                    <p className="text-2xl font-bold text-success">{result.correctCount}</p>
                    <p className="text-xs text-muted-foreground">Correct</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                    <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                    <p className="text-2xl font-bold text-destructive">{incorrect}</p>
                    <p className="text-xs text-muted-foreground">Incorrect</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-info/5 border border-info/10">
                    <Target className="h-6 w-6 text-info mx-auto mb-2" />
                    <p className="text-2xl font-bold text-info">{result.totalQuestions}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-primary">{grade.label}</p>
                    <p className="text-xs text-muted-foreground">Grade</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-success" /> Correct</span>
                  <span className="font-medium text-success">{percentCorrect}%</span>
                </div>
                <Progress value={percentCorrect} aria-label={`${percentCorrect}% correct`} className="[&>div]:bg-success" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-destructive" /> Incorrect</span>
                  <span className="font-medium text-destructive">{percentIncorrect}%</span>
                </div>
                <Progress value={percentIncorrect} aria-label={`${percentIncorrect}% incorrect`} className="[&>div]:bg-destructive" />
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1"><Target className="h-3.5 w-3.5 text-info" /> Accuracy</span>
                  <span className="font-medium">{result.totalQuestions > 0 ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0}%</span>
                </div>
                <Progress value={result.totalQuestions > 0 ? (result.correctCount / result.totalQuestions) * 100 : 0} aria-label="Accuracy" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" /> Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/20">
                <div className="text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-medium">{result.score}/{result.maxScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percentage</span>
                    <span className="font-medium">{result.percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grade</span>
                    <span className="font-medium">{result.grade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${result.passed ? 'text-success' : 'text-destructive'}`}>
                      {result.passed ? 'Passed' : 'Not Passed'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/20">
                <Clock className="h-4 w-4" />
                <span>Completed in {timeDisplay}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/student/assessments')}>
            <ArrowLeft className="h-4 w-4" /> Back to Assessments
          </Button>
        </div>
      </main>
    </PageTransition>
  )
}
