import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { useConfirm } from '@/components/shared/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Clock, CheckCircle, Plus, Star, Handshake, X, Loader2, AlertTriangle, ExternalLink, CalendarClock } from 'lucide-react'
import { interviewService } from '@/services/interview'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import type { Interview } from '@/types'
import * as Dialog from '@radix-ui/react-dialog'

export function CompanyInterviews() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [isScheduling, setIsScheduling] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [reschedulingInterview, setReschedulingInterview] = useState<Interview | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completingInterview, setCompletingInterview] = useState<Interview | null>(null)
  const [completeRating, setCompleteRating] = useState(0)
  const [completeFeedback, setCompleteFeedback] = useState('')
  const [isCompleting, setIsCompleting] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const { addToast } = useToast()
  const { confirm, ConfirmDialog: DeleteConfirm } = useConfirm()

  const [scheduleForm, setScheduleForm] = useState({
    candidateEmail: '', candidateName: '', jobTitle: '', date: '', time: '',
    duration: '60', type: 'Technical' as Interview['type'], notes: '', meetingLink: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await interviewService.getAll()
        setInterviews(data)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load interviews')
      } finally { setPageLoading(false) }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => setPageError(null)} /></PageTransition>

  const upcoming = interviews.filter(i => i.status === 'Scheduled')
  const completed = interviews.filter(i => i.status === 'Completed')
  const avgRating = completed.length > 0 ? (completed.reduce((a, i) => a + (i.rating || 0), 0) / completed.length).toFixed(1) : '0'

  const handleFormChange = (field: string, value: any) => setScheduleForm(prev => ({ ...prev, [field]: value }))

  const handleSubmitSchedule = async () => {
    if (!scheduleForm.candidateName || !scheduleForm.date || !scheduleForm.time) {
      addToast({ title: 'Missing Fields', description: 'Please fill in all required fields', variant: 'error' }); return
    }
    setIsScheduling(true)
    try {
      const data = await interviewService.schedule({
        candidateName: scheduleForm.candidateName, candidateEmail: scheduleForm.candidateEmail,
        jobTitle: scheduleForm.jobTitle, date: scheduleForm.date, time: scheduleForm.time,
        duration: parseInt(scheduleForm.duration), type: scheduleForm.type,
        notes: scheduleForm.notes, meetingLink: scheduleForm.meetingLink,
      } as any)
      setInterviews(prev => [data, ...prev])
      setShowScheduleModal(false)
      addToast({ title: 'Interview Scheduled!', variant: 'success' })
      setScheduleForm({ candidateEmail: '', candidateName: '', jobTitle: '', date: '', time: '', duration: '60', type: 'Technical', notes: '', meetingLink: '' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to schedule', variant: 'error' })
    } finally { setIsScheduling(false) }
  }

  const handleCancel = async (interview: Interview) => {
    const confirmed = await confirm('Cancel Interview', `Cancel interview with ${interview.candidate}?`)
    if (!confirmed) return
    setActionLoading(prev => ({ ...prev, ['cancel-' + interview.id]: true }))
    try {
      await interviewService.cancel(interview.id)
      setInterviews(prev => prev.map(i => i.id === interview.id ? { ...i, status: 'Cancelled' } : i))
      addToast({ title: 'Cancelled', variant: 'info' })
    } catch { addToast({ title: 'Error', variant: 'error' }) }
    setActionLoading(prev => ({ ...prev, ['cancel-' + interview.id]: false }))
  }

  const handleReschedule = (interview: Interview) => {
    setReschedulingInterview(interview)
    setRescheduleDate(interview.date)
    setRescheduleTime(interview.time)
    setShowRescheduleModal(true)
  }

  const handleSubmitReschedule = async () => {
    if (!reschedulingInterview || !rescheduleDate || !rescheduleTime) return
    setActionLoading(prev => ({ ...prev, ['reschedule-' + reschedulingInterview.id]: true }))
    try {
      await interviewService.update(reschedulingInterview.id, { date: rescheduleDate, time: rescheduleTime, status: 'Rescheduled' })
      setInterviews(prev => prev.map(i => i.id === reschedulingInterview.id ? { ...i, date: rescheduleDate, time: rescheduleTime, status: 'Rescheduled' } : i))
      setShowRescheduleModal(false)
      addToast({ title: 'Rescheduled', description: 'Interview rescheduled successfully', variant: 'success' })
    } catch { addToast({ title: 'Error', variant: 'error' }) }
    setActionLoading(prev => ({ ...prev, ['reschedule-' + reschedulingInterview.id]: false }))
  }

  const openCompleteModal = (interview: Interview) => {
    setCompletingInterview(interview); setCompleteRating(0); setCompleteFeedback(''); setShowCompleteModal(true)
  }

  const handleComplete = async () => {
    if (!completingInterview || completeRating === 0) { addToast({ title: 'Rating Required', variant: 'error' }); return }
    setIsCompleting(true)
    try {
      await interviewService.update(completingInterview.id, { status: 'Completed', rating: completeRating, feedback: completeFeedback })
      setInterviews(prev => prev.map(i => i.id === completingInterview.id ? { ...i, status: 'Completed', rating: completeRating, feedback: completeFeedback } : i))
      setShowCompleteModal(false)
      addToast({ title: 'Completed', variant: 'success' })
    } catch { addToast({ title: 'Error', variant: 'error' }) }
    setIsCompleting(false)
  }

  return (
    <main className="space-y-8">
      <DeleteConfirm />
      {/* Schedule Modal */}
      <Dialog.Root open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-2xl border border-border/50 z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold">Schedule Interview</Dialog.Title>
              <Dialog.Close className="h-8 w-8 rounded-lg hover:bg-muted/20 flex items-center justify-center"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Candidate Name *</label><input type="text" value={scheduleForm.candidateName} onChange={e => handleFormChange('candidateName', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Candidate Email</label><input type="email" value={scheduleForm.candidateEmail} onChange={e => handleFormChange('candidateEmail', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Job Title</label><input type="text" value={scheduleForm.jobTitle} onChange={e => handleFormChange('jobTitle', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1.5">Date *</label><input type="date" value={scheduleForm.date} onChange={e => handleFormChange('date', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                <div><label className="block text-sm font-medium mb-1.5">Time *</label><input type="time" value={scheduleForm.time} onChange={e => handleFormChange('time', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Meeting Link</label><input type="url" value={scheduleForm.meetingLink} onChange={e => handleFormChange('meetingLink', e.target.value)} placeholder="https://meet.google.com/..." className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1.5">Duration</label><select value={scheduleForm.duration} onChange={e => handleFormChange('duration', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background"><option value="30">30 min</option><option value="45">45 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">2 hrs</option></select></div>
                <div><label className="block text-sm font-medium mb-1.5">Type</label><select value={scheduleForm.type} onChange={e => handleFormChange('type', e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background"><option value="Technical">Technical</option><option value="HR">HR</option><option value="Cultural">Cultural</option><option value="Final">Final</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-1.5">Notes</label><textarea value={scheduleForm.notes} onChange={e => handleFormChange('notes', e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background resize-none" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/30">
              <Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close>
              <Button onClick={handleSubmitSchedule} disabled={isScheduling || !scheduleForm.candidateName || !scheduleForm.date || !scheduleForm.time} className="bg-gradient-to-r from-primary to-purple-500 text-white">
                {isScheduling ? <><Loader2 className="h-4 w-4 animate-spin" /> Scheduling...</> : <><Calendar className="h-4 w-4" /> Schedule</>}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Reschedule Modal */}
      <Dialog.Root open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border/50 z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold">Reschedule Interview</Dialog.Title>
              <Dialog.Close className="h-8 w-8 rounded-lg hover:bg-muted/20 flex items-center justify-center"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Rescheduling interview with <strong>{reschedulingInterview?.candidate}</strong></p>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">New Date</label><input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
              <div><label className="block text-sm font-medium mb-1.5">New Time</label><input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/30">
              <Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close>
              <Button onClick={handleSubmitReschedule} disabled={!rescheduleDate || !rescheduleTime} className="bg-gradient-to-r from-primary to-purple-500 text-white"><CalendarClock className="h-4 w-4 mr-2" /> Reschedule</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Complete Modal */}
      <Dialog.Root open={showCompleteModal} onOpenChange={setShowCompleteModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border/50 z-50 p-6">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold">Complete Interview</Dialog.Title>
              <Dialog.Close className="h-8 w-8 rounded-lg hover:bg-muted/20 flex items-center justify-center"><X className="h-4 w-4" /></Dialog.Close>
            </div>
            <p className="text-center text-sm text-muted-foreground mb-4">Rate interview with <strong>{completingInterview?.candidate}</strong></p>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => setCompleteRating(star)} className="p-1 transition-all hover:scale-110"><Star className={`h-8 w-8 ${star <= completeRating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} /></button>)}
            </div>
            <div className="mb-6"><label className="block text-sm font-medium mb-1.5">Feedback</label><textarea value={completeFeedback} onChange={e => setCompleteFeedback(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background resize-none" /></div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
              <Dialog.Close asChild><Button variant="outline">Cancel</Button></Dialog.Close>
              <Button onClick={handleComplete} disabled={isCompleting || completeRating === 0} className="bg-gradient-to-r from-primary to-purple-500 text-white">
                {isCompleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><CheckCircle className="h-4 w-4" /> Mark Complete</>}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Interview Management</h1><p className="text-muted-foreground mt-1">Schedule and manage candidate interviews</p></div>
        <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => setShowScheduleModal(true)}><Plus className="h-4 w-4 mr-2" /> Schedule Interview</Button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Calendar className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{interviews.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{upcoming.length}</p><p className="text-xs text-muted-foreground">Upcoming</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" /><p className="text-2xl font-bold">{avgRating}</p><p className="text-xs text-muted-foreground">Avg Rating</p></CardContent></Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Upcoming Interviews</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {upcoming.length === 0 ? <EmptyState icon={Handshake} title="No upcoming interviews" action={{ label: 'Schedule', onClick: () => setShowScheduleModal(true) }} />
              : upcoming.map((interview) => (
                <div key={interview.id} className="flex items-center gap-4 p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all group">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20"><AvatarFallback className="bg-primary/10 text-primary text-xs">{interview.candidate.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{interview.candidate}</p><p className="text-xs text-muted-foreground truncate">{interview.jobTitle}</p></div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{interview.date}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{interview.time}</div>
                    {interview.meetingLink && <a href={interview.meetingLink} target="_blank" className="flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" /> Join</a>}
                  </div>
                  <Badge variant="info" className="text-[10px] flex-shrink-0">{interview.type}</Badge>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="outline" className="h-8 text-xs text-info" onClick={() => handleReschedule(interview)} disabled={actionLoading['reschedule-' + interview.id]}>
                      {actionLoading['reschedule-' + interview.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarClock className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-success" onClick={() => openCompleteModal(interview)}><CheckCircle className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs text-destructive" onClick={() => handleCancel(interview)} disabled={actionLoading['cancel-' + interview.id]}>
                      {actionLoading['cancel-' + interview.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <AlertTriangle className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Completed Interviews</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {completed.length === 0 ? <EmptyState icon={CheckCircle} title="No completed interviews" />
              : completed.map((interview) => (
                <div key={interview.id} className="p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px]">{interview.candidate.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                      <div><p className="text-sm font-medium">{interview.candidate}</p><p className="text-xs text-muted-foreground">{interview.jobTitle}</p></div>
                    </div>
                    <div className="flex items-center gap-1">{Array.from({length:5}).map((_,i)=><Star key={i} className={`h-3 w-3 ${i < (interview.rating||0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />)}</div>
                  </div>
                  {interview.feedback && <p className="text-xs text-muted-foreground italic">&ldquo;{interview.feedback}&rdquo;</p>}
                  {interview.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {interview.notes}</p>}
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
