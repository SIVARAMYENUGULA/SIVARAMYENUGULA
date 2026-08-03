import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { useConfirm } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Eye, Clock, Users, Briefcase, X, Loader2 } from 'lucide-react'
import { jobService } from '@/services/job'

import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import type { Job } from '@/types'
import * as Dialog from '@radix-ui/react-dialog'

interface JobFormData {
  title: string
  location: string
  type: string
  salaryMin: string
  salaryMax: string
  skillsRequired: string
  description: string
  deadline: string
  status: string
}

const emptyForm: JobFormData = {
  title: '',
  location: '',
  type: 'Full-time',
  salaryMin: '',
  salaryMax: '',
  skillsRequired: '',
  description: '',
  deadline: '',
  status: 'active',
}

export function CompanyJobs() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const { addToast } = useToast()
  const { confirm, ConfirmDialog: DeleteConfirm } = useConfirm()

  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState<JobFormData>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await jobService.getAll()
        setJobs(data)
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

  const statusCounts = {
    active: jobs.filter(j => j.status === 'active').length,
    draft: jobs.filter(j => j.status === 'draft').length,
    closed: jobs.filter(j => j.status === 'closed').length,
  }
  const totalApplicants = jobs.reduce((a, j) => a + (j.applicants || 0), 0)

  const openCreateModal = () => {
    setEditingJob(null)
    setFormData(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (job: Job) => {
    setEditingJob(job)
    setFormData({
      title: job.title,
      location: job.location,
      type: job.type,
      salaryMin: '',
      salaryMax: '',
      skillsRequired: job.skills.join(', '),
      description: job.description,
      deadline: job.deadline || '',
      status: job.status,
    })
    setShowModal(true)
  }

  const handleFormChange = (field: keyof JobFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.title || !formData.location) {
      addToast({ title: 'Validation Error', description: 'Title and location are required', variant: 'error' })
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        title: formData.title,
        location: formData.location,
        type: formData.type,
        description: formData.description,
        skillsRequired: formData.skillsRequired.split(',').map(s => s.trim()).filter(Boolean),
        deadline: formData.deadline || undefined,
        status: formData.status || 'active',
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) * 100000 : undefined,
        salaryMax: formData.salaryMax ? parseInt(formData.salaryMax) * 100000 : undefined,
      }

      if (editingJob) {
        await jobService.update(editingJob.id, payload)
        addToast({ title: 'Job Updated', description: `"${formData.title}" has been updated`, variant: 'success' })
      } else {
        await jobService.create(payload)
        addToast({ title: 'Job Created', description: `"${formData.title}" has been posted`, variant: 'success' })
      }

      setShowModal(false)
      // Refresh list
      const data = await jobService.getAll()
      setJobs(data)
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to save job', variant: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm('Delete Job', `Are you sure you want to delete "${title}"? This will remove all applications and cannot be undone.`)
    if (confirmed) {
      try {
        await jobService.delete(id)
        setJobs(prev => prev.filter(j => j.id !== id))
        addToast({ title: 'Job Deleted', description: `"${title}" has been removed`, variant: 'success' })
      } catch (err: any) {
        addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to delete job', variant: 'error' })
      }
    }
  }

  return (
    <main className="space-y-8" aria-label="Job management">
      <DeleteConfirm />

      {/* Create/Edit Modal */}
      <Dialog.Root open={showModal} onOpenChange={setShowModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-background rounded-2xl shadow-2xl border border-border/50 z-50">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-bold">{editingJob ? 'Edit Job' : 'Create Job'}</Dialog.Title>
                <Dialog.Close className="h-8 w-8 rounded-lg hover:bg-muted/20 flex items-center justify-center">
                  <X className="h-4 w-4" />
                </Dialog.Close>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Job Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Location *</label>
                  <input type="text" value={formData.location} onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="e.g. Bangalore, India"
                    className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Type</label>
                    <select value={formData.type} onChange={(e) => handleFormChange('type', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => handleFormChange('status', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Min Salary (LPA)</label>
                    <input type="number" value={formData.salaryMin} onChange={(e) => handleFormChange('salaryMin', e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Max Salary (LPA)</label>
                    <input type="number" value={formData.salaryMax} onChange={(e) => handleFormChange('salaryMax', e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Skills Required (comma separated)</label>
                  <input type="text" value={formData.skillsRequired} onChange={(e) => handleFormChange('skillsRequired', e.target.value)}
                    placeholder="e.g. React, Node.js, TypeScript"
                    className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Description</label>
                  <textarea value={formData.description} onChange={(e) => handleFormChange('description', e.target.value)}
                    rows={4} placeholder="Job description, responsibilities, requirements..."
                    className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Deadline</label>
                  <input type="date" value={formData.deadline} onChange={(e) => handleFormChange('deadline', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border/30">
                <Dialog.Close asChild>
                  <Button variant="outline">Cancel</Button>
                </Dialog.Close>
                <Button onClick={handleSave}
                  disabled={isSaving || !formData.title || !formData.location}
                  className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white">
                  {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <>{editingJob ? 'Update Job' : 'Create Job'}</>}
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Job Management</h1><p className="text-muted-foreground mt-1">Manage your job postings and track applicants</p></div>
        <Button className="bg-gradient-to-r from-primary to-purple-500 text-white" onClick={openCreateModal} aria-label="Post new job">
          <Plus className="h-4 w-4 mr-2" /> Post New Job
        </Button>
      </div>

      <section aria-label="Job statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 text-center"><Briefcase className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{jobs.length}</p><p className="text-xs text-muted-foreground">Total Jobs</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{statusCounts.active}</p><p className="text-xs text-muted-foreground">Active</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{statusCounts.draft}</p><p className="text-xs text-muted-foreground">Drafts</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Eye className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{totalApplicants}</p><p className="text-xs text-muted-foreground">Total Applicants</p></CardContent></Card>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle id="jobs-title">All Job Postings</CardTitle></CardHeader>
        <CardContent aria-labelledby="jobs-title">
          {jobs.length === 0 ? (
            <EmptyState icon={Briefcase} title="No jobs posted" description="Post your first job to start receiving applications" action={{label: 'Post a Job', onClick: openCreateModal}} />
          ) : (
            <DataTable data={jobs} columns={[
              {key:'title',header:'Position',sortable:true,render:(j: any)=><div><p className="font-medium">{j.title}</p><p className="text-xs text-muted-foreground">{j.location}</p></div>},
              {key:'type',header:'Type',render:(j: any)=><Badge variant="info">{j.type}</Badge>},
              {key:'salary',header:'Salary',render:(j: any)=><span className="font-medium text-success">{j.salary}</span>},
              {key:'applicants',header:'Applicants',sortable:true,render:(j: any)=><span className="font-medium">{j.applicants}</span>},
              {key:'postedAt',header:'Posted',render:(j: any)=><span className="text-xs text-muted-foreground">{j.postedAt}</span>},
              {key:'deadline',header:'Deadline',render:(j: any)=><span className="text-xs">{j.deadline || 'Rolling'}</span>},
              {key:'status',header:'Status',render:(j: any)=><Badge variant={j.status==='active'?'success':j.status==='draft'?'warning':'secondary'}>{j.status}</Badge>},
              {key:'actions',header:'',render:(j: any)=><div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(j)} aria-label={`Edit ${j.title}`}><Edit className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(j.id, j.title)} aria-label={`Delete ${j.title}`}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>},
            ]} searchable searchPlaceholder="Search jobs..." />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
