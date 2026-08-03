import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { applicationService } from '@/services/application'
import { assignmentService } from '@/services/assignment'
import { BarChartWidget } from '@/components/ui/chart'
import { Progress } from '@/components/ui/progress'
import { Star, Award, Download, Users as UsersIcon, Loader2, User, Briefcase, ClipboardCheck, HandshakeIcon, Mail, Phone, ExternalLink, ScrollText, BarChart3, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import type { Application } from '@/types'

const STATUS_OPTIONS = ['Applied', 'Shortlisted', 'Assessment Assigned', 'Interview', 'Offered', 'Accepted', 'Rejected'] as const

export function CompanyCandidates() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [applications, setApplications] = useState<any[]>([])
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({})
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [candidateAssessments, setCandidateAssessments] = useState<any[]>([])
  const [candidateAssessmentsLoading, setCandidateAssessmentsLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await applicationService.getAll()
        setApplications(data)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load candidates')
      } finally { setPageLoading(false) }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => setPageError(null)} /></PageTransition>

  const handleRowClick = async (app: any) => {
    setSelectedApp(app)
    setShowDetail(true)
    setCandidateAssessments([])
    if (app.studentId) {
      setCandidateAssessmentsLoading(true)
      try {
        const data = await assignmentService.getCandidateAssessments(app.studentId)
        setCandidateAssessments(data)
      } catch { /* assessments not available */ }
      setCandidateAssessmentsLoading(false)
    }
  }

  const handleStatusChange = async (appId: string, newStatus: string) => {
    setUpdatingStatus(prev => ({ ...prev, [appId]: true }))
    try {
      await applicationService.updateStatus(appId, newStatus)
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
      if (selectedApp?.id === appId) setSelectedApp((prev: any) => prev ? { ...prev, status: newStatus } : prev)
      addToast({ title: 'Status Updated', description: `Changed to ${newStatus}`, variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to update status', variant: 'error' })
    } finally { setUpdatingStatus(prev => ({ ...prev, [appId]: false })) }
  }

  const skillData = applications.reduce<Record<string, number>>((acc, app) => {
    const skill = app.jobTitle.split(' ').slice(0, 2).join(' ')
    acc[skill] = (acc[skill] || 0) + 1; return acc
  }, {})
  const skillChartData = Object.entries(skillData).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([skill, count]) => ({ skill, demand: count, supply: Math.round(count * 0.7) }))

  return (
    <main className="space-y-8" aria-label="Candidate search">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Applications</h1><p className="text-muted-foreground mt-1">Review applicants for your job postings</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" aria-label="Export data"><Download className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </div>

      <section aria-label="Statistics" className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><UsersIcon className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{applications.length}</p><p className="text-xs text-muted-foreground">Total Applicants</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Award className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{applications.filter(a => a.status === 'Shortlisted' || a.status === 'Interview' || a.status === 'Offered' || a.status === 'Accepted').length}</p><p className="text-xs text-muted-foreground">Advanced</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Star className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{applications.filter(a => a.status === 'Applied').length}</p><p className="text-xs text-muted-foreground">New</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Briefcase className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{new Set(applications.map(a => a.jobTitle)).size}</p><p className="text-xs text-muted-foreground">Positions</p></CardContent></Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle id="candidates-title">Applicants</CardTitle></CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <EmptyState icon={UsersIcon} title="No applications yet" description="Applications will appear here once students apply to your jobs" />
              ) : (
                <DataTable data={applications} columns={[
                  { key: 'candidateName', header: 'Candidate', sortable: true, render: (a: any) => <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">{(a.candidateName || '?').split(' ').map((n: string) => n[0]).join('')}</div><div><p className="text-sm font-medium">{a.candidateName || 'Anonymous'}</p><p className="text-xs text-muted-foreground">{a.candidateEmail || ''}</p></div></div> },
                  { key: 'jobTitle', header: 'Position' },
                  { key: 'status', header: 'Status', render: (a: any) => <Badge variant={a.status === 'Accepted' ? 'success' : a.status === 'Rejected' ? 'destructive' : a.status === 'Interview' || a.status === 'Offered' ? 'info' : 'warning'}>{a.status}</Badge> },
                  { key: 'appliedAt', header: 'Applied', render: (a: any) => <span className="text-xs">{a.appliedAt}</span> },
                  { key: 'actions', header: '', render: (a: any) => <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <select value={a.status} onChange={e => handleStatusChange(a.id, e.target.value)} disabled={updatingStatus[a.id]} className="h-8 text-xs rounded-lg border border-border/50 bg-background px-2">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {updatingStatus[a.id] && <Loader2 className="h-3 w-3 animate-spin" />}
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => handleRowClick(a)}>View</Button>
                  </div> },
                ]} searchable searchPlaceholder="Search applicants..." onRowClick={handleRowClick} />
              )}
            </CardContent>
          </Card>
        </section>
        <aside>
          <Card>
            <CardHeader><CardTitle>Applications by Position</CardTitle></CardHeader>
            <CardContent>
              {skillChartData.length > 0 ? <BarChartWidget data={skillChartData} bars={[{ dataKey: 'demand', name: 'Count', color: '#6c5ce7' }]} xKey="skill" height={280} />
                : <EmptyState icon={UsersIcon} title="No data yet" className="py-8" />}
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedApp?.candidateName || 'Candidate Details'}</DialogTitle></DialogHeader>
          {selectedApp && (
            <Tabs defaultValue="overview">
              <TabsList className="flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assessments">Assessments ({candidateAssessments.length})</TabsTrigger>
                <TabsTrigger value="status">Status History</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{selectedApp.candidateName || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium flex items-center gap-1"><Mail className="h-3 w-3" />{selectedApp.candidateEmail || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Position</p><p className="font-medium">{selectedApp.jobTitle || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Company</p><p className="font-medium">{selectedApp.company || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Applied</p><p className="font-medium">{selectedApp.appliedAt || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Current Status</p><Badge variant={selectedApp.status === 'Accepted' ? 'success' : selectedApp.status === 'Rejected' ? 'destructive' : 'info'}>{selectedApp.status}</Badge></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedApp.id, 'Shortlisted')} disabled={selectedApp.status === 'Shortlisted'}>Shortlist</Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(selectedApp.id, 'Interview')} disabled={selectedApp.status === 'Interview'}>Move to Interview</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleStatusChange(selectedApp.id, 'Rejected')} disabled={selectedApp.status === 'Rejected'}>Reject</Button>
                </div>
              </TabsContent>
              <TabsContent value="assessments" className="space-y-4">
                {candidateAssessmentsLoading ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : candidateAssessments.length === 0 ? (
                  <EmptyState icon={ClipboardCheck} title="No assessments assigned" description="Assign assessments from the Assessment Center" />
                ) : (
                  <div className="space-y-3">
                    {candidateAssessments.map((a: any) => (
                      <div key={a.assessmentId} className="p-4 rounded-lg border border-border/30 hover:border-primary/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{a.assessmentTitle}</p>
                            <p className="text-xs text-muted-foreground">{a.assessmentType}</p>
                          </div>
                          <Badge variant={a.status === 'completed' ? 'success' : a.status === 'in_progress' ? 'warning' : a.status === 'expired' ? 'secondary' : 'info'}>
                            {a.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {a.percentage !== null && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Score</span>
                              <span className="font-medium">{a.percentage}% ({a.score}/{a.maxScore})</span>
                            </div>
                            <Progress value={a.percentage} className="h-1.5" />
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Grade: <span className="font-medium">{a.grade || '-'}</span></span>
                              <span>Percentile: <span className="font-medium">{a.percentile !== null ? `${a.percentile}th` : '-'}</span></span>
                              {a.completedAt && <span><Clock className="h-3 w-3 inline mr-1" />{new Date(a.completedAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        )}
                        {a.deadline && a.status !== 'completed' && (
                          <p className="text-xs text-destructive mt-2">Deadline: {new Date(a.deadline).toLocaleDateString()}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="status">
                <p className="text-sm text-muted-foreground">Status updated to {selectedApp.status} on {selectedApp.updatedAt || selectedApp.appliedAt}</p>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
