import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ErrorState } from '@/components/shared/error-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { assessmentService } from '@/services/assessment'
import { useToast } from '@/hooks/use-toast'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Brain, BarChart3, Play, ArrowLeft, Trophy, Target, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AssessmentDetail {
  _id: string
  title: string
  type: string
  duration: number
  questionCount: number
  passingScore: number
  isActive: boolean
  createdBy: string
}

interface ScoreResult {
  _id: string
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

export function AssessmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null)
  const [result, setResult] = useState<ScoreResult | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) { setError('Assessment ID is required'); setLoading(false); return }
      try {
        const assessmentData = await assessmentService.getById(id)
        setAssessment(assessmentData)

        // Check if already completed
        try {
          const scoreData = await assessmentService.getResults(id)
          setResult(scoreData)
        } catch {
          // No results yet — not completed
        }
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Assessment not found')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error || !assessment) return <PageTransition><ErrorState type="page" message={error || 'Assessment not found'} onRetry={() => navigate('/student/assessments')} /></PageTransition>

  const isCompleted = !!result
  const scorePercent = result && result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0

  const handleStart = () => {
    navigate(`/student/assessments/${assessment._id}/start`)
    addToast({ title: 'Assessment Started', description: `Beginning ${assessment.title}`, variant: 'info' })
  }

  const handleViewResults = () => {
    navigate(`/student/assessments/${assessment._id}/results`)
  }

  const getTypeIcon = () => {
    switch (assessment.type) {
      case 'Technical': return <Brain className="h-5 w-5" />
      case 'Aptitude': return <Target className="h-5 w-5" />
      case 'Soft Skills': return <Trophy className="h-5 w-5" />
      default: return <BarChart3 className="h-5 w-5" />
    }
  }

  return (
    <PageTransition>
      <main className="space-y-8" aria-label="Assessment detail">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/assessments')} aria-label="Back to assessments">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{assessment.title}</h1>
            <p className="text-muted-foreground mt-1">Assessment details and progress</p>
          </div>
          <Badge variant={isCompleted ? 'success' : 'info'} className="px-3 py-1.5">
            {isCompleted ? 'Completed' : 'Pending'}
          </Badge>
        </div>

        <section aria-label="Assessment overview">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-2"><div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">{getTypeIcon()}</div></div>
              <p className="text-2xl font-bold">{assessment.type}</p>
              <p className="text-xs text-muted-foreground">Assessment Type</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <Clock className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold">{assessment.duration}</p>
              <p className="text-xs text-muted-foreground">Duration (mins)</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <Target className="h-8 w-8 text-info mx-auto mb-2" />
              <p className="text-2xl font-bold">{isCompleted ? `${result!.score}/${result!.maxScore}` : '-'}</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold">{isCompleted ? `${scorePercent}%` : '-'}</p>
              <p className="text-xs text-muted-foreground">Percentage</p>
            </CardContent></Card>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle>Assessment Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{assessment.title}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-medium">{assessment.type}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{assessment.duration} minutes</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">Questions</p>
                    <p className="font-medium">{assessment.questionCount || 'N/A'}</p>
                  </div>
                </div>
                {isCompleted && result?.completedAt && (
                  <div className="p-4 rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">Completed On</p>
                    <p className="font-medium">{new Date(result.completedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
          <aside className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Score</CardTitle></CardHeader>
              <CardContent className="text-center">
                {isCompleted && result ? (
                  <>
                    <div className="relative h-32 w-32 mx-auto mb-4">
                      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          strokeDashoffset={`${2 * Math.PI * 42 * (1 - scorePercent / 100)}`}
                          className={scorePercent >= 80 ? 'text-success' : scorePercent >= 60 ? 'text-warning' : 'text-destructive'}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-3xl font-bold ${scorePercent >= 80 ? 'text-success' : scorePercent >= 60 ? 'text-warning' : 'text-destructive'}`}>{scorePercent}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{result.score} out of {result.maxScore}</p>
                    <Button className="w-full mt-4" variant="outline" onClick={handleViewResults}>View Detailed Results</Button>
                  </>
                ) : (
                  <>
                    <div className="h-32 w-32 mx-auto mb-4 flex items-center justify-center rounded-full bg-primary/10">
                      <Play className="h-12 w-12 text-primary ml-2" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">Ready to begin this assessment?</p>
                    <p className="text-xs text-muted-foreground mb-4">{assessment.questionCount || 'N/A'} questions &middot; {assessment.duration} minutes</p>
                    <Button className="w-full gap-2" onClick={handleStart}><Play className="h-4 w-4" /> Start Assessment</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>

        {isCompleted && result && (
          <Card>
            <CardHeader><CardTitle>Performance Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Overall Score</span>
                <span className="font-medium">{result.score}/{result.maxScore} ({scorePercent}%)</span>
              </div>
              <Progress value={scorePercent} aria-label={`Score: ${scorePercent}%`} />
              <div className="grid grid-cols-3 gap-4 pt-2">
                {[
                  { label: 'Correct', value: `${result.correctCount}/${result.totalQuestions}` },
                  { label: 'Grade', value: result.grade },
                  { label: 'Status', value: result.passed ? 'Passed' : 'Not Passed' },
                ].map((metric) => (
                  <div key={metric.label} className="text-center p-3 rounded-lg bg-muted/20">
                    <p className="text-lg font-bold text-primary">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </PageTransition>
  )
}
