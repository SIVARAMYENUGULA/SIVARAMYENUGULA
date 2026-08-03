import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { driveService } from '@/services/college'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Briefcase, Plus, Rocket, ArrowRight, CheckCircle2,
  Building2, Users, Target, ListChecks
} from 'lucide-react'

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  draft: 'secondary', published: 'success', in_progress: 'warning', completed: 'default', cancelled: 'destructive',
}

export function CollegeDrives() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drives, setDrives] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [selectedDrive, setSelectedDrive] = useState<any>(null)
  const [showEligible, setShowEligible] = useState(false)
  const [eligibleData, setEligibleData] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '', description: '', companyId: '', jobId: '',
    eligibility: { branches: [] as string[], skills: [] as string[], minCgpa: 0, graduationYears: [] as number[], onlyUnplaced: false },
  })

  const fetchDrives = async () => {
    try {
      setLoading(true)
      const data = await driveService.getAll()
      setDrives(data || [])
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load drives')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDrives() }, [])

  const handlePublish = async (id: string) => {
    try {
      const res = await driveService.publish(id)
      addToast({ title: 'Drive Published', description: res.message || 'Drive published successfully', variant: 'success' })
      fetchDrives()
    } catch { addToast({ title: 'Error', description: 'Failed to publish drive', variant: 'error' }) }
  }

  const handleAdvanceStage = async (id: string) => {
    try {
      const res = await driveService.advanceStage(id)
      addToast({ title: 'Stage Advanced', description: res.message || 'Stage advanced successfully', variant: 'success' })
      fetchDrives()
    } catch { addToast({ title: 'Error', description: 'Failed to advance stage', variant: 'error' }) }
  }

  const handleViewEligible = async (drive: any) => {
    try {
      const data = await driveService.getEligibleStudents(drive._id)
      setEligibleData(data)
      setSelectedDrive(drive)
      setShowEligible(true)
    } catch { addToast({ title: 'Error', description: 'Failed to load eligible students', variant: 'error' }) }
  }

  const handleRegister = async (driveId: string) => {
    if (!eligibleData) return
    const eligibleIds = eligibleData.students?.filter((s: any) => s.eligible).map((s: any) => s.student._id) || []
    if (eligibleIds.length === 0) {
      addToast({ title: 'No Students', description: 'No eligible students to register', variant: 'info' })
      return
    }
    try {
      const res = await driveService.registerStudents(driveId, eligibleIds)
      addToast({ title: 'Registered', description: res.message || `${eligibleIds.length} students registered`, variant: 'success' })
      setShowEligible(false)
      fetchDrives()
    } catch { addToast({ title: 'Error', description: 'Failed to register students', variant: 'error' }) }
  }

  const handleCreate = async () => {
    if (!formData.name || !formData.companyId || !formData.jobId) {
      addToast({ title: 'Validation Error', description: 'Name, Company, and Job are required', variant: 'error' })
      return
    }
    try {
      const res = await driveService.create(formData)
      addToast({ title: 'Drive Created', description: res.message || 'Drive created successfully', variant: 'success' })
      setShowCreate(false)
      setFormData({ name: '', description: '', companyId: '', jobId: '', eligibility: { branches: [], skills: [], minCgpa: 0, graduationYears: [], onlyUnplaced: false } })
      fetchDrives()
    } catch { addToast({ title: 'Error', description: 'Failed to create drive', variant: 'error' }) }
  }

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchDrives} /></PageTransition>

  const stats = {
    total: drives.length,
    published: drives.filter(d => d.status === 'published' || d.status === 'in_progress').length,
    draft: drives.filter(d => d.status === 'draft').length,
    completed: drives.filter(d => d.status === 'completed').length,
  }

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Drive Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage placement drives</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Drive
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Briefcase className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Drives</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Rocket className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.published}</p><p className="text-xs text-muted-foreground">Active / Published</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Target className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{stats.draft}</p><p className="text-xs text-muted-foreground">Drafts</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><CheckCircle2 className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.completed}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>All Placement Drives</CardTitle></CardHeader>
        <CardContent>
          {drives.length === 0 ? (
            <EmptyState icon={ListChecks} title="No drives yet" description="Create your first placement drive to get started" action={{ label: 'Create Drive', onClick: () => setShowCreate(true) }} />
          ) : (
            <DataTable
              data={drives}
              columns={[
                { key: 'name', header: 'Drive Name', sortable: true, render: (d: any) => <span className="font-medium">{d.name}</span> },
                { key: 'company', header: 'Company', render: (d: any) => <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{d.company?.companyName || 'N/A'}</div> },
                { key: 'job', header: 'Job', render: (d: any) => <span>{d.job?.title || 'N/A'}</span> },
                { key: 'registeredCount', header: 'Registered', render: (d: any) => <Badge variant="info">{d.registeredCount}</Badge> },
                { key: 'shortlistedCount', header: 'Shortlisted', render: (d: any) => <Badge variant="warning">{d.shortlistedCount}</Badge> },
                { key: 'selectedCount', header: 'Selected', render: (d: any) => <Badge variant="success">{d.selectedCount}</Badge> },
                { key: 'status', header: 'Status', render: (d: any) => <Badge variant={statusColors[d.status] || 'default'}>{d.status}</Badge> },
                { key: 'actions', header: '', render: (d: any) => (
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    {d.status === 'draft' && <Button variant="ghost" size="sm" onClick={() => handlePublish(d._id)}><Rocket className="h-3.5 w-3.5 mr-1" /> Publish</Button>}
                    {(d.status === 'published' || d.status === 'in_progress') && d.status !== 'completed' && <Button variant="ghost" size="sm" onClick={() => handleAdvanceStage(d._id)}><ArrowRight className="h-3.5 w-3.5 mr-1" /> Next Stage</Button>}
                    <Button variant="ghost" size="sm" onClick={() => handleViewEligible(d)}><Users className="h-3.5 w-3.5 mr-1" /> Eligible</Button>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/college/drives/${d._id}`)}>View</Button>
                  </div>
                )},
              ]}
              searchable searchPlaceholder="Search drives..."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Create Placement Drive</DialogTitle><DialogDescription>Set up a new placement drive with company, job, and eligibility criteria</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Drive Name</label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Tech Company Campus Drive 2026" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <textarea className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Drive description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Company ID</label>
                <Input value={formData.companyId} onChange={e => setFormData({ ...formData, companyId: e.target.value })} placeholder="Company Object ID" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Job ID</label>
                <Input value={formData.jobId} onChange={e => setFormData({ ...formData, jobId: e.target.value })} placeholder="Job Object ID" />
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Eligibility Criteria</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Min CGPA</label>
                  <Input type="number" min={0} max={10} step={0.1} value={formData.eligibility.minCgpa} onChange={e => setFormData({ ...formData, eligibility: { ...formData.eligibility, minCgpa: parseFloat(e.target.value) || 0 } })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={formData.eligibility.onlyUnplaced} onChange={e => setFormData({ ...formData, eligibility: { ...formData.eligibility, onlyUnplaced: e.target.checked } })} />
                  <label className="text-sm">Only unplaced students</label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={handleCreate}>Create Drive</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showEligible} onOpenChange={setShowEligible}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Eligible Students - {selectedDrive?.name}</DialogTitle></DialogHeader>
          {eligibleData && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="success" className="text-sm px-3 py-1">{eligibleData.eligible} Eligible</Badge>
                <Badge variant="secondary" className="text-sm px-3 py-1">{eligibleData.total} Total</Badge>
              </div>
              <div className="space-y-2">
                {eligibleData.students?.map((item: any) => (
                  <div key={item.student._id} className={`flex items-center justify-between p-3 rounded-lg border ${item.eligible ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
                    <div>
                      <p className="font-medium">{item.student.name}</p>
                      <p className="text-xs text-muted-foreground">{item.student.course} - Year {item.student.year}</p>
                    </div>
                    <div className="text-right">
                      {item.eligible ? <Badge variant="success">Eligible</Badge> : <Badge variant="destructive">{item.reasons?.[0] || 'Ineligible'}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowEligible(false)}>Close</Button>
                <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => handleRegister(selectedDrive?._id)} disabled={eligibleData.eligible === 0}>
                  <Users className="h-4 w-4 mr-2" /> Register {eligibleData.eligible} Eligible Students
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
