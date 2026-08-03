import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { assignmentService, type AssignmentRecord } from '@/services/assignment'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PieChartWidget } from '@/components/ui/chart'
import { ClipboardCheck, Users, Clock, Play, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react'

export function AssessmentTracking() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const data = await assignmentService.getCompanyAssignments()
      setAssignments(data)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load tracking data')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchData} /></PageTransition>

  const assigned = assignments.filter(a => a.status === 'assigned')
  const inProgress = assignments.filter(a => a.status === 'in_progress')
  const completed = assignments.filter(a => a.status === 'completed')
  const expired = assignments.filter(a => a.status === 'expired')

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'info' | 'secondary'> = {
      assigned: 'info',
      in_progress: 'warning',
      completed: 'success',
      expired: 'secondary',
    }
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>
  }

  const pieData = [
    { name: 'Pending', value: assigned.length, color: '#3b82f6' },
    { name: 'In Progress', value: inProgress.length, color: '#f59e0b' },
    { name: 'Completed', value: completed.length, color: '#10b981' },
    { name: 'Expired', value: expired.length, color: '#6b7280' },
  ].filter(d => d.value > 0)

  const completionRate = assignments.length > 0 ? Math.round((completed.length / assignments.length) * 100) : 0

  const columns = [
    { key: 'student', header: 'Candidate', sortable: true, render: (a: any) => {
      const name = a.studentId?.userId?.name || 'Unknown'
      const email = a.studentId?.userId?.email || ''
      return <div><p className="font-medium text-sm">{name}</p><p className="text-xs text-muted-foreground">{email}</p></div>
    }},
    { key: 'assessment', header: 'Assessment', render: (a: any) => <span>{a.assessmentId?.title || 'Unknown'}</span> },
    { key: 'status', header: 'Status', render: (a: any) => getStatusBadge(a.status) },
    { key: 'deadline', header: 'Deadline', render: (a: any) => {
      if (!a.deadline) return <span className="text-xs">No deadline</span>
      const isOverdue = new Date(a.deadline) < new Date() && a.status !== 'completed'
      return <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : ''}`}>{new Date(a.deadline).toLocaleDateString()}{isOverdue ? ' (Overdue)' : ''}</span>
    }},
    { key: 'assignedAt', header: 'Assigned', render: (a: any) => <span className="text-xs">{new Date(a.assignedAt).toLocaleDateString()}</span> },
  ]

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Assessment Tracking</h1><p className="text-muted-foreground mt-1">Monitor candidate assessment progress in real-time</p></div>
        <Badge variant="info" className="px-4 py-2 text-sm"><TrendingUp className="h-4 w-4 mr-1" /> {completionRate}% Completion Rate</Badge>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{assignments.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{assigned.length}</p><p className="text-xs text-muted-foreground">Assigned</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Play className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{inProgress.length}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{completed.length}</p><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>All Assignments</CardTitle></CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <EmptyState icon={ClipboardCheck} title="No assignments" description="Assign assessments to candidates to track their progress" />
            ) : (
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All ({assignments.length})</TabsTrigger>
                  <TabsTrigger value="assigned">Assigned ({assigned.length})</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress ({inProgress.length})</TabsTrigger>
                  <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
                  <TabsTrigger value="expired">Expired ({expired.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <DataTable data={assignments} columns={columns} searchable searchPlaceholder="Search assignments..." />
                </TabsContent>
                <TabsContent value="assigned">
                  {assigned.length === 0 ? <EmptyState icon={Clock} title="No pending assignments" /> : <DataTable data={assigned} columns={columns} />}
                </TabsContent>
                <TabsContent value="in_progress">
                  {inProgress.length === 0 ? <EmptyState icon={Play} title="No in-progress assignments" /> : <DataTable data={inProgress} columns={columns} />}
                </TabsContent>
                <TabsContent value="completed">
                  {completed.length === 0 ? <EmptyState icon={CheckCircle2} title="No completed assignments" /> : <DataTable data={completed} columns={columns} />}
                </TabsContent>
                <TabsContent value="expired">
                  {expired.length === 0 ? <EmptyState icon={XCircle} title="No expired assignments" /> : <DataTable data={expired} columns={columns} />}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <EmptyState icon={AlertCircle} title="No data" className="py-12" />
            ) : (
              <PieChartWidget data={pieData} dataKey="value" nameKey="name" height={280} />
            )}
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-success/20 bg-success/[0.03]">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-success">{completed.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/[0.03]">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-warning">{inProgress.length}</p>
            <p className="text-xs text-muted-foreground mt-1">In Progress</p>
          </CardContent>
        </Card>
        <Card className="border-info/20 bg-info/[0.03]">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-info">{assigned.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending Start</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/[0.03]">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-destructive">{expired.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Expired</p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
