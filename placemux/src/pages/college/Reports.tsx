import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { collegeService } from '@/services/college'
import { Download, FileText, Eye, Calendar, FileBarChart, GraduationCap, TrendingUp, Users, DollarSign } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

function exportCSV(headers: string[], rows: any[][], filename: string) {
  const csvContent = [headers.join(','), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function CollegeReports() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [salaryData, setSalaryData] = useState<any>(null)
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const [previewContent, setPreviewContent] = useState<string>('')
  const { addToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, salaryAnalytics, assessmentReports, studentData] = await Promise.all([
          collegeService.getAnalytics(),
          collegeService.getSalaryAnalytics().catch(() => null),
          collegeService.getAssessmentReports().catch(() => null),
          collegeService.getStudents({ limit: 100 }).then(r => r.data || []).catch(() => []),
        ])
        setAnalytics(analyticsData)
        setSalaryData(salaryAnalytics)
        setAssessmentData(assessmentReports)
        setStudents(studentData)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load reports')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const handleExportPlacement = () => {
    if (!students.length) { addToast({ title: 'No data', description: 'No student data to export', variant: 'info' }); return }
    exportCSV(
      ['Name', 'Email', 'Course', 'Year', 'Status', 'Company', 'Profile %'],
      students.map((s: any) => [s.name, s.email, s.course, s.year, s.placed ? 'Placed' : 'Searching', s.placedAt || '-', s.profileCompleted + '%']),
      'placement-report'
    )
    addToast({ title: 'Exported', description: 'Placement report CSV downloaded', variant: 'success' })
  }

  const handleExportSalary = () => {
    if (!salaryData) { addToast({ title: 'No data', description: 'No salary data to export', variant: 'info' }); return }
    exportCSV(
      ['Company', 'Students Placed', 'Average Package'],
      (salaryData.companyWise || []).map((c: any) => [c.companyName, c.count, '₹' + (c.avgPackage / 100000).toFixed(1) + 'L']),
      'salary-report'
    )
    addToast({ title: 'Exported', description: 'Salary report CSV downloaded', variant: 'success' })
  }

  const handleExportAssessment = () => {
    if (!assessmentData) { addToast({ title: 'No data', description: 'No assessment data to export', variant: 'info' }); return }
    exportCSV(
      ['Student Name', 'Assessment', 'Score %', 'Grade'],
      (assessmentData.topPerformers || []).map((p: any) => [p.studentName, p.assessmentTitle, p.percentage + '%', p.grade]),
      'assessment-report'
    )
    addToast({ title: 'Exported', description: 'Assessment report CSV downloaded', variant: 'success' })
  }

  const handleViewReport = (title: string, data: any[][], headers: string[]) => {
    const html = `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-family:monospace;font-size:12px">
      <thead style="background:#6c5ce7;color:white"><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${data.map(row => `<tr>${row.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`
    setPreviewContent(html)
    setShowPreview(title)
  }

  return (
    <main className="space-y-8" aria-label="Reports">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Reports</h1><p className="text-muted-foreground mt-1">Generate and download placement reports</p></div>
      </div>

      <Tabs defaultValue="placement">
        <TabsList>
          <TabsTrigger value="placement">Placement Reports</TabsTrigger>
          <TabsTrigger value="salary">Salary Reports</TabsTrigger>
          <TabsTrigger value="assessment">Assessment Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="placement" className="space-y-6">
          <section aria-label="Report categories">
            <div className="grid gap-4 md:grid-cols-4">
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-8 w-8 text-blue-400" /><div><p className="text-2xl font-bold">{students.length}</p><p className="text-xs text-muted-foreground">Students Tracked</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-green-400" /><div><p className="text-2xl font-bold">{analytics?.placementRate || 0}%</p><p className="text-xs text-muted-foreground">Placement Rate</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><GraduationCap className="h-8 w-8 text-purple-400" /><div><p className="text-2xl font-bold">{analytics?.placedCount || 0}</p><p className="text-xs text-muted-foreground">Students Placed</p></div></div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Calendar className="h-8 w-8 text-orange-400" /><div><p className="text-2xl font-bold">{analytics?.departmentData?.length || 0}</p><p className="text-xs text-muted-foreground">Departments</p></div></div></CardContent></Card>
            </div>
          </section>

          <Card>
            <CardHeader><CardTitle>Student Placement Report</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Button onClick={handleExportPlacement}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                <Button variant="outline" onClick={() => handleViewReport('Placement Report - Student List',
                  students.map((s: any) => [s.name, s.email, s.course, `Year ${s.year}`, s.placed ? 'Placed' : 'Searching', s.placedAt || '-', s.profileCompleted + '%']),
                  ['Name', 'Email', 'Course', 'Year', 'Status', 'Company', 'Profile %']
                )}><Eye className="h-4 w-4 mr-2" /> Preview</Button>
              </div>
              <DataTable data={students} columns={[
                { key: 'name', header: 'Name', sortable: true, render: (s: any) => <span className="font-medium">{s.name}</span> },
                { key: 'email', header: 'Email' },
                { key: 'course', header: 'Course' },
                { key: 'year', header: 'Year' },
                { key: 'placed', header: 'Status', render: (s: any) => <Badge variant={s.placed ? 'success' : 'warning'}>{s.placed ? 'Placed' : 'Searching'}</Badge> },
                { key: 'placedAt', header: 'Company' },
                { key: 'profileCompleted', header: 'Profile %' },
              ]} searchable searchPlaceholder="Search students..." />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          {salaryData ? (
            <Card>
              <CardHeader><CardTitle>Salary Report</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-4">
                  <Button onClick={handleExportSalary}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                  <Button variant="outline" onClick={() => handleViewReport('Salary Report - Company-wise',
                    (salaryData.companyWise || []).map((c: any) => [c.companyName, c.count, '₹' + (c.avgPackage / 100000).toFixed(1) + 'L']),
                    ['Company', 'Students Placed', 'Average Package']
                  )}><Eye className="h-4 w-4 mr-2" /> Preview</Button>
                </div>
                <DataTable data={salaryData.companyWise || []} columns={[
                  { key: 'companyName', header: 'Company', sortable: true, render: (c: any) => <span className="font-medium">{c.companyName}</span> },
                  { key: 'count', header: 'Students Placed', render: (c: any) => <Badge variant="info">{c.count}</Badge> },
                  { key: 'avgPackage', header: 'Average Package', render: (c: any) => <span className="font-bold text-success">₹{(c.avgPackage / 100000).toFixed(1)}L</span> },
                ]} />
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={DollarSign} title="No salary data" description="Salary reports will be available after placements" />
          )}
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          {assessmentData ? (
            <Card>
              <CardHeader><CardTitle>Assessment Report</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3 mb-4">
                  <Button onClick={handleExportAssessment}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
                  <Button variant="outline" onClick={() => handleViewReport('Assessment Report - Top Performers',
                    (assessmentData.topPerformers || []).map((p: any) => [p.studentName, p.assessmentTitle, p.percentage + '%', p.grade]),
                    ['Student Name', 'Assessment', 'Score %', 'Grade']
                  )}><Eye className="h-4 w-4 mr-2" /> Preview</Button>
                </div>
                <DataTable data={assessmentData.topPerformers || []} columns={[
                  { key: 'studentName', header: 'Student', sortable: true, render: (p: any) => <span className="font-medium">{p.studentName}</span> },
                  { key: 'assessmentTitle', header: 'Assessment' },
                  { key: 'percentage', header: 'Score', render: (p: any) => <Badge variant={p.percentage >= 80 ? 'success' : p.percentage >= 60 ? 'warning' : 'destructive'}>{p.percentage}%</Badge> },
                  { key: 'grade', header: 'Grade', render: (p: any) => <Badge variant="info">{p.grade}</Badge> },
                ]} />
              </CardContent>
            </Card>
          ) : (
            <EmptyState icon={FileBarChart} title="No assessment data" description="Assessment reports will be available after students complete assessments" />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>{showPreview}</DialogTitle></DialogHeader>
          <div className="overflow-auto" dangerouslySetInnerHTML={{ __html: previewContent }} />
        </DialogContent>
      </Dialog>
    </main>
  )
}
