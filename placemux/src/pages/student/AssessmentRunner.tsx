import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ErrorState } from '@/components/shared/error-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { CameraPreview } from '@/components/shared/CameraPreview'
import { ProctoringOverlay } from '@/components/shared/ProctoringOverlay'
import { useProctoring, logProctoringEvent } from '@/hooks/useProctoring'
import { assessmentService } from '@/services/assessment'
import { useToast } from '@/hooks/use-toast'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Clock, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle, Send,
  ShieldCheck, Monitor, Camera, FileText, HelpCircle, ListChecks, User,
  Activity, Play, Bookmark, BookmarkCheck,
  GraduationCap, ChevronDown, ChevronUp, Flag, Dot
} from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'

interface BackendQuestion {
  _id: string
  questionText: string
  options: string[]
  points: number
  orderIndex: number
}

export function AssessmentRunner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessmentTitle, setAssessmentTitle] = useState('')
  const [candidateName, setCandidateName] = useState('')
  const [examStarted, setExamStarted] = useState(false)
  const [questions, setQuestions] = useState<BackendQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cameraMinimized, setCameraMinimized] = useState(false)
  const criticalViolationsRef = useRef(0)
  const sessionIdRef = useRef<string>(id || '')
  const [sessionId, setSessionId] = useState<string>(id || '')
  const [laptopVideoState, setLaptopVideoState] = useState<{ videoWidth: number; videoHeight: number; readyState: number; playing: boolean } | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  // Compute stats
  const answeredCount = Object.keys(answers).length
  const unansweredCount = questions.length - answeredCount
  const markedCount = markedForReview.size
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0

  // Proctoring hook
  const { state: proctorState, initMedia, requestFullscreen, cleanup: cleanupProctoring } = useProctoring({
    sessionId: sessionId,
    onViolation: (event) => {
      logProctoringEvent(sessionIdRef.current || sessionId, event.type, event.severity, event.details, { timestamp: event.timestamp })
    },
    onCriticalViolation: (event) => {
      logProctoringEvent(sessionIdRef.current || sessionId, event.type, 'critical', event.details, { timestamp: event.timestamp })
      addToast({ title: 'Violation Detected', description: event.details, variant: 'error' })

      if (examStarted) {
        criticalViolationsRef.current++
        if (event.type === 'fullscreen_exit' || event.type === 'devtools_opened') {
          addToast({
            title: 'Critical Violation',
            description: 'Assessment auto-submitted due to a critical security violation.',
            variant: 'error',
          })
          handleSubmitRef.current()
        }
        if (criticalViolationsRef.current >= 3) {
          addToast({
            title: 'Excessive Violations',
            description: 'Assessment auto-submitted due to excessive violations.',
            variant: 'error',
          })
          handleSubmitRef.current()
        }
      }
    },
  })

  const updateSessionId = (newId: string) => {
    sessionIdRef.current = newId
    setSessionId(newId)
  }

  // Initialize
  useEffect(() => {
    const init = async () => {
      if (!id) { setError('Assessment ID is required'); setLoading(false); return }

      try {
        const assessmentData = await assessmentService.getById(id)
        setAssessmentTitle(assessmentData.title || 'Assessment')

        const startData = await assessmentService.start(id)
        const fetchedQuestions: BackendQuestion[] = startData.questions || []
        const durationMinutes = startData.duration || assessmentData.duration || 30
        if (startData.session?._id) {
          updateSessionId(startData.session._id)
        }

        if (fetchedQuestions.length === 0) {
          setError('This assessment has no questions.')
          setLoading(false)
          return
        }

        setQuestions(fetchedQuestions)
        setTimeLeft(durationMinutes * 60)
        setLoading(false)

        const storedUser = localStorage.getItem('placemux_user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setCandidateName(userData.name || 'Candidate')
          } catch {
            setCandidateName('Candidate')
          }
        }
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message || err?.message || 'Failed to start assessment'
        setError(msg)
        setLoading(false)
        return
      }

      const stream = await initMedia()
      mediaStreamRef.current = stream
    }
    init()

    const checkCameraTrack = () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(track => {
          track.onended = () => {
            if (examStarted) {
              addToast({ title: 'Camera Disconnected', description: 'Your webcam has disconnected.', variant: 'error' })
              logProctoringEvent(sessionIdRef.current, 'camera_disconnect', 'critical', 'Laptop camera disconnected during exam')
            }
          }
        })
      }
    }
    setTimeout(checkCameraTrack, 2000)

    const handleBeforeUnload = () => { cleanupProctoring() }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      cleanupProctoring()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Submit
  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !id) return
    setIsSubmitting(true)
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex,
      }))
      const result = await assessmentService.submit(id, formattedAnswers)
      addToast({
        title: 'Assessment Submitted!',
        description: `You scored ${result.correctCount}/${result.totalQuestions} (${result.percentage}%)`,
        variant: 'success',
      })
      cleanupProctoring()
      setTimeout(() => navigate(`/student/assessments/${id}/results`), 1000)
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Failed to submit assessment'
      addToast({ title: 'Submission Failed', description: msg, variant: 'error' })
      setIsSubmitting(false)
    }
  }, [answers, id, navigate, addToast, isSubmitting, cleanupProctoring])

  const handleSubmitRef = useRef(handleSubmit)
  useEffect(() => { handleSubmitRef.current = handleSubmit }, [handleSubmit])

  // Timer
  useEffect(() => {
    if (!examStarted) return
    if (timeLeft <= 0 || questions.length === 0) {
      if (timeLeft === 0 && questions.length > 0 && !isSubmitting) {
        addToast({ title: 'Time Expired', description: 'Your assessment has been auto-submitted.', variant: 'info' })
        handleSubmitRef.current()
      }
      return
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, questions.length, isSubmitting, examStarted, addToast])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Timer urgency class
  const timerClass = timeLeft < 60
    ? 'text-destructive'
    : timeLeft < 300
      ? 'text-warning'
      : 'text-foreground'

  const laptopCameraConnected = proctorState.cameraEnabled && !!proctorState.mediaStream && proctorState.mediaStream.getVideoTracks().length > 0
  const microphoneConnected = proctorState.micEnabled
  const laptopVideoVisible = !!(laptopVideoState && laptopVideoState.videoWidth > 0 && laptopVideoState.videoHeight > 0 && laptopVideoState.readyState >= 3)
  const allChecksPassed = laptopCameraConnected && microphoneConnected && proctorState.fullscreenEnabled && laptopVideoVisible
  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex === questions.length - 1

  // Get question status
  const getQuestionStatus = (qId: string, idx: number) => {
    const isAnswered = answers[qId] !== undefined
    const isMarked = markedForReview.has(qId)
    const isActive = idx === currentIndex
    if (isActive) return 'active'
    if (isAnswered && isMarked) return 'answered-marked'
    if (isAnswered) return 'answered'
    if (isMarked) return 'marked'
    return 'unanswered'
  }

  // Toggle mark for review
  const toggleMarkForReview = () => {
    if (!currentQuestion) return
    const qId = currentQuestion._id
    setMarkedForReview(prev => {
      const next = new Set(prev)
      if (next.has(qId)) next.delete(qId)
      else next.add(qId)
      return next
    })
  }

  const isCurrentMarked = currentQuestion ? markedForReview.has(currentQuestion._id) : false

  // Loading
  if (loading) return <DashboardSkeleton />

  // Error
  if (error) {
    return (
      <PageTransition>
        <ErrorState title="Assessment Error" message={error} onRetry={() => navigate('/student/assessments')} />
      </PageTransition>
    )
  }

  // ====== SETUP PHASE ======
  if (!examStarted) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/[0.03] p-4">
          <div className="w-full max-w-4xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-muted-foreground tracking-tight">PLACEMUX</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{assessmentTitle}</h1>
              <p className="text-muted-foreground">Complete the checks below to begin</p>
            </div>

            {/* Non-fullscreen blocker */}
            {!proctorState.fullscreenEnabled && (
              <ProctoringOverlay state={proctorState} onRequestFullscreen={requestFullscreen} events={proctorState.events} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Camera */}
              <div className="lg:col-span-3">
                <Card className="overflow-hidden border-border/40 shadow-lg shadow-black/5">
                  <CardContent className="p-0">
                    <CameraPreview
                      stream={mediaStreamRef.current || proctorState.mediaStream}
                      cameraEnabled={proctorState.cameraEnabled}
                      micEnabled={proctorState.micEnabled}
                      cameraError={proctorState.cameraError}
                      micError={proctorState.micError}
                      onVideoState={setLaptopVideoState}
                      className="h-64 rounded-xl"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* System checks */}
              <div className="lg:col-span-2 space-y-3">
                <Card className="border-border/40 shadow-lg shadow-black/5">
                  <CardHeader className="pb-3 pt-5 px-5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      System Readiness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 space-y-2.5">
                    {[
                      { label: 'Camera', passed: laptopCameraConnected },
                      { label: 'Video Feed', passed: laptopVideoVisible },
                      { label: 'Microphone', passed: microphoneConnected },
                      { label: 'Fullscreen', passed: proctorState.fullscreenEnabled },
                    ].map((check, i) => (
                      <div key={i} className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg transition-all ${
                        check.passed ? 'bg-success/5' : 'bg-muted/10'
                      }`}>
                        <span className="text-sm font-medium">{check.label}</span>
                        {check.passed ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {proctorState.violationCount > 0 && (
                  <Card className="border-destructive/20 shadow">
                    <CardContent className="pt-3 pb-3 px-5 flex items-center gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-destructive">{proctorState.violationCount}</span> violation{proctorState.violationCount !== 1 ? 's' : ''} recorded
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Instructions + Start */}
            <Card className="border-border/40 shadow-lg shadow-black/5">
              <CardContent className="pt-6 pb-6 px-6">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-2">Before You Start</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <Dot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{formatTime(timeLeft)} duration</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Dot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Webcam & mic required throughout</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Dot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Do not switch tabs or leave window</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Dot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Copy/paste & right-click disabled</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 self-center">
                    <Button
                      size="lg"
                      onClick={() => {
                        if (!allChecksPassed) {
                          addToast({ title: 'Setup Incomplete', description: 'Complete all system checks first.', variant: 'error' })
                          return
                        }
                        setExamStarted(true)
                      }}
                      disabled={!allChecksPassed}
                      className="gap-2 shadow-lg shadow-primary/25"
                    >
                      <Play className="h-4 w-4" />
                      Start Assessment
                    </Button>
                  </div>
                </div>
                {!allChecksPassed && (
                  <div className="mt-4 p-3 rounded-lg bg-warning/5 border border-warning/10 flex items-center gap-2 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    Complete all system checks to enable the start button
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    )
  }

  // ====== EXAM PHASE ======

  return (
    <PageTransition>
      {/* Fullscreen overlay */}
      <ProctoringOverlay state={proctorState} onRequestFullscreen={requestFullscreen} events={proctorState.events} />

      <div className="h-screen flex flex-col bg-[var(--color-background)]">
        {/* ===================== TOP HEADER ===================== */}
        <header className="flex-shrink-0 h-14 border-b border-border/30 bg-background/90 backdrop-blur-lg flex items-center px-5 gap-4 z-30">
          {/* Logo + Title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground tracking-widest hidden sm:inline">PLACEMUX</span>
            </div>
            <div className="w-px h-5 bg-border/40 hidden sm:block" />
            <h1 className="text-sm font-semibold truncate max-w-[280px]">{assessmentTitle}</h1>
          </div>

          {/* Security badges */}
          <div className="hidden md:flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium ${
              proctorState.violationCount === 0
                ? 'border-success/20 text-success bg-success/5'
                : 'border-destructive/20 text-destructive bg-destructive/5'
            }`}>
              <ShieldCheck className="h-3 w-3" />
              {proctorState.violationCount === 0 ? 'Secure' : `${proctorState.violationCount} issue(s)`}
            </div>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-medium ${
              proctorState.tabFocused
                ? 'border-success/20 text-success bg-success/5'
                : 'border-destructive/20 text-destructive bg-destructive/5'
            }`}>
              <Monitor className="h-3 w-3" />
              {proctorState.tabFocused ? 'Focused' : 'Away'}
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 font-mono text-sm font-bold ${timerClass} ${
            timeLeft < 60 ? 'animate-pulse' : ''
          }`}>
            <Clock className="h-3.5 w-3.5" />
            {formatTime(timeLeft)}
          </div>

          {/* Candidate */}
          <div className="flex items-center gap-2 pl-3 border-l border-border/30">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
              <User className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium truncate max-w-[100px]">{candidateName}</span>
          </div>

          {/* Toggle sidebar on mobile */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            {sidebarOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </header>

        {/* ===================== MAIN CONTENT ===================== */}
        <div className="flex-1 flex overflow-hidden">
          {/* ===== LEFT SIDEBAR ===== */}
          <aside className={`flex-shrink-0 border-r border-border/20 bg-muted/3 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? 'w-56 lg:w-60' : 'w-0 lg:w-0 overflow-hidden'
          } ${sidebarOpen ? 'block' : 'hidden lg:hidden'}`}>
            <div className="p-3 lg:p-4 space-y-3 lg:space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-muted/10">
                  <div className="text-lg font-bold text-success">{answeredCount}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Done</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/10">
                  <div className="text-lg font-bold text-muted-foreground">{unansweredCount}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Left</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/10">
                  <div className={`text-lg font-bold ${markedCount > 0 ? 'text-warning' : 'text-muted-foreground'}`}>{markedCount}</div>
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Review</div>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>

              {/* Question palette */}
              <div>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2.5">Questions</h3>
                <div className="grid grid-cols-5 gap-1.5">
                  {questions.map((q, idx) => {
                    const status = getQuestionStatus(q._id, idx)
                    return (
                      <button
                        key={q._id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-9 w-full rounded-md text-[11px] font-medium transition-all duration-150 ${
                          status === 'active'
                            ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 ring-1 ring-primary/30'
                            : status === 'answered-marked'
                              ? 'bg-success/10 text-success border border-success/30 ring-1 ring-success/20'
                              : status === 'answered'
                                ? 'bg-success/5 text-success border border-success/20'
                                : status === 'marked'
                                  ? 'bg-warning/10 text-warning border border-warning/30'
                                  : 'bg-muted/10 text-muted-foreground border border-border/20 hover:border-primary/40 hover:text-foreground'
                        }`}
                        title={`Q${idx + 1}${answers[q._id] !== undefined ? ' ✓' : ''}${markedForReview.has(q._id) ? ' ⚑' : ''}`}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-sm bg-success" />
                  Answered
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-sm bg-warning" />
                  Review
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-sm bg-muted-foreground/30" />
                  Unanswered
                </div>
              </div>

              {/* Jump to unanswered */}
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-1.5 text-[11px] h-8"
                onClick={() => {
                  const idx = questions.findIndex((q, i) => {
                    if (i <= currentIndex) return false
                    return answers[q._id] === undefined
                  })
                  const fallback = questions.findIndex(q => answers[q._id] === undefined)
                  const target = idx !== -1 ? idx : fallback
                  if (target !== -1) setCurrentIndex(target)
                  else addToast({ title: 'All Answered', description: 'All questions have been answered.', variant: 'info' })
                }}
              >
                <ListChecks className="h-3.5 w-3.5" />
                Jump to Unanswered
              </Button>
            </div>
          </aside>

          {/* ===== MAIN QUESTION AREA ===== */}
          <main className="flex-1 overflow-y-auto relative">
            <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 lg:py-8 space-y-5">
              {currentQuestion && (
                <>
                  {/* Question meta */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 gap-1.5 border-border/40 font-normal">
                        <HelpCircle className="h-3 w-3 text-primary" />
                        Question {currentIndex + 1} of {questions.length}
                      </Badge>
                      {answers[currentQuestion._id] !== undefined && (
                        <Badge variant="success" className="text-[10px] px-2 py-0.5 gap-1">
                          <CheckCircle className="h-2.5 w-2.5" />
                          Answered
                        </Badge>
                      )}
                      {markedForReview.has(currentQuestion._id) && (
                        <Badge variant="warning" className="text-[10px] px-2 py-0.5 gap-1">
                          <Flag className="h-2.5 w-2.5" />
                          For Review
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {currentQuestion.points || 1} pt{currentQuestion.points !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Question card */}
                  <div className="rounded-xl border border-border/30 bg-card shadow-sm shadow-black/5 overflow-hidden">
                    {/* Question text */}
                    <div className="px-6 pt-6 pb-5 border-b border-border/10">
                      <h2 className="text-lg font-semibold leading-relaxed text-foreground/90">
                        {currentQuestion.questionText}
                      </h2>
                    </div>

                    {/* Options */}
                    <div className="p-5 space-y-2.5">
                      {currentQuestion.options.map((option, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx)
                        const isSelected = answers[currentQuestion._id] === optIdx
                        return (
                          <button
                            key={optIdx}
                            onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion._id]: optIdx }))}
                            className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 group ${
                              isSelected
                                ? 'border-primary/60 bg-primary/[0.04] shadow-sm shadow-primary/5'
                                : 'border-border/20 bg-card hover:border-primary/30 hover:bg-muted/5'
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <div className={`flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-150 ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'bg-muted/20 text-muted-foreground group-hover:bg-muted/30'
                              }`}>
                                {letter}
                              </div>
                              <span className={`text-sm pt-0.5 leading-relaxed ${
                                isSelected ? 'text-foreground font-medium' : 'text-foreground/80'
                              }`}>
                                {option}
                              </span>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-1 ml-auto" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Mark for review & Navigation */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                        className="gap-1.5 h-9 text-xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Previous
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={isCurrentMarked ? 'default' : 'outline'}
                        size="sm"
                        onClick={toggleMarkForReview}
                        className={`gap-1.5 h-9 text-xs ${isCurrentMarked ? 'bg-warning text-warning-foreground hover:bg-warning/90 shadow-sm shadow-warning/20' : ''}`}
                      >
                        {isCurrentMarked ? (
                          <BookmarkCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5" />
                        )}
                        {isCurrentMarked ? 'Marked' : 'Mark for Review'}
                      </Button>

                      {isLastQuestion ? (
                        <Button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="gap-1.5 h-9 text-xs shadow-lg shadow-primary/20"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit'}
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                          className="gap-1.5 h-9 text-xs"
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Last question notice */}
                  {isLastQuestion && (
                    <div className="p-4 rounded-xl border border-success/20 bg-success/[0.03] flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Last question.</span> Review all answers before submitting.
                        </p>
                      </div>
                      <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="gap-1.5 text-xs">
                        {isSubmitting ? '...' : 'Submit'} <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* ===== FLOATING CAMERA WIDGET (Right side overlay) ===== */}
          <div className={`fixed bottom-4 right-4 z-40 transition-all duration-300 hidden md:block ${
            cameraMinimized ? 'w-12 h-12' : 'w-48'
          }`}>
            <div className={`rounded-xl overflow-hidden border border-border/20 bg-card shadow-xl shadow-black/20 ${
              cameraMinimized ? 'h-12' : ''
            }`}>
              {/* Header bar */}
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-muted/10 border-b border-border/10">
                {!cameraMinimized && (
                  <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${proctorState.cameraEnabled ? 'bg-success animate-pulse' : 'bg-destructive'}`} />
                    <span className="text-[9px] font-medium text-muted-foreground tracking-wide">CAMERA</span>
                  </div>
                )}
                <button
                  onClick={() => setCameraMinimized(!cameraMinimized)}
                  className="ml-auto h-5 w-5 rounded-md flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  {cameraMinimized ? (
                    <Camera className="h-3 w-3 text-primary" />
                  ) : (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
              </div>
              {/* Video */}
              {!cameraMinimized && (
                <CameraPreview
                  stream={mediaStreamRef.current || proctorState.mediaStream}
                  cameraEnabled={proctorState.cameraEnabled}
                  micEnabled={proctorState.micEnabled}
                  onVideoState={setLaptopVideoState}
                  className="h-28 rounded-none border-0"
                />
              )}
            </div>
          </div>

          {/* ===== COMPACT STATUS INDICATOR (bottom-left) ===== */}
          <div className="fixed bottom-4 left-4 z-40 hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card/80 backdrop-blur-md border border-border/20 shadow-sm text-[10px] text-muted-foreground">
            <div className={`h-1.5 w-1.5 rounded-full ${proctorState.cameraEnabled ? 'bg-success' : 'bg-destructive'}`} />
            <span>CAM</span>
            <div className={`h-1.5 w-1.5 rounded-full ${proctorState.micEnabled ? 'bg-success' : 'bg-destructive'}`} />
            <span>MIC</span>
            <div className={`h-1.5 w-1.5 rounded-full ${proctorState.tabFocused ? 'bg-success' : 'bg-destructive'}`} />
            <span>FOCUS</span>
            {proctorState.violationCount > 0 && (
              <>
                <div className="w-px h-3 bg-border/40 mx-0.5" />
                <AlertTriangle className="h-3 w-3 text-destructive" />
                <span className="text-destructive font-medium">{proctorState.violationCount}</span>
              </>
            )}
          </div>

          {/* ===== MOBILE BOTTOM NAV ===== */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-border/20 bg-background/95 backdrop-blur-lg flex items-center justify-around px-3 z-30">
            <Button variant="outline" size="sm" onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))} disabled={currentIndex === 0} className="gap-1 text-[11px] h-8 px-2.5">
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <span className="text-xs font-mono font-bold">{formatTime(timeLeft)}</span>
            <Button size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} variant="outline" className="gap-1 text-[11px] h-8 px-2.5">
              <ListChecks className="h-3.5 w-3.5" /> {answeredCount}/{questions.length}
            </Button>
            {isLastQuestion ? (
              <Button size="sm" onClick={handleSubmit} disabled={isSubmitting} className="gap-1 text-[11px] h-8 px-2.5">
                Submit <Send className="h-3 w-3" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))} className="gap-1 text-[11px] h-8 px-2.5">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

