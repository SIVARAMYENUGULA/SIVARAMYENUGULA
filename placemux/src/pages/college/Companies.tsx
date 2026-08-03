import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { collegeService } from '@/services/college'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Building2, Globe, MapPin, Briefcase, Users, TrendingUp, ExternalLink } from 'lucide-react'

export function CollegeCompanies() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any>(null)
  const [showDetail, setShowDetail] = useState(false)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const data = await collegeService.getCompanies()
      setCompanies(data || [])
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCompanies() }, [])

  const handleViewDetail = async (company: any) => {
    try {
      const data = await collegeService.getCompanyDetail(company._id)
      setSelectedCompany(data)
      setShowDetail(true)
    } catch {
      setSelectedCompany({ company: { _id: company._id, companyName: company.companyName, industry: company.industry, location: company.location, website: company.website, logoUrl: company.logoUrl }, jobs: [], applications: [], placedCount: 0, drives: [] })
      setShowDetail(true)
    }
  }

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchCompanies} /></PageTransition>

  const totalPlaced = companies.reduce((sum, c) => sum + (c.placed || 0), 0)

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Company Management</h1>
          <p className="text-muted-foreground mt-1">Track hiring companies and their engagement</p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Building2 className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{companies.length}</p><p className="text-xs text-muted-foreground">Partner Companies</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Briefcase className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{companies.reduce((s, c) => s + (c.activeJobs || 0), 0)}</p><p className="text-xs text-muted-foreground">Active Jobs</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{companies.reduce((s, c) => s + (c.applications || 0), 0)}</p><p className="text-xs text-muted-foreground">Total Applications</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><TrendingUp className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{totalPlaced}</p><p className="text-xs text-muted-foreground">Students Placed</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Hiring Companies</CardTitle></CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <EmptyState icon={Building2} title="No companies yet" description="Companies will appear here when students start applying to jobs" />
          ) : (
            <DataTable
              data={companies}
              columns={[
                { key: 'companyName', header: 'Company', sortable: true, render: (c: any) => <span className="font-medium">{c.companyName}</span> },
                { key: 'industry', header: 'Industry', render: (c: any) => <Badge variant="secondary">{c.industry || 'N/A'}</Badge> },
                { key: 'activeJobs', header: 'Active Jobs', render: (c: any) => <Badge variant="info">{c.activeJobs}</Badge> },
                { key: 'applications', header: 'Applications', sortable: true, render: (c: any) => <span>{c.applications}</span> },
                { key: 'placed', header: 'Placed', render: (c: any) => <Badge variant="success">{c.placed}</Badge> },
                { key: 'drives', header: 'Drives', render: (c: any) => <Badge variant="warning">{c.drives}</Badge> },
                { key: 'actions', header: '', render: (c: any) => <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetail(c) }}><ExternalLink className="h-3.5 w-3.5 mr-1" /> View</Button> },
              ]}
              searchable searchPlaceholder="Search companies..."
              onRowClick={(c) => handleViewDetail(c)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedCompany?.company?.companyName || 'Company Details'}</DialogTitle></DialogHeader>
          {selectedCompany && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Industry</p><p className="font-medium">{selectedCompany.company?.industry || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Location</p><p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedCompany.company?.location || 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Website</p><p className="font-medium flex items-center gap-1"><Globe className="h-3 w-3" />{selectedCompany.company?.website ? <a href={selectedCompany.company.website} target="_blank" className="text-primary hover:underline">{selectedCompany.company.website}</a> : 'N/A'}</p></div>
                <div><p className="text-sm text-muted-foreground">Students Placed</p><p className="font-medium text-success">{selectedCompany.placedCount || 0}</p></div>
              </div>
              {selectedCompany.company?.description && <p className="text-sm text-muted-foreground">{selectedCompany.company.description}</p>}

              {selectedCompany.jobs?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Jobs ({selectedCompany.jobs.length})</h4>
                  <div className="space-y-2">
                    {selectedCompany.jobs.map((j: any) => (
                      <div key={j._id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div><p className="font-medium">{j.title}</p><p className="text-xs text-muted-foreground">{j.type} - {j.location} | {j.skillsRequired?.join(', ')}</p></div>
                        <Badge variant={j.status === 'active' ? 'success' : 'secondary'}>{j.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCompany.drives?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Placement Drives ({selectedCompany.drives.length})</h4>
                  <div className="space-y-2">
                    {selectedCompany.drives.map((d: any) => (
                      <div key={d._id} className="flex items-center justify-between p-3 rounded-lg border">
                        <p className="font-medium">{d.name} - {d.jobId?.title}</p>
                        <Badge variant={d.status === 'published' ? 'success' : 'secondary'}>{d.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
