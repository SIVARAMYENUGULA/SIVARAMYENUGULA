import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ErrorState } from '@/components/shared/error-state'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Briefcase, Building2, DollarSign,
  Users, Calendar, Send, Heart, Share2, CheckCircle, AlertCircle,
  FileText
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { jobService } from '@/services/job'
import { applicationService } from '@/services/application'
import { profileService } from '@/services/profile'
import type { Job } from '@/types'

export function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [similarJobs, setSimilarJobs] = useState<Job[]>([])
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationStep, setApplicationStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [existingApplication, setExistingApplication] = useState<any>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    resume: null as File | null,
    coverLetter: '',
    linkedin: '',
    portfolio: '',
    additionalInfo: '',
    agreeToTerms: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) { setError('Job ID is required'); setLoading(false); return }
      try {
        const jobData = await jobService.getById(id)
        setJob(jobData)

        // Fetch similar jobs
        const allJobs = await jobService.getAll({ status: 'active' })
        setSimilarJobs(allJobs
          .filter(j => j.id !== id && j.skills.some(s => jobData.skills.includes(s)))
          .slice(0, 3)
        )

        // Check if already applied
        try {
          const app = await applicationService.getStatus(id)
          setExistingApplication(app)
        } catch { /* not applied */ }
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Failed to load job')
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id])

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error || !job) return <PageTransition><ErrorState type="page" message={error || 'Job not found'} onRetry={() => navigate('/student/jobs')} /></PageTransition>

  const daysLeft = job.deadline ? Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0

  const handleSaveJob = () => {
    setIsSaved(!isSaved)
    addToast({ title: isSaved ? 'Job Unsaved' : 'Job Saved', description: `${job.title} has been ${isSaved ? 'removed from' : 'added to'} your saved jobs`, variant: isSaved ? 'info' : 'success' })
  }

  const handleSubmitApplication = async () => {
    setIsSubmitting(true)
    try {
      let resumeUrl: string | undefined
      // Upload resume first if a file is selected
      if (formData.resume) {
        const uploadResult = await profileService.uploadResume(formData.resume)
        resumeUrl = uploadResult.resumeUrl
      }

      await applicationService.submit({
        jobId: job.id,
        resumeUrl,
        coverLetter: formData.coverLetter || undefined,
        additionalInfo: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio,
          additionalNotes: formData.additionalInfo,
        },
      })
      setIsSubmitted(true)
      addToast({ title: 'Application Submitted!', description: `Successfully applied to ${job.title} at ${job.company}`, variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to submit application', variant: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) { navigator.share({ title: job.title, text: `Check out this job: ${job.title} at ${job.company}`, url: window.location.href }) }
    else { navigator.clipboard.writeText(window.location.href); addToast({ title: 'Link Copied', description: 'Job link copied to clipboard', variant: 'info' }) }
  }

  if (isSubmitted) {
    return (
      <PageTransition>
        <main className="max-w-2xl mx-auto" aria-label="Application submitted">
          <Card className="text-center py-12">
            <CardContent>
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"><CheckCircle className="h-10 w-10 text-success" /></div>
              <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground mb-2">Your application for <strong>{job.title}</strong> at <strong>{job.company}</strong> has been received.</p>
              <p className="text-sm text-muted-foreground mb-8">The company will review your application and get back to you.</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => navigate('/student/applications')}>View My Applications</Button>
                <Button onClick={() => navigate('/student/jobs')}>Browse More Jobs</Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </PageTransition>
    )
  }

  if (showApplicationForm) {
    return (
      <PageTransition>
        <main className="max-w-3xl mx-auto space-y-6" aria-label="Application form">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setShowApplicationForm(false)}><ArrowLeft className="h-5 w-5" /></Button>
            <div><h1 className="text-2xl font-bold">Submit Application</h1><p className="text-sm text-muted-foreground">{job.title} &middot; {job.company}</p></div>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2 flex-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${applicationStep > step ? 'bg-success text-white' : applicationStep === step ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground'}`}>
                  {applicationStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                <span className={`text-xs hidden sm:block ${applicationStep >= step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {step === 1 ? 'Personal Info' : step === 2 ? 'Documents' : 'Review'}
                </span>
                {step < 3 && <div className={`flex-1 h-0.5 ${applicationStep > step ? 'bg-success' : 'bg-muted/30'}`} />}
              </div>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>{applicationStep === 1 ? 'Personal Information' : applicationStep === 2 ? 'Upload Documents' : 'Review & Submit'}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {applicationStep === 1 && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1.5">Full Name</label>
                    <input type="text" value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1.5">Email</label>
                      <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
                    <div><label className="block text-sm font-medium mb-1.5">Phone</label>
                      <input type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">LinkedIn Profile</label>
                    <input type="url" value={formData.linkedin} onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
                  <div><label className="block text-sm font-medium mb-1.5">Portfolio / Website</label>
                    <input type="url" value={formData.portfolio} onChange={(e) => setFormData(prev => ({ ...prev, portfolio: e.target.value }))} placeholder="https://"
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" /></div>
                </div>
              )}
              {applicationStep === 2 && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1.5">Resume / CV</label>
                    <div
                      className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center hover:border-primary/30 transition-all cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileText className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                      {formData.resume ? (
                        <>
                          <p className="text-sm font-medium text-primary">{formData.resume.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{(formData.resume.size / 1024).toFixed(1)} KB &middot; Click to change</p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium mb-1">Drop your resume here or click to browse</p>
                          <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
                        </>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setFormData(prev => ({ ...prev, resume: e.target.files?.[0] || null }))}
                      />
                      <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                        <FileText className="h-4 w-4" /> {formData.resume ? 'Change File' : 'Upload Resume'}
                      </Button>
                    </div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">Cover Letter</label>
                    <textarea value={formData.coverLetter} onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))} rows={5}
                      placeholder="Tell us why you're a great fit for this role..."
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" />
                    <p className="text-xs text-muted-foreground mt-1">Optional but recommended</p>
                  </div>
                  <div><label className="block text-sm font-medium mb-1.5">Additional Information</label>
                    <textarea value={formData.additionalInfo} onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))} rows={3}
                      placeholder="Any additional information you'd like to share..."
                      className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" /></div>
                </div>
              )}
              {applicationStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted/20">
                    <h3 className="font-medium mb-3">Application Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span className="font-medium">{job.title}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{job.company}</span></div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/5 border border-warning/10">
                    <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Before you submit</p>
                      <p>Please double-check all your information. Once submitted, you won't be able to edit your application.</p>
                    </div>
                  </div>
                  <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer">
                    <input type="checkbox" checked={formData.agreeToTerms} onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                      className="mt-0.5 h-4 w-4 rounded border-border/50 text-primary focus:ring-primary/30" />
                    <span className="text-sm text-muted-foreground">I confirm that all the information provided is accurate</span>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between gap-4">
            <div>{applicationStep > 1 && <Button variant="outline" onClick={() => setApplicationStep(prev => Math.max(prev - 1, 1))} className="gap-2"><ArrowLeft className="h-4 w-4" /> Previous</Button>}</div>
            <div>{applicationStep < 3 ? (
              <Button onClick={() => setApplicationStep(prev => Math.min(prev + 1, 3))} className="gap-2">Next Step <ArrowLeft className="h-4 w-4 rotate-180" /></Button>
            ) : (
              <Button onClick={handleSubmitApplication} disabled={isSubmitting || !formData.agreeToTerms}
                className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white">
                {isSubmitting ? 'Submitting...' : <><Send className="h-4 w-4" /> Submit Application</>}
              </Button>
            )}</div>
          </div>
        </main>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <main className="space-y-8" aria-label="Job detail">
        <div className="flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/jobs')}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><Building2 className="h-6 w-6 text-primary" /></div>
              <div><h1 className="text-3xl font-bold truncate">{job.title}</h1><p className="text-muted-foreground">{job.company}</p></div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleSaveJob}><Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} /></Button>
            <Button variant="outline" size="icon" onClick={handleShare}><Share2 className="h-4 w-4" /></Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-purple-500 text-white" onClick={() => setShowApplicationForm(true)} disabled={!!existingApplication}>
              {existingApplication ? 'Applied ✓' : <><Send className="h-4 w-4" /> Apply Now</>}
            </Button>
          </div>
        </div>

        <section aria-label="Job overview">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="pt-6 text-center"><MapPin className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-lg font-bold">{job.location}</p><p className="text-xs text-muted-foreground">Location</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><Briefcase className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-lg font-bold">{job.type}</p><p className="text-xs text-muted-foreground">Employment Type</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><DollarSign className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-lg font-bold">{job.salary}</p><p className="text-xs text-muted-foreground">Salary</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-lg font-bold">{job.applicants}</p><p className="text-xs text-muted-foreground">Applicants</p></CardContent></Card>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-6">
            <Card><CardHeader><CardTitle>Job Description</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground leading-relaxed">{job.description}</p></CardContent></Card>
            <Card><CardHeader><CardTitle>Required Skills</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{job.skills.map((skill) => (<Badge key={skill} variant="info" className="px-3 py-1.5">{skill}</Badge>))}</div></CardContent></Card>
            {similarJobs.length > 0 && (
              <Card><CardHeader><CardTitle>Similar Jobs</CardTitle></CardHeader><CardContent className="space-y-3">{similarJobs.map((sj) => (<button key={sj.id} onClick={() => navigate(`/student/jobs/${sj.id}`)} className="w-full p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:shadow-sm transition-all text-left group"><div className="flex items-center justify-between"><div><p className="font-medium group-hover:text-primary transition-colors">{sj.title}</p><p className="text-sm text-muted-foreground">{sj.company} &middot; {sj.location}</p></div><Badge variant="info">{sj.type}</Badge></div></button>))}</CardContent></Card>
            )}
          </section>
          <aside className="space-y-6">
            <Card><CardHeader><CardTitle>Job Details</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Posted</p><p className="font-medium">{job.postedAt ? new Date(job.postedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '-'}</p></div></div>
              <Separator />
              <div className="flex items-center gap-3 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Deadline</p><div className="flex items-center gap-2"><p className="font-medium">{job.deadline ? new Date(job.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Rolling'}</p>{daysLeft > 0 && daysLeft < 30 && <Badge variant={daysLeft <= 7 ? 'destructive' : 'warning'} className="text-[10px]">{daysLeft}d left</Badge>}</div></div></div>
              <Separator />
              <div className="flex items-center gap-3 text-sm"><Users className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground">Applicants</p><p className="font-medium">{job.applicants} applicants</p></div></div>
            </CardContent></Card>
            <Button className="w-full gap-2 bg-gradient-to-r from-primary to-purple-500 text-white" onClick={() => setShowApplicationForm(true)} disabled={!!existingApplication}>
              {existingApplication ? 'Already Applied ✓' : <><Send className="h-4 w-4" /> Apply Now</>}
            </Button>
          </aside>
        </div>
      </main>
    </PageTransition>
  )
}
