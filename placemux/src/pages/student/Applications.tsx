import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { PieChartWidget } from '@/components/ui/chart'
import { EmptyState } from '@/components/shared/empty-state'
import { FileText, CheckCircle, XCircle, TrendingUp, Eye, Building2, Send } from 'lucide-react'
import { applicationService } from '@/services/application'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import type { Application } from '@/types'

export function StudentApplications() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await applicationService.getAll()
        setApplications(data)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load applications')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => setPageError(null)} /></PageTransition>

  const activeCount = applications.filter(a => a.status === 'Accepted' || a.status === 'Interview').length
  const acceptedCount = applications.filter(a => a.status === 'Accepted').length
  const inProgressCount = applications.filter(a => a.status === 'Interview' || a.status === 'Shortlisted').length
  const rejectedCount = applications.filter(a => a.status === 'Rejected').length

  const statusDistribution = [
    { name: 'Interview', value: applications.filter(a => a.status === 'Interview').length, color: '#6c5ce7' },
    { name: 'Shortlisted', value: applications.filter(a => a.status === 'Shortlisted').length, color: '#a29bfe' },
    { name: 'Applied', value: applications.filter(a => a.status === 'Applied').length, color: '#74b9ff' },
    { name: 'Accepted', value: acceptedCount, color: '#00b894' },
    { name: 'Rejected', value: rejectedCount, color: '#e74c3c' },
  ].filter(d => d.value > 0)

  return (
    <main className="space-y-8" aria-label="My applications">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">My Applications</h1><p className="text-muted-foreground mt-1">Track and manage your job applications</p></div>
        <Badge variant="success" className="px-3 py-1.5" aria-label={`${activeCount} active applications`}><TrendingUp className="h-3.5 w-3.5 mr-1" /> {activeCount} Active</Badge>
      </div>

      <section aria-label="Application statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 text-center"><FileText className="h-8 w-8 text-primary mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{applications.length}</p><p className="text-xs text-muted-foreground">Total Applications</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 text-success mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{acceptedCount}</p><p className="text-xs text-muted-foreground">Accepted</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><TrendingUp className="h-8 w-8 text-info mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{inProgressCount}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><XCircle className="h-8 w-8 text-destructive mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{rejectedCount}</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label="Application tracker" className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle id="tracker-title">Application Tracker</CardTitle></CardHeader>
            <CardContent aria-labelledby="tracker-title">
              {applications.length === 0 ? (
                <EmptyState icon={Send} title="No applications yet" description="Start applying to jobs to see them here" />
              ) : (
                <DataTable data={applications} columns={[
                  {key:'jobTitle',header:'Position',sortable:true,render:(a: Application)=><div><p className="font-medium">{a.jobTitle}</p><p className="text-xs text-muted-foreground">{a.company}</p></div>},
                  {key:'company',header:'Company',render:(a: Application)=><span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />{a.company}</span>},
                  {key:'status',header:'Status',render:(a: Application)=><Badge variant={a.status==='Accepted'?'success':a.status==='Rejected'?'destructive':a.status==='Interview'?'info':'warning'}>{a.status}</Badge>},
                  {key:'appliedAt',header:'Applied',render:(a: Application)=><span className="text-xs">{a.appliedAt}</span>},
                  {key:'updatedAt',header:'Updated',render:(a: Application)=><span className="text-xs text-muted-foreground">{a.updatedAt}</span>},
                  {key:'actions',header:'',render:(a: Application)=><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/student/jobs/${a.jobId}`)} aria-label={`View ${a.jobTitle} details`}><Eye className="h-3.5 w-3.5" /></Button>},
                ]} searchable searchPlaceholder="Search applications..." />
              )}
            </CardContent>
          </Card>
        </section>
        <aside aria-label="Application insights" className="space-y-6">
          <Card><CardHeader><CardTitle id="status-dist-title">Status Distribution</CardTitle></CardHeader><CardContent aria-labelledby="status-dist-title">
            <PieChartWidget data={statusDistribution} height={200} innerRadius={50} />
          </CardContent></Card>
          <Card>
            <CardHeader><CardTitle id="app-activity-title">Quick Stats</CardTitle></CardHeader>
            <CardContent aria-labelledby="app-activity-title" className="space-y-3">
              <div className="flex justify-between text-sm p-2 rounded-lg bg-muted/20">
                <span className="text-muted-foreground">Success Rate</span>
                <span className="font-medium">{applications.length > 0 ? Math.round((acceptedCount / applications.length) * 100) : 0}%</span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg bg-muted/20">
                <span className="text-muted-foreground">Active Applications</span>
                <span className="font-medium">{activeCount}</span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg bg-muted/20">
                <span className="text-muted-foreground">Pending Response</span>
                <span className="font-medium">{applications.filter(a => a.status === 'Applied').length}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
