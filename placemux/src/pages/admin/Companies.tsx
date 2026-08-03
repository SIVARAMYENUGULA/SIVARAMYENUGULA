import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { adminService } from '@/services/admin'
import { Building2, CheckCircle, AlertTriangle, Shield, Plus, Mail, Lock, Globe, MapPin, Briefcase } from 'lucide-react'

import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function AdminCompanies() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [companies, setCompanies] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '', industry: '', location: '', website: '', description: '' })
  const { addToast } = useToast()

  const fetchData = async () => {
    try {
      const result = await adminService.getCompanies()
      setCompanies(result.data || [])
      setTotal(result.pagination?.total || 0)
    } catch (err: any) {
      setPageError(err?.response?.data?.error?.message || 'Failed to load companies')
    }
  }

  useEffect(() => { fetchData() }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const handleToggleVerify = async (id: string, name: string, currentVerified: boolean) => {
    try {
      await adminService.verifyCompany(id, { verified: !currentVerified })
      setCompanies(prev => prev.map(c => c._id === id ? { ...c, verified: !currentVerified } : c))
      addToast({ title: 'Company Updated', description: `"${name}" ${currentVerified ? 'unverified' : 'verified'}`, variant: 'success' })
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to update company', variant: 'error' })
    }
  }

  const handleCreate = async () => {
    if (!form.companyName || !form.name || !form.email || !form.password) {
      addToast({ title: 'Validation Error', description: 'Company Name, Admin Name, Email, and Password are required', variant: 'error' })
      return
    }
    if (form.password.length < 8) {
      addToast({ title: 'Validation Error', description: 'Password must be at least 8 characters', variant: 'error' })
      return
    }
    setCreating(true)
    try {
      const res = await adminService.createCompany({
        companyName: form.companyName,
        name: form.name,
        email: form.email,
        password: form.password,
        industry: form.industry,
        location: form.location,
        website: form.website,
        description: form.description,
      })
      addToast({ title: 'Company Created', description: res.message || 'Company account created successfully', variant: 'success' })
      setShowCreate(false)
      setForm({ companyName: '', name: '', email: '', password: '', industry: '', location: '', website: '', description: '' })
      fetchData()
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to create company', variant: 'error' })
    } finally {
      setCreating(false)
    }
  }

  const verifiedCount = companies.filter((c: any) => c.verified).length

  return (
    <main className="space-y-8" aria-label="Company management">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Company Management</h1><p className="text-muted-foreground mt-1">Verify and manage company accounts</p></div>
        <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Company
        </Button>
      </div>

      <section aria-label="Company statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 text-center"><Building2 className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{verifiedCount}</p><p className="text-xs text-muted-foreground">Verified</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{total - verifiedCount}</p><p className="text-xs text-muted-foreground">Unverified</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><CheckCircle className={`h-8 w-8 mx-auto mb-2 ${total > 0 && verifiedCount === total ? 'text-success' : 'text-warning'}`} /><p className="text-2xl font-bold">{total > 0 ? Math.round((verifiedCount / total) * 100) : 0}%</p><p className="text-xs text-muted-foreground">Verification %</p></CardContent></Card>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle id="companies-title">All Companies ({total})</CardTitle></CardHeader>
        <CardContent aria-labelledby="companies-title">
          {companies.length === 0 ? (
            <EmptyState icon={Building2} title="No companies registered" description="Companies will appear here once they register" action={{ label: 'Create Company', onClick: () => setShowCreate(true) }} />
          ) : (
            <DataTable data={companies} columns={[
              {key:'companyName',header:'Company',sortable:true,render:(c: any)=><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><span className="font-medium">{c.companyName || c.userId?.name || 'Unnamed'}</span></div>},
              {key:'industry',header:'Industry',render:(c: any)=><span><Briefcase className="h-3 w-3 inline mr-1 text-muted-foreground" />{c.industry || '-'}</span>},
              {key:'verified',header:'Status',render:(c: any)=><Badge variant={c.verified?'success':'warning'}>{c.verified?'Verified':'Pending'}</Badge>},
              {key:'location',header:'Location',render:(c: any)=><span className="flex items-center gap-1 text-xs"><MapPin className="h-3 w-3" />{c.location || '-'}</span>},
              {key:'website',header:'Website',render:(c: any)=><span className="text-xs text-muted-foreground">{c.website ? new URL(c.website).hostname : '-'}</span>},
              {key:'actions',header:'',render:(c: any)=><div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleVerify(c._id, c.companyName || c.userId?.name, c.verified)} aria-label={c.verified ? 'Unverify' : 'Verify'}>
                  <Shield className={`h-3.5 w-3.5 ${c.verified ? 'text-success' : 'text-muted-foreground'}`} />
                </Button>
              </div>},
            ]} searchable searchPlaceholder="Search companies..." />
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Create Company Account</DialogTitle>
            <DialogDescription>Create a new company with an admin account. The company will be automatically verified.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Company Name *</label>
                <Input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} placeholder="e.g., Google India" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block"><Mail className="h-3 w-3 inline mr-1" /> HR Email *</label>
                <Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="hr@company.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block"><Lock className="h-3 w-3 inline mr-1" /> Password *</label>
                <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">HR Name *</label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Priya Sharma" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Industry</label>
                <Input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} placeholder="e.g., Technology" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block"><Globe className="h-3 w-3 inline mr-1" /> Website</label>
                <Input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="https://company.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block"><MapPin className="h-3 w-3 inline mr-1" /> Location</label>
                <Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g., Bangalore, India" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Brief description about the company..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : <><Plus className="h-4 w-4 mr-2" /> Create Company</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
