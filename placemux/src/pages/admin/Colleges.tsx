import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/table'
import { useConfirm } from '@/components/shared/confirm-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { adminService } from '@/services/admin'
import { GraduationCap, CheckCircle, AlertTriangle, TrendingUp, Shield, Plus, School, Mail, Lock, Globe, MapPin } from 'lucide-react'

import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function AdminColleges() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [colleges, setColleges] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ collegeName: '', name: '', email: '', password: '', location: '', website: '', emailDomains: '' })
  const { addToast } = useToast()
  const { ConfirmDialog: DeleteConfirm } = useConfirm()

  const fetchData = async () => {
    try {
      const result = await adminService.getColleges()
      setColleges(result.data || [])
      setTotal(result.pagination?.total || 0)
    } catch (err: any) {
      setPageError(err?.response?.data?.error?.message || 'Failed to load colleges')
    }
  }

  useEffect(() => { fetchData() }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const handleToggleVerify = async (id: string, name: string, currentVerified: boolean) => {
    try {
      await adminService.verifyCollege(id, { verified: !currentVerified })
      setColleges(prev => prev.map(c => c._id === id ? { ...c, verified: !currentVerified } : c))
      addToast({ title: 'College Updated', description: `"${name}" ${currentVerified ? 'unverified' : 'verified'}`, variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to update college', variant: 'error' })
    }
  }

  const handleCreate = async () => {
    if (!form.collegeName || !form.name || !form.email || !form.password) {
      addToast({ title: 'Validation Error', description: 'College Name, Admin Name, Email, and Password are required', variant: 'error' })
      return
    }
    if (form.password.length < 8) {
      addToast({ title: 'Validation Error', description: 'Password must be at least 8 characters', variant: 'error' })
      return
    }
    setCreating(true)
    try {
      const res = await adminService.createCollege({
        collegeName: form.collegeName,
        name: form.name,
        email: form.email,
        password: form.password,
        location: form.location,
        website: form.website,
        emailDomains: form.emailDomains ? form.emailDomains.split(',').map((d: string) => d.trim()) : [],
      })
      addToast({ title: 'College Created', description: res.message || 'College account created successfully', variant: 'success' })
      setShowCreate(false)
      setForm({ collegeName: '', name: '', email: '', password: '', location: '', website: '', emailDomains: '' })
      fetchData()
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to create college', variant: 'error' })
    } finally {
      setCreating(false)
    }
  }

  const verifiedCount = colleges.filter((c: any) => c.verified).length

  return (
    <main className="space-y-8" aria-label="College management">
      <DeleteConfirm />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">College Management</h1><p className="text-muted-foreground mt-1">Manage affiliated colleges and institutions</p></div>
        <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create College
        </Button>
      </div>

      <section aria-label="College statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 text-center"><GraduationCap className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{verifiedCount}</p><p className="text-xs text-muted-foreground">Verified</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{total - verifiedCount}</p><p className="text-xs text-muted-foreground">Unverified</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><TrendingUp className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{total > 0 ? Math.round((verifiedCount / total) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Verified %</p></CardContent></Card>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle id="colleges-title">All Colleges ({total})</CardTitle></CardHeader>
        <CardContent aria-labelledby="colleges-title">
          {colleges.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No colleges registered" description="Colleges will appear here once they register or you can create one" action={{ label: 'Create College', onClick: () => setShowCreate(true) }} />
          ) : (
            <DataTable data={colleges} columns={[
              {key:'collegeName',header:'College',sortable:true,render:(c: any)=><div className="flex items-center gap-2"><School className="h-4 w-4 text-primary" /><span className="font-medium">{c.collegeName || c.userId?.name || 'Unnamed'}</span></div>},
              {key:'location',header:'Location',render:(c: any)=><span className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" />{c.location || '-'}</span>},
              {key:'verified',header:'Status',render:(c: any)=><Badge variant={c.verified?'success':'warning'}>{c.verified?'Verified':'Pending'}</Badge>},
              {key:'totalStudents',header:'Students',render:(c: any)=><span className="font-medium">{c.totalStudents || 0}</span>},
              {key:'emailDomains',header:'Domains',render:(c: any)=><span className="text-xs text-muted-foreground">{(c.emailDomains||[]).join(', ') || '-'}</span>},
              {key:'actions',header:'',render:(c: any)=><div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleVerify(c._id, c.collegeName || c.userId?.name, c.verified)} aria-label={c.verified ? 'Unverify' : 'Verify'}>
                  <Shield className={`h-3.5 w-3.5 ${c.verified ? 'text-success' : 'text-muted-foreground'}`} />
                </Button>
              </div>},
            ]} searchable searchPlaceholder="Search colleges..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><School className="h-5 w-5 text-primary" /> Create College Account</DialogTitle>
            <DialogDescription>Create a new college with an admin account. The college admin will receive login credentials.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">College Name *</label>
                <Input value={form.collegeName} onChange={e => setForm({...form, collegeName: e.target.value})} placeholder="e.g., Indian Institute of Technology" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block"><Mail className="h-3 w-3 inline mr-1" /> Admin Email *</label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="college@example.edu" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block"><Lock className="h-3 w-3 inline mr-1" /> Password *</label>
                <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Admin Name *</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Dr. Sharma" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block"><Globe className="h-3 w-3 inline mr-1" /> Website</label>
                <Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://college.edu" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block"><MapPin className="h-3 w-3 inline mr-1" /> Location</label>
                <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g., Mumbai, India" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Email Domains (comma separated)</label>
                <Input value={form.emailDomains} onChange={e => setForm({...form, emailDomains: e.target.value})} placeholder="college.edu, iitb.ac.in" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : <><Plus className="h-4 w-4 mr-2" /> Create College</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
