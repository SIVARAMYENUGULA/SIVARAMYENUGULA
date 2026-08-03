import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { EmptyState } from '@/components/shared/empty-state'
import { applicationService } from '@/services/application'
import { interviewService } from '@/services/interview'
import { assessmentService } from '@/services/assessment'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Loader2, Users, ArrowRight, XCircle } from 'lucide-react'

const STAGES = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-500', statuses: ['Applied'] },
  { id: 'shortlisted', label: 'Shortlisted', color: 'bg-purple-500', statuses: ['Shortlisted'] },
  { id: 'assessment', label: 'Assessment', color: 'bg-yellow-500', statuses: ['Assessment Assigned', 'Assessment Completed'] },
  { id: 'interview', label: 'Interview', color: 'bg-orange-500', statuses: ['Interview'] },
  { id: 'offered', label: 'Offered', color: 'bg-green-500', statuses: ['Offered'] },
  { id: 'accepted', label: 'Accepted', color: 'bg-primary', statuses: ['Accepted'] },
  { id: 'rejected', label: 'Rejected', color: 'bg-destructive', statuses: ['Rejected'] },
] as const

export function CompanyPipeline() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { addToast } = useToast()

  const fetchData = async () => {
    try {
      setLoading(true)
      const [apps, interviewsData] = await Promise.all([
        applicationService.getAll(),
        interviewService.getAll(),
      ])
      setApplications(apps)
      setInterviews(interviewsData)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load pipeline data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const stageData = useMemo(() => {
    return STAGES.map(stage => ({
      ...stage,
      items: applications.filter((a: any) => stage.statuses.includes(a.status)),
      count: applications.filter((a: any) => stage.statuses.includes(a.status)).length,
    }))
  }, [applications])

  const handleAdvance = async (app: any) => {
    setUpdatingId(app.id)
    try {
      const currentStageIdx = STAGES.findIndex(s => s.statuses.includes(app.status))
      if (currentStageIdx < 0) { setUpdatingId(null); return }
      const currentStage = STAGES[currentStageIdx]
      const currentStatusIdx = currentStage.statuses.indexOf(app.status)
      // If there's a next status in the same stage, advance within stage first
      if (currentStatusIdx >= 0 && currentStatusIdx < currentStage.statuses.length - 1) {
        const nextStatus = currentStage.statuses[currentStatusIdx + 1]
        await applicationService.updateStatus(app.id, nextStatus)
        setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: nextStatus } : a))
        addToast({ title: 'Advanced', description: `Moved to ${nextStatus}`, variant: 'success' })
        setUpdatingId(null); return
      }
      // Move to next stage
      if (currentStageIdx >= STAGES.length - 2) { setUpdatingId(null); return }
      const nextStage = STAGES[currentStageIdx + 1]
      const nextStatus = nextStage.statuses[0]
      if (nextStatus === 'Offered') {
        addToast({ title: 'Create Offer', description: 'Go to Offer Management to create an offer', variant: 'info' })
        setUpdatingId(null); return
      }
      await applicationService.updateStatus(app.id, nextStatus)
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: nextStatus } : a))
      addToast({ title: 'Advanced', description: `Moved to ${nextStage.label}`, variant: 'success' })
    } catch { addToast({ title: 'Error', description: 'Failed to advance stage', variant: 'error' }) }
    setUpdatingId(null)
  }

  const handleReject = async (app: any) => {
    setUpdatingId(app.id)
    try {
      await applicationService.updateStatus(app.id, 'Rejected')
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'Rejected' } : a))
      addToast({ title: 'Rejected', description: 'Application moved to Rejected', variant: 'info' })
    } catch { addToast({ title: 'Error', description: 'Failed to reject', variant: 'error' }) }
    setUpdatingId(null)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="text-center py-20 text-destructive">{error}</div>

  const total = applications.length
  const stageCounts = stageData.map(s => ({ label: s.label, count: s.count, color: s.color }))

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Hiring Pipeline</h1><p className="text-muted-foreground mt-1">{total} total candidates in pipeline</p></div>
      </div>

      <section className="grid gap-4 md:grid-cols-7">
        {stageCounts.map((s) => (
          <Card key={s.label} className="hover:border-primary/30 transition-all">
            <CardContent className="pt-4 text-center">
              <div className={`h-2 w-full rounded-full mb-3 ${s.color}`} />
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stageData.map((stage) => (
          <Card key={stage.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                  {stage.label}
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">{stage.count}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 min-h-[200px]">
              {stage.items.length === 0 ? (
                <EmptyState icon={Users} title="No candidates" description={`No candidates in ${stage.label}`} className="py-8" />
              ) : (
                stage.items.map((app: any) => (
                  <motion.div key={app.id} layout className="rounded-lg border border-border/30 bg-muted/10 p-3 hover:border-primary/30 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-purple-500 text-white">
                          {(app.candidateName || '?').split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{app.candidateName || 'Anonymous'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{app.jobTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {stage.id !== 'accepted' && stage.id !== 'rejected' && stage.id !== 'offered' && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleAdvance(app)} disabled={updatingId === app.id}>
                          {updatingId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3 mr-1" />}Advance
                        </Button>
                      )}
                      {stage.id !== 'rejected' && stage.id !== 'accepted' && (
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-destructive" onClick={() => handleReject(app)} disabled={updatingId === app.id}>
                          <XCircle className="h-3 w-3 mr-1" />Reject
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
