import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { LineChartWidget, BarChartWidget, PieChartWidget } from '@/components/ui/chart'
import { collegeService } from '@/services/college'
import { ChartNoAxesColumnIncreasing, DollarSign, Award, GraduationCap, Users, TrendingUp } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { ChartSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function CollegeAnalytics() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [salaryData, setSalaryData] = useState<any>(null)
  const [assessmentData, setAssessmentData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, salaryAnalytics, assessmentReports] = await Promise.all([
          collegeService.getAnalytics(),
          collegeService.getSalaryAnalytics().catch(() => null),
          collegeService.getAssessmentReports().catch(() => null),
        ])
        setAnalytics(analyticsData)
        setSalaryData(salaryAnalytics)
        setAssessmentData(assessmentReports)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load analytics')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><ChartSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const departmentData = analytics?.departmentData || []
  const trendData = analytics?.trendData || []
  const sectorData = analytics?.sectorData || []

  return (
    <main className="space-y-8" aria-label="Analytics">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Analytics</h1><p className="text-muted-foreground mt-1">Placement analytics and insights</p></div>
      </div>

      <Tabs defaultValue="placement">
        <TabsList>
          <TabsTrigger value="placement">Placement Analytics</TabsTrigger>
          <TabsTrigger value="salary">Salary Analytics</TabsTrigger>
          <TabsTrigger value="assessment">Assessment Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="placement" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle id="placement-trends-title">Application Trends</CardTitle></CardHeader>
              <CardContent aria-labelledby="placement-trends-title">
                {trendData.length > 0 ? (
                  <LineChartWidget data={trendData} lines={[{dataKey:'applications',name:'Applications',color:'#6c5ce7'},{dataKey:'shortlisted',name:'Shortlisted',color:'#a29bfe'}]} xKey="month" height={280} />
                ) : (
                  <EmptyState icon={ChartNoAxesColumnIncreasing} title="No trend data" description="Data will appear as students apply" className="py-12" />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle id="dept-perf-title">Department Performance</CardTitle></CardHeader>
              <CardContent aria-labelledby="dept-perf-title">
                {departmentData.length > 0 ? (
                  <BarChartWidget data={departmentData} bars={[{dataKey:'placed',name:'Placement %',color:'#6c5ce7'}]} xKey="name" height={280} />
                ) : (
                  <EmptyState icon={ChartNoAxesColumnIncreasing} title="No department data" description="Data will appear as students are placed" className="py-12" />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader><CardTitle id="sector-title">Placement by Sector</CardTitle></CardHeader>
              <CardContent aria-labelledby="sector-title">
                {sectorData.length > 0 ? (
                  <PieChartWidget data={sectorData} height={250} />
                ) : (
                  <EmptyState icon={ChartNoAxesColumnIncreasing} title="No sector data" description="Data will appear as students are placed" className="py-12" />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle id="key-metrics-title">Key Metrics</CardTitle></CardHeader>
              <CardContent aria-labelledby="key-metrics-title" className="space-y-4">
                {[
                  { label: 'Total Students', value: analytics?.totalStudents?.toString() || '0' },
                  { label: 'Students Placed', value: analytics?.placedCount?.toString() || '0' },
                  { label: 'Placement Rate', value: analytics?.placementRate + '%' || '0%' },
                  { label: 'Average Package', value: analytics?.averagePackage ? '₹' + (analytics.averagePackage / 100000).toFixed(1) + ' LPA' : 'N/A' },
                  { label: 'Highest Package', value: analytics?.highestPackage ? '₹' + (analytics.highestPackage / 100000).toFixed(1) + ' LPA' : 'N/A' },
                  { label: 'Lowest Package', value: analytics?.lowestPackage ? '₹' + (analytics.lowestPackage / 100000).toFixed(1) + ' LPA' : 'N/A' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 hover:bg-muted/10 transition-colors rounded-lg px-2 -mx-2">
                    <span className="text-sm">{m.label}</span>
                    <span className="font-bold">{m.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle id="department-list-title">Department Breakdown</CardTitle></CardHeader>
              <CardContent aria-labelledby="department-list-title" className="space-y-3">
                {departmentData.length === 0 ? (
                  <EmptyState icon={ChartNoAxesColumnIncreasing} title="No data" description="Department data will appear here" />
                ) : (
                  departmentData.map((d: any) => (
                    <div key={d.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/20">
                      <span className="text-sm font-medium">{d.name}</span>
                      <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{d.total} students</span><Badge variant={d.placed >= 90 ? 'success' : d.placed >= 70 ? 'warning' : 'destructive'}>{d.placed}%</Badge></div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="salary" className="space-y-6">
          {salaryData ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card><CardContent className="pt-6 text-center"><DollarSign className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">₹{(salaryData.averagePackage / 100000).toFixed(1)}L</p><p className="text-xs text-muted-foreground">Average Package</p></CardContent></Card>
                <Card><CardContent className="pt-6 text-center"><Award className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">₹{(salaryData.highestPackage / 100000).toFixed(1)}L</p><p className="text-xs text-muted-foreground">Highest Package</p></CardContent></Card>
                <Card><CardContent className="pt-6 text-center"><GraduationCap className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">₹{(salaryData.lowestPackage / 100000).toFixed(1)}L</p><p className="text-xs text-muted-foreground">Lowest Package</p></CardContent></Card>
                <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{salaryData.totalPlaced}</p><p className="text-xs text-muted-foreground">Total Placed</p></CardContent></Card>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Company-wise Package</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {salaryData.companyWise?.map((c: any) => (
                      <div key={c.companyName} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20">
                        <span className="font-medium">{c.companyName}</span>
                        <div className="flex items-center gap-3"><Badge variant="info">{c.count} students</Badge><span className="font-bold text-success">₹{(c.avgPackage / 100000).toFixed(1)}L</span></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Branch-wise Package</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {salaryData.branchWise?.map((b: any) => (
                      <div key={b.branch} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20">
                        <span className="font-medium">{b.branch}</span>
                        <div className="flex items-center gap-3"><Badge variant="info">{b.count} students</Badge><span className="font-bold text-success">₹{(b.avgPackage / 100000).toFixed(1)}L</span></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <EmptyState icon={DollarSign} title="No salary data yet" description="Salary analytics will appear as students get placed" />
          )}
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          {assessmentData ? (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card><CardContent className="pt-6 text-center"><ChartNoAxesColumnIncreasing className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{assessmentData.totalAssessments}</p><p className="text-xs text-muted-foreground">Total Assessments</p></CardContent></Card>
                <Card><CardContent className="pt-6 text-center"><Award className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{assessmentData.passRate}%</p><p className="text-xs text-muted-foreground">Pass Rate</p></CardContent></Card>
                <Card><CardContent className="pt-6 text-center"><TrendingUp className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{assessmentData.avgScore}%</p><p className="text-xs text-muted-foreground">Average Score</p></CardContent></Card>
                <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{assessmentData.passedCount}</p><p className="text-xs text-muted-foreground">Passed</p></CardContent></Card>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Top Performers</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {assessmentData.topPerformers?.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                          <div><p className="font-medium">{p.studentName}</p><p className="text-xs text-muted-foreground">{p.assessmentTitle}</p></div>
                        </div>
                        <div className="text-right"><p className="font-bold text-success">{p.percentage}%</p><Badge variant="info">{p.grade}</Badge></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Department Average Scores</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {assessmentData.deptAvgScores?.map((d: any) => (
                      <div key={d.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20">
                        <span className="font-medium">{d.name}</span>
                        <div className="flex items-center gap-3"><Badge variant="info">{d.count} students</Badge><span className="font-bold">{d.avgScore}%</span></div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <EmptyState icon={ChartNoAxesColumnIncreasing} title="No assessment data" description="Assessment reports will appear as students complete assessments" />
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
