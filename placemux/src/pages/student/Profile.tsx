import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import env from '@/config/env'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/auth-context'
import { profileService } from '@/services/profile'
import { Camera, X, Save, Upload, Mail, Phone, Linkedin, Github, ImageIcon, FileText, Download, Eye } from 'lucide-react'

import { useState, useEffect, useRef } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { ProfileSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function StudentProfile() {
  const { user, updateUser } = useAuth()
  const { addToast } = useToast()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showResumePreview, setShowResumePreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: '',
    year: '',
    phone: '',
    linkedinUrl: '',
    portfolioUrl: '',
    resumeUrl: '',
    bio: '',
    profileCompleted: 0,
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileService.getProfile()
        const p: Record<string, any> = data.profile || {}
        let avatar = data.user?.avatar || ''
        // Resolve relative avatar URL to absolute
        if (avatar && avatar.startsWith('/uploads')) {
          const baseUrl = env.apiUrl.replace('/api', '')
          avatar = `${baseUrl}${avatar}`
        }
        setAvatarUrl(avatar)
        setFormData({
          name: data.user?.name || user?.name || '',
          email: data.user?.email || user?.email || '',
          course: p.course || '',
          year: p.year ? String(p.year) : '',
          phone: p.phone || '',
          linkedinUrl: p.linkedinUrl || '',
          portfolioUrl: p.portfolioUrl || '',
          resumeUrl: p.resumeUrl || '',
          bio: p.bio || '',
          profileCompleted: p.profileCompleted || 0,
        })
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load profile')
      } finally {
        setPageLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  if (pageLoading) return <PageTransition><ProfileSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const handleSave = async () => {
    setSaving(true)
    try {
      await profileService.updateProfile({
        name: formData.name,
        course: formData.course,
        year: formData.year ? parseInt(formData.year) : undefined,
        phone: formData.phone,
        linkedinUrl: formData.linkedinUrl,
        portfolioUrl: formData.portfolioUrl,
        bio: formData.bio,
      })
      addToast({ title: 'Profile Updated', description: 'Your profile has been saved', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to save profile', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      addToast({ title: 'Error', description: 'File size must be under 2MB', variant: 'error' })
      return
    }
    setUploadingAvatar(true)
    try {
      const result = await profileService.uploadAvatar(file)
      setAvatarUrl(result.avatarUrl)
      if (user) {
        updateUser({ ...user, avatar: result.avatarUrl })
      }
      addToast({ title: 'Photo Updated', description: 'Your profile photo has been uploaded', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Upload failed', variant: 'error' })
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      addToast({ title: 'Error', description: 'File size must be under 5MB', variant: 'error' })
      return
    }
    setUploading(true)
    try {
      const result = await profileService.uploadResume(file)
      setFormData(prev => ({ ...prev, resumeUrl: result.resumeUrl }))
      addToast({ title: 'Resume Uploaded', description: 'Your resume has been uploaded', variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Upload failed', variant: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const initials = formData.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

  const completionItems = [
    { label: 'Personal Info', done: !!formData.name && !!formData.phone },
    { label: 'Education', done: !!formData.course && !!formData.year },
    { label: 'Links', done: !!formData.linkedinUrl },
    { label: 'Bio', done: !!formData.bio },
  ]

  return (
    <main className="space-y-8" aria-label="Profile">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal and academic information</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary to-purple-500 text-white">
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="space-y-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block">
                <Avatar className="h-24 w-24 mx-auto ring-4 ring-border">
                  <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${formData.name}`} alt={formData.name} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <input type="file" ref={avatarInputRef} accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleAvatarUpload} />
                <Button size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md" aria-label="Change photo" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                  {uploadingAvatar ? <ImageIcon className="h-4 w-4 animate-pulse" /> : <Camera className="h-4 w-4" />}
                </Button>
              </div>
              <h2 className="text-xl font-semibold mt-4">{formData.name || 'User'}</h2>
              <p className="text-sm text-muted-foreground">{formData.email}</p>
              <Badge variant="secondary" className="mt-2">Student</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle id="completion-title">Profile Completion</CardTitle></CardHeader>
            <CardContent aria-labelledby="completion-title" className="space-y-3">
              <div className="text-center">
                <span className="text-3xl font-bold">{formData.profileCompleted}%</span>
                <p className="text-xs text-muted-foreground">Complete your profile</p>
              </div>
              <Progress value={formData.profileCompleted} aria-label="Profile completion" />
              <div className="space-y-2 mt-3">
                {completionItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    {item.done ? (
                      <Badge variant="success" className="text-[10px]">Done</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Pending</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle id="resume-title">Resume</CardTitle></CardHeader>
            <CardContent aria-labelledby="resume-title" className="space-y-3">
              {formData.resumeUrl ? (
                <>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate flex-1">Resume uploaded</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(formData.resumeUrl, '_blank')} title="Download resume">
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-8" onClick={() => setShowResumePreview(true)}>
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                    <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs h-8" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      <Upload className="h-3.5 w-3.5" />
                      {uploading ? 'Uploading...' : 'Replace'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setFormData(p => ({ ...p, resumeUrl: '' }))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <input type="file" ref={fileInputRef} accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
                  <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <Upload className="h-4 w-4 mr-2" /> {uploading ? 'Uploading...' : 'Upload Resume'}
                  </Button>
                </>
              )}
              <p className="text-[10px] text-muted-foreground text-center">PDF, DOC up to 5MB</p>
            </CardContent>
          </Card>

          {/* Resume Preview Modal */}
          <Dialog open={showResumePreview} onOpenChange={setShowResumePreview}>
            <DialogContent className="sm:max-w-3xl h-[80vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Resume Preview
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 h-full min-h-0 -mx-6 -mb-6">
                {formData.resumeUrl ? (
                  <iframe
                    src={formData.resumeUrl}
                    className="w-full h-full border-0"
                    title="Resume Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No resume to preview
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </aside>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle id="personal-info-title">Personal Information</CardTitle></CardHeader>
            <CardContent aria-labelledby="personal-info-title" className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" className="pl-9" value={formData.email} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="phone" className="pl-9" value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="linkedin" className="pl-9" value={formData.linkedinUrl} onChange={(e) => setFormData(p => ({ ...p, linkedinUrl: e.target.value }))} placeholder="linkedin.com/in/" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio">Portfolio</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="portfolio" className="pl-9" value={formData.portfolioUrl} onChange={(e) => setFormData(p => ({ ...p, portfolioUrl: e.target.value }))} placeholder="github.com/" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle id="education-title">Education</CardTitle></CardHeader>
            <CardContent aria-labelledby="education-title" className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course">Course / Department</Label>
                <Input id="course" value={formData.course} onChange={(e) => setFormData(p => ({ ...p, course: e.target.value }))} placeholder="B.Tech Computer Science" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year of Study</Label>
                <Input id="year" type="number" min={1} max={6} value={formData.year} onChange={(e) => setFormData(p => ({ ...p, year: e.target.value }))} placeholder="3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle id="bio-title">Bio</CardTitle></CardHeader>
            <CardContent aria-labelledby="bio-title">
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                rows={3}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2.5 rounded-xl border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
