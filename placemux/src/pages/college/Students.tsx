import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { collegeService } from '@/services/college'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, TrendingUp, Users, Award, User, Briefcase, ClipboardCheck, HandshakeIcon, ScrollText, ExternalLink, Mail, Phone } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function CollegeStudents() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [students, setStudents] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchStudents = async () => {
    try {
      const result = await collegeService.getStudents({ limit: 100 })
      setStudents(result.data || [])
      setTotal(result.pagination?.total || 0)
    } catch (err: any) {
      setPageError(err?.response?.data?.error?.message || 'Failed to load students')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { fetchStudents() }, [])

  const handleRowClick = async (student: any) => {
    setDetailLoading(true)
    setShowDetail(true)
    try {
      const detail = await collegeService.getStudentDetail(student._id)
      setSelectedStudent(detail)
    } catch {
      setSelectedStudent(null)
    } finally {
      setDetailLoading(false)
    }
  }

  if (pageLoading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={fetchStudents} /></PageTransition>

  const placedCount = students.filter((s: any) => s.placed).length

  return (
    <main className="space-y-8" aria-label="Student tracking">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Student Tracking</h1><p className="text-muted-foreground mt-1">Monitor student placement progress</p></div>
      </div>

      <section aria-label="Student statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Tracked</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><TrendingUp className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{placedCount}</p><p className="text-xs text-muted-foreground">Placed</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><GraduationCap className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{total - placedCount}</p><p className="text-xs text-muted-foreground">Not Placed</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Award className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{total > 0 ? Math.round((placedCount / total) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Placement %</p></CardContent></Card>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle id="students-title">Student Records</CardTitle></CardHeader>
        <CardContent aria-labelledby="students-title">
          {students.length === 0 ? (
            <EmptyState icon={User} title="No students found" description="No students are currently enrolled" />
          ) : (
            <DataTable
              data={students}
              columns={[
                { key: 'name', header: 'Name', sortable: true, render: (s: any) => <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">{(s.name||'?').split(' ').map((n:string)=>n[0]).join('')}</div><span className="font-medium">{s.name}</span></div> },
                { key: 'course', header: 'Course' },
                { key: 'year', header: 'Year' },
                { key: 'placed', header: 'Status', render: (s: any) => <Badge variant={s.placed?'success':'warning'}>{s.placed?'Placed':'Searching'}</Badge> },
                { key: 'placedAt', header: 'Company', render: (s: any) => <span className={s.placedAt ? '' : 'text-muted-foreground'}>{s.placedAt || '-'}</span> },
                { key: 'applicationCount', header: 'Apps', render: (s: any) => <Badge variant="info">{s.applicationCount}</Badge> },
                { key: 'interviewCount', header: 'Interviews', render: (s: any) => <Badge variant="warning">{s.interviewCount}</Badge> },
                { key: 'profileCompleted', header: 'Profile', render: (s: any) => <span>{s.profileCompleted}%</span> },
              ]}
              searchable searchPlaceholder="Search students..."
              onRowClick={handleRowClick}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.student?.name || 'Student Details'}</DialogTitle>
            <DialogDescription>Complete profile and placement information</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading student details...</div>
          ) : selectedStudent ? (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="applications">Applications ({selectedStudent.applications?.length || 0})</TabsTrigger>
                <TabsTrigger value="assessments">Assessments ({selectedStudent.assessments?.length || 0})</TabsTrigger>
                <TabsTrigger value="interviews">Interviews ({selectedStudent.interviews?.length || 0})</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium flex items-center gap-1"><Mail className="h-3 w-3" />{selectedStudent.student?.email || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Phone</p><p className="font-medium flex items-center gap-1"><Phone className="h-3 w-3" />{selectedStudent.student?.phone || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Course</p><p className="font-medium">{selectedStudent.student?.course || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Year</p><p className="font-medium">{selectedStudent.student?.year || 'N/A'}</p></div>
                  <div><p className="text-sm text-muted-foreground">Profile Completed</p><p className="font-medium">{selectedStudent.student?.profileCompleted || 0}%</p></div>
                </div>
                {selectedStudent.student?.bio && <div><p className="text-sm text-muted-foreground">Bio</p><p className="text-sm">{selectedStudent.student.bio}</p></div>}
                <div className="flex gap-2">
                  {selectedStudent.student?.resumeUrl && <a href={selectedStudent.student.resumeUrl} target="_blank" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Resume</a>}
                  {selectedStudent.student?.linkedinUrl && <a href={selectedStudent.student.linkedinUrl} target="_blank" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" /> LinkedIn</a>}
                  {selectedStudent.student?.portfolioUrl && <a href={selectedStudent.student.portfolioUrl} target="_blank" className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Portfolio</a>}
                </div>
              </TabsContent>

              <TabsContent value="applications" className="space-y-3">
                {selectedStudent.applications?.length > 0 ? selectedStudent.applications.map((app: any) => (
                  <div key={app._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20">
                    <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{app.jobId?.title || 'N/A'}</p><p className="text-xs text-muted-foreground">{app.jobId?.companyId?.companyName || ''}</p></div></div>
                    <Badge variant={app.status === 'Accepted' ? 'success' : app.status === 'Rejected' ? 'destructive' : app.status === 'Shortlisted' ? 'warning' : 'info'}>{app.status}</Badge>
                  </div>
                )) : <EmptyState icon={Briefcase} title="No applications" description="Student hasn't applied to any jobs yet" />}
              </TabsContent>

              <TabsContent value="assessments" className="space-y-3">
                {selectedStudent.assessments?.length > 0 ? selectedStudent.assessments.map((a: any) => (
                  <div key={a._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20">
                    <div className="flex items-center gap-3"><ClipboardCheck className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{a.assessmentTitle || a.assessmentId?.title || 'N/A'}</p><p className="text-xs text-muted-foreground">{a.assessmentType || a.assessmentId?.type || ''}</p></div></div>
                    <div className="text-right"><p className="font-bold">{a.percentage}%</p><Badge variant={a.passed ? 'success' : 'destructive'}>{a.grade || (a.passed ? 'Pass' : 'Fail')}</Badge></div>
                  </div>
                )) : <EmptyState icon={ClipboardCheck} title="No assessments" description="Student hasn't completed any assessments yet" />}
              </TabsContent>

              <TabsContent value="interviews" className="space-y-3">
                {selectedStudent.interviews?.length > 0 ? selectedStudent.interviews.map((i: any) => (
                  <div key={i._id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20">
                    <div className="flex items-center gap-3"><HandshakeIcon className="h-4 w-4 text-muted-foreground" /><div><p className="font-medium">{i.jobId?.title || i.jobTitle} at {i.companyId?.companyName}</p><p className="text-xs text-muted-foreground">{i.date ? new Date(i.date).toLocaleDateString() : ''} {i.time}</p></div></div>
                    <Badge variant={i.status === 'Completed' ? 'success' : i.status === 'Cancelled' ? 'destructive' : 'warning'}>{i.status}</Badge>
                  </div>
                )) : <EmptyState icon={HandshakeIcon} title="No interviews" description="Student hasn't had any interviews yet" />}
              </TabsContent>

              <TabsContent value="skills" className="space-y-3">
                {selectedStudent.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.skills.map((s: any, i: number) => (
                      <Badge key={i} variant={s.level === 'Expert' ? 'success' : s.level === 'Advanced' ? 'info' : s.level === 'Intermediate' ? 'warning' : 'secondary'} className="px-3 py-1">
                        {s.name} - {s.level}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={ScrollText} title="No skills" description="Student hasn't added any skills yet" />
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-12 text-center text-muted-foreground">Failed to load student details</div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
