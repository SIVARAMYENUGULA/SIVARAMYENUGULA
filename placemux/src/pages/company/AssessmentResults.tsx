import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { assessmentService } from '@/services/assessment'
import { useToast } from '@/hooks/use-toast'
import { Download, Award, TrendingUp, Users, ClipboardCheck } from 'lucide-react'

export function AssessmentResults() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const { addToast } = useToast()

  const fetchResults = async () => {
    try {
      setLoading(true)
      const res = await assessmentService.getCompanyResults()
      setData(res)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load assessment results')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchResults() }, [])

  const handleExport = () => {
    if (!data?.results?.length) { addToast({ title: 'No data', description: 'No assessment results to export', variant: 'info' }); return }
    const csv = ['Student,Email,Assessment,Score %,Grade,Passed', ...data.results.map((r: any) => `"${r.studentName}","${r.studentEmail}","${r.assessmentTitle}",${r.percentage},"${r.grade}",${r.passed ? 'Yes' : 'No'}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'assessment-results.csv'; link.click()
    URL.revokeObjectURL(link.href)
    addToast({ title: 'Exported', description: 'Assessment results CSV downloaded', variant: 'success' })
  }

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchResults} /></PageTransition>

  const summary = data?.summary || { totalStudents: 0, passedCount: 0, passRate: 0, avgScore: 0 }
  const results = data?.results || []

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Assessment Results</h1><p className="text-muted-foreground mt-1">View candidate assessment scores and rankings</p></div>
        <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{summary.totalStudents}</p><p className="text-xs text-muted-foreground">Candidates Assessed</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Award className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{summary.passRate}%</p><p className="text-xs text-muted-foreground">Pass Rate</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><TrendingUp className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{summary.avgScore}%</p><p className="text-xs text-muted-foreground">Average Score</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><ClipboardCheck className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{summary.passedCount}</p><p className="text-xs text-muted-foreground">Passed</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Candidate Rankings</CardTitle></CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No results yet" description="Assessment results will appear as candidates complete their assessments" />
          ) : (
            <DataTable data={results} columns={[
              { key: 'studentName', header: 'Candidate', sortable: true, render: (r: any) => <span className="font-medium">{r.studentName}</span> },
              { key: 'studentEmail', header: 'Email' },
              { key: 'assessmentTitle', header: 'Assessment' },
              { key: 'percentage', header: 'Score', sortable: true, render: (r: any) => <Badge variant={r.percentage >= 80 ? 'success' : r.percentage >= 60 ? 'warning' : 'destructive'}>{r.percentage}%</Badge> },
              { key: 'grade', header: 'Grade', render: (r: any) => <Badge variant="info">{r.grade}</Badge> },
              { key: 'passed', header: 'Status', render: (r: any) => <Badge variant={r.passed ? 'success' : 'destructive'}>{r.passed ? 'Passed' : 'Failed'}</Badge> },
              { key: 'completedAt', header: 'Date', render: (r: any) => <span className="text-xs">{r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '-'}</span> },
            ]} searchable searchPlaceholder="Search candidates..." />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
