import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { MapPin, Briefcase, Bookmark, Building2, Heart, Star } from 'lucide-react'
import { jobService } from '@/services/job'

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import type { Job } from '@/types'

export function StudentJobs() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [savedJobs, setSavedJobs] = useState<Job[]>([])
  const { addToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allJobs, recommended] = await Promise.all([
          jobService.getAll({ status: 'active' }),
          jobService.getRecommended(),
        ])
        setJobs(recommended.length > 0 ? recommended : allJobs)
        setSavedJobs(allJobs.slice(0, 2))
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load jobs')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => setPageError(null)} /></PageTransition>

  const companies = new Set(jobs.map(j => j.company))

  const handleApply = (jobId: string) => {
    navigate(`/student/jobs/${jobId}`)
  }

  const handleSave = (job: Job) => {
    if (savedJobs.find(j => j.id === job.id)) {
      setSavedJobs(prev => prev.filter(j => j.id !== job.id))
      addToast({ title: 'Job Unsaved', description: `${job.title} removed from saved`, variant: 'info' })
    } else {
      setSavedJobs(prev => [...prev, job])
      addToast({ title: 'Job Saved', description: `${job.title} has been saved`, variant: 'success' })
    }
  }

  return (
    <main className="space-y-8" aria-label="Job recommendations">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Job Recommendations</h1><p className="text-muted-foreground mt-1">AI-matched opportunities based on your skills</p></div>
        <Badge variant="info" className="px-3 py-1.5" aria-label={`${jobs.length} job matches`}><Star className="h-3.5 w-3.5 mr-1" /> {jobs.length} matches</Badge>
      </div>

      <section aria-label="Job statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 text-center"><Briefcase className="h-8 w-8 text-primary mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{jobs.length}</p><p className="text-xs text-muted-foreground">Recommended</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Building2 className="h-8 w-8 text-success mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{companies.size}</p><p className="text-xs text-muted-foreground">Companies</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><MapPin className="h-8 w-8 text-warning mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{new Set(jobs.map(j=>j.location)).size}</p><p className="text-xs text-muted-foreground">Locations</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Bookmark className="h-8 w-8 text-info mx-auto mb-2" aria-hidden="true" /><p className="text-2xl font-bold">{savedJobs.length}</p><p className="text-xs text-muted-foreground">Saved</p></CardContent></Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section aria-label="Recommended jobs" className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle id="recommended-title">Recommended for You</CardTitle></CardHeader>
            <CardContent aria-labelledby="recommended-title">
              {jobs.length === 0 ? (
                <EmptyState icon={Briefcase} title="No jobs available" description="There are no job recommendations right now" />
              ) : (
                <DataTable data={jobs} columns={[
                  {key:'title',header:'Position',sortable:true,render:(j: any)=><div><p className="font-medium">{j.title}</p><p className="text-xs text-muted-foreground">{j.company}</p></div>},
                  {key:'location',header:'Location',render:(j: any)=><span className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" aria-hidden="true" />{j.location}</span>},
                  {key:'salary',header:'Salary',render:(j: any)=><span className="font-medium text-success text-xs">{j.salary}</span>},
                  {key:'type',header:'Type',render:(j: any)=><Badge variant="info" className="text-[10px]">{j.type}</Badge>},
                  {key:'actions',header:'',render:(j: any)=><div className="flex gap-1"><Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleApply(j.id)} aria-label={`Apply to ${j.title}`}>Apply</Button><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSave(j)} aria-label={`Save ${j.title}`}><Heart className={`h-3.5 w-3.5 ${savedJobs.find(s => s.id === j.id) ? 'fill-red-500 text-red-500' : ''}`} /></Button></div>},
                ]} />
              )}
            </CardContent>
          </Card>
        </section>
        <aside aria-label="Saved jobs and skills" className="space-y-4">
          <Card>
            <CardHeader><CardTitle id="saved-jobs-title">Saved Jobs</CardTitle></CardHeader>
            <CardContent aria-labelledby="saved-jobs-title" className="space-y-3">
              {savedJobs.length === 0 ? (
                <EmptyState icon={Bookmark} title="No saved jobs" description="Save jobs to apply later" />
              ) : (
                savedJobs.map((j) => (
                  <div key={j.id} className="p-3 rounded-lg border border-border/30 hover:border-primary/30 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true"><Building2 className="h-4 w-4 text-primary" /></div>
                      <div><p className="text-sm font-medium">{j.title}</p><p className="text-xs text-muted-foreground">{j.company}</p></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" />{j.location}<span aria-hidden="true">·</span>{j.salary}</div>
                    <Button size="sm" className="w-full mt-3 h-8 text-xs" onClick={() => handleApply(j.id)} aria-label={`Apply to ${j.title}`}>Apply Now</Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
