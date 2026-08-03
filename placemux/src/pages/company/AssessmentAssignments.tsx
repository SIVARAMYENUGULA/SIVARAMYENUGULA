import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { assignmentService, type AssignmentRecord } from '@/services/assignment'
import { assessmentService } from '@/services/assessment'
import { applicationService } from '@/services/application'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ClipboardCheck, Users, UserPlus, Loader2, CheckCircle2, Clock, Play, History } from 'lucide-react'

export function AssessmentAssignments() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  const [selectedAssessmentId, setSelectedAssessmentId] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [deadline, setDeadline] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [assignData, assessData, appsData] = await Promise.all([
        assignmentService.getCompanyAssignments(),
        assessmentService.getAll(),
        applicationService.getAll(),
      ])
      setAssignments(assignData)
      setAssessments(assessData)
      setCandidates(appsData)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load data')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchData} /></PageTransition>

  const statusCounts = {
    assigned: assignments.filter(a => a.status === 'assigned').length,
    in_progress: assignments.filter(a => a.status === 'in_progress').length,
    completed: assignments.filter(a => a.status === 'completed').length,
    expired: assignments.filter(a => a.status === 'expired').length,
  }

  const handleAssign = async () => {
    if (!selectedAssessmentId || selectedStudentIds.length === 0) {
      addToast({ title: 'Validation', description: 'Select an assessment and at least one candidate', variant: 'error' })
      return
    }
    setIsAssigning(true)
    try {
      await assignmentService.assign(selectedAssessmentId, selectedStudentIds, deadline || undefined)
      addToast({ title: 'Success', description: `Assessment assigned to ${selectedStudentIds.length} candidate(s)`, variant: 'success' })
      setShowAssignModal(false)
      setSelectedAssessmentId('')
      setSelectedStudentIds([])
      setDeadline('')
      fetchData()
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to assign', variant: 'error' })
    } finally { setIsAssigning(false) }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    )
  }

  const selectAll = () => {
    const allIds = candidates.map(c => c.studentId).filter(Boolean)
    setSelectedStudentIds(prev => prev.length === allIds.length ? [] : allIds)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info' | 'secondary'> = {
      assigned: 'info',
      in_progress: 'warning',
      completed: 'success',
      expired: 'secondary',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>
  }

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assessment Assignment Center</h1>
          <p className="text-muted-foreground mt-1">Assign assessments to candidates and track progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/company/assessment-create')}>
            <ClipboardCheck className="h-4 w-4 mr-2" /> Create New
          </Button>
          <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => setShowAssignModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" /> Assign Assessment
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{assignments.length}</p><p className="text-xs text-muted-foreground">Total Assigned</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{statusCounts.assigned}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Play className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{statusCounts.in_progress}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{statusCounts.completed}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Assignment History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No assignments yet" description="Assign an assessment to a candidate to get started" action={{ label: 'Assign Now', onClick: () => setShowAssignModal(true) }} />
          ) : (
            <DataTable data={assignments} columns={[
              { key: 'student', header: 'Candidate', sortable: true, render: (a: any) => {
                const name = a.studentId?.userId?.name || 'Unknown'
                const email = a.studentId?.userId?.email || ''
                return <div><p className="font-medium text-sm">{name}</p><p className="text-xs text-muted-foreground">{email}</p></div>
              }},
              { key: 'assessment', header: 'Assessment', render: (a: any) => <span>{a.assessmentId?.title || 'Unknown'}</span> },
              { key: 'status', header: 'Status', render: (a: any) => getStatusBadge(a.status) },
              { key: 'deadline', header: 'Deadline', render: (a: any) => <span className="text-xs">{a.deadline ? new Date(a.deadline).toLocaleDateString() : 'No deadline'}</span> },
              { key: 'assignedAt', header: 'Assigned', render: (a: any) => <span className="text-xs">{new Date(a.assignedAt).toLocaleDateString()}</span> },
            ]} searchable searchPlaceholder="Search assignments..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Assign Assessment</DialogTitle></DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Select Assessment *</Label>
              <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an assessment..." />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.title} ({a.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deadline (optional)</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Candidates * ({selectedStudentIds.length} selected)</Label>
                <Button variant="ghost" size="sm" className="text-xs" onClick={selectAll}>
                  {selectedStudentIds.length === candidates.filter(c => c.studentId).length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="max-h-64 overflow-y-auto border rounded-xl divide-y divide-border/30">
                {candidates.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">No candidates available. Candidates appear when students apply to your jobs.</p>
                ) : (
                  candidates.map((c: any) => (
                    <label key={c.id} className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/10 transition-colors ${selectedStudentIds.includes(c.studentId) ? 'bg-primary/5' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(c.studentId)}
                        onChange={() => toggleStudentSelection(c.studentId)}
                        className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary/30"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{c.candidateName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{c.candidateEmail} {c.jobTitle ? `\u00b7 ${c.jobTitle}` : ''}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{c.status}</Badge>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={isAssigning || !selectedAssessmentId || selectedStudentIds.length === 0} className="bg-gradient-to-r from-primary to-purple-500">
                {isAssigning ? <><Loader2 className="h-4 w-4 animate-spin" /> Assigning...</> : <><UserPlus className="h-4 w-4 mr-2" /> Assign to {selectedStudentIds.length} Candidate(s)</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
