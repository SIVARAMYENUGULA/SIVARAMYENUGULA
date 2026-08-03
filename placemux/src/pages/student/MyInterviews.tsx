import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/empty-state'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import { interviewService } from '@/services/interview'
import { Calendar, Clock, CheckCircle, Handshake, Star, Video, ExternalLink, XCircle, CalendarClock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import type { Interview } from '@/types'

export function StudentMyInterviews() {
  const { addToast } = useToast()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [cancelTarget, setCancelTarget] = useState<Interview | null>(null)
  const [rescheduleTarget, setRescheduleTarget] = useState<Interview | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await interviewService.getAll()
        setInterviews(data)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load interviews')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => setPageError(null)} /></PageTransition>

  const upcoming = interviews.filter(i => i.status === 'Scheduled')
  const completed = interviews.filter(i => i.status === 'Completed')

  const handleCancel = async () => {
    if (!cancelTarget) return
    setSaving(true)
    try {
      await interviewService.update(cancelTarget.id, { status: 'Cancelled' })
      setInterviews(prev => prev.map(i => i.id === cancelTarget.id ? { ...i, status: 'Cancelled' as const } : i))
      addToast({ title: 'Interview Cancelled', description: 'Your interview has been cancelled', variant: 'success' })
      setCancelTarget(null)
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to cancel', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTime) return
    setSaving(true)
    try {
      const updated = await interviewService.update(rescheduleTarget.id, {
        date: rescheduleDate,
        time: rescheduleTime,
        status: 'Scheduled',
      })
      setInterviews(prev => prev.map(i => i.id === rescheduleTarget.id ? {
        ...i, date: rescheduleDate, time: rescheduleTime, status: 'Scheduled' as const
      } : i))
      addToast({ title: 'Rescheduled', description: 'Interview has been rescheduled', variant: 'success' })
      setRescheduleTarget(null)
      setRescheduleDate('')
      setRescheduleTime('')
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to reschedule', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="space-y-8" aria-label="My interviews">
      <div><h1 className="text-3xl font-bold">My Interviews</h1><p className="text-muted-foreground mt-1">Track your upcoming and completed interviews</p></div>

      <section aria-label="Interview statistics">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="pt-6 text-center"><Calendar className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{interviews.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{upcoming.length}</p><p className="text-xs text-muted-foreground">Upcoming</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming */}
        <Card>
          <CardHeader><CardTitle id="upcoming-title">Upcoming Interviews</CardTitle></CardHeader>
          <CardContent aria-labelledby="upcoming-title" className="space-y-4">
            {upcoming.length === 0 ? (
              <EmptyState icon={Handshake} title="No upcoming interviews" description="Your scheduled interviews will appear here" />
            ) : (
              upcoming.map((interview) => (
                <div key={interview.id} className="p-4 rounded-lg border border-border/30 hover:border-primary/30 hover:shadow-sm transition-all space-y-3">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{interview.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{interview.candidate}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{interview.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{interview.time}</span>
                      </div>
                    </div>
                    <Badge variant="info" className="text-[10px] flex-shrink-0">{interview.type}</Badge>
                  </div>

                  {/* Meeting link + actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {interview.meetingLink ? (
                      <Button size="sm" variant="default" className="gap-1.5 h-8 text-xs" onClick={() => window.open(interview.meetingLink, '_blank')}>
                        <Video className="h-3.5 w-3.5" />
                        Join Interview
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">No meeting link</Badge>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs ml-auto" onClick={() => {
                      setRescheduleTarget(interview)
                      setRescheduleDate(interview.date)
                      setRescheduleTime(interview.time)
                    }}>
                      <CalendarClock className="h-3.5 w-3.5" />
                      Reschedule
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs text-destructive hover:text-destructive hover:border-destructive/30" onClick={() => setCancelTarget(interview)}>
                      <XCircle className="h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>

                  {interview.notes && (
                    <p className="text-[11px] text-muted-foreground italic bg-muted/10 p-2 rounded-lg">
                      Note: {interview.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader><CardTitle id="completed-title">Completed Interviews</CardTitle></CardHeader>
          <CardContent aria-labelledby="completed-title" className="space-y-4">
            {completed.length === 0 ? (
              <EmptyState icon={CheckCircle} title="No completed interviews" description="Completed interviews with feedback will appear here" />
            ) : (
              completed.map((interview) => (
                <div key={interview.id} className="p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all hover:shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{interview.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{interview.candidate}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({length:5}).map((_,i) => (
                        <Star key={i} className={`h-3 w-3 ${i < (interview.rating||0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                  </div>
                  {interview.feedback && (
                    <p className="text-xs text-muted-foreground italic">&ldquo;{interview.feedback}&rdquo;</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Interview"
        message={`Are you sure you want to cancel your interview for "${cancelTarget?.jobTitle}"?`}
        confirmLabel={saving ? 'Cancelling...' : 'Cancel Interview'}
        variant="destructive"
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />

      {/* Reschedule dialog */}
      <Dialog open={!!rescheduleTarget} onOpenChange={(open) => { if (!open) { setRescheduleTarget(null); setRescheduleDate(''); setRescheduleTime('') } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Reschedule Interview
            </DialogTitle>
          </DialogHeader>
          {rescheduleTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Reschedule your interview for <span className="font-medium text-foreground">{rescheduleTarget.jobTitle}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="rescheduleDate">New Date</Label>
                <Input id="rescheduleDate" type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rescheduleTime">New Time</Label>
                <Input id="rescheduleTime" type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setRescheduleTarget(null); setRescheduleDate(''); setRescheduleTime('') }}>
                  Cancel
                </Button>
                <Button onClick={handleReschedule} disabled={saving || !rescheduleDate || !rescheduleTime}>
                  {saving ? 'Saving...' : 'Confirm Reschedule'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
