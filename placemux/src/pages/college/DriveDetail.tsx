import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { driveService } from '@/services/college'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Building2, Calendar, CheckCircle2, Users, Target, ArrowRight } from 'lucide-react'

export function DriveDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drive, setDrive] = useState<any>(null)

  const fetchDrive = async () => {
    if (!id) return
    try {
      setLoading(true)
      const data = await driveService.getById(id)
      setDrive(data)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load drive')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDrive() }, [id])

  const handleAdvanceStage = async () => {
    if (!id) return
    try {
      const res = await driveService.advanceStage(id)
      addToast({ title: 'Stage Advanced', description: res.message || 'Stage advanced', variant: 'success' })
      fetchDrive()
    } catch { addToast({ title: 'Error', description: 'Failed to advance stage', variant: 'error' }) }
  }

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchDrive} /></PageTransition>
  if (!drive) return null

  return (
    <main className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/college/drives')}><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{drive.name}</h1>
            <Badge variant={drive.status === 'published' ? 'success' : drive.status === 'draft' ? 'secondary' : 'default'}>{drive.status}</Badge>
          </div>
          <p className="text-muted-foreground">{drive.description}</p>
        </div>
        {(drive.status === 'published' || drive.status === 'in_progress') && drive.status !== 'completed' && (
          <Button onClick={handleAdvanceStage}><ArrowRight className="h-4 w-4 mr-2" /> Advance Stage</Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Company</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium text-lg">{drive.companyId?.companyName || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{drive.companyId?.industry} - {drive.companyId?.location}</p>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Job</CardTitle></CardHeader>
          <CardContent>
            <p className="font-medium text-lg">{drive.jobId?.title || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{drive.jobId?.type} | {drive.jobId?.location}</p>
            {drive.jobId?.salaryMin && <Badge variant="success" className="mt-2">{drive.jobId.salaryMin} - {drive.jobId.salaryMax} LPA</Badge>}
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Schedule</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">Start: {drive.startDate ? new Date(drive.startDate).toLocaleDateString() : 'TBD'}</p>
            <p className="text-sm">End: {drive.endDate ? new Date(drive.endDate).toLocaleDateString() : 'TBD'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{drive.registeredStudents?.length || 0}</p><p className="text-xs text-muted-foreground">Registered</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{drive.shortlistedStudents?.length || 0}</p><p className="text-xs text-muted-foreground">Shortlisted</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{drive.selectedStudents?.length || 0}</p><p className="text-xs text-muted-foreground">Selected</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Drive Stages</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {drive.stages?.map((stage: any, idx: number) => (
            <div key={stage.name} className={`flex items-center justify-between p-4 rounded-lg border ${stage.status === 'active' ? 'border-primary/50 bg-primary/5' : stage.status === 'completed' ? 'border-success/30 bg-success/5' : 'border-border/50'}`}>
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${stage.status === 'completed' ? 'bg-success/20 text-success' : stage.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{idx + 1}</div>
                <div><p className="font-medium">{stage.name}</p>{stage.completedAt && <p className="text-xs text-muted-foreground">Completed: {new Date(stage.completedAt).toLocaleDateString()}</p>}</div>
              </div>
              <Badge variant={stage.status === 'completed' ? 'success' : stage.status === 'active' ? 'default' : 'secondary'}>{stage.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Eligibility Criteria</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-muted-foreground">Min CGPA</p><p className="font-medium">{drive.eligibility?.minCgpa || 'Any'}</p></div>
            <div><p className="text-sm text-muted-foreground">Branches</p><p className="font-medium">{drive.eligibility?.branches?.length ? drive.eligibility.branches.join(', ') : 'All'}</p></div>
            <div><p className="text-sm text-muted-foreground">Skills</p><p className="font-medium">{drive.eligibility?.skills?.length ? drive.eligibility.skills.join(', ') : 'Any'}</p></div>
            <div><p className="text-sm text-muted-foreground">Only Unplaced</p><p className="font-medium">{drive.eligibility?.onlyUnplaced ? 'Yes' : 'No'}</p></div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
