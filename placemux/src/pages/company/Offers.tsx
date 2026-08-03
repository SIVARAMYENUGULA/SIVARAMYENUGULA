import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { offerService } from '@/services/college'
import { Mail, Send, CheckCircle2, XCircle, DollarSign } from 'lucide-react'

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  Draft: 'secondary', Sent: 'info', Accepted: 'success', Rejected: 'destructive', Expired: 'default',
}

export function CompanyOffers() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offers, setOffers] = useState<any[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState({ applicationId: '', candidateName: '', candidateEmail: '', jobTitle: '', salaryMin: '', salaryMax: '', notes: '' })
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const { addToast } = useToast()

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const data = await offerService.getAll()
      setOffers(data || [])
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load offers')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOffers() }, [])

  const handleCreate = async () => {
    if (!formData.applicationId) { addToast({ title: 'Error', description: 'Application ID is required', variant: 'error' }); return }
    try {
      const res = await offerService.create(formData)
      addToast({ title: 'Offer Created', description: res.message || 'Offer created as Draft', variant: 'success' })
      setShowCreate(false); setFormData({ applicationId: '', candidateName: '', candidateEmail: '', jobTitle: '', salaryMin: '', salaryMax: '', notes: '' })
      fetchOffers()
    } catch { addToast({ title: 'Error', description: 'Failed to create offer', variant: 'error' }) }
  }

  const handleSend = async (offer: any) => {
    setActionLoading(p => ({ ...p, ['s-' + offer._id]: true }))
    try { await offerService.send(offer._id); addToast({ title: 'Offer Sent', variant: 'success' }); fetchOffers() }
    catch { addToast({ title: 'Error', description: 'Failed to send offer', variant: 'error' }) }
    setActionLoading(p => ({ ...p, ['s-' + offer._id]: false }))
  }

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchOffers} /></PageTransition>

  const stats = { total: offers.length, draft: offers.filter(o => o.status === 'Draft').length, sent: offers.filter(o => o.status === 'Sent').length, accepted: offers.filter(o => o.status === 'Accepted').length }

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Offer Management</h1><p className="text-muted-foreground mt-1">Create and manage candidate offers</p></div>
        <Button className="bg-gradient-to-r from-primary to-purple-500" onClick={() => setShowCreate(true)}><Send className="h-4 w-4 mr-2" /> Create Offer</Button>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Mail className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Send className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.sent}</p><p className="text-xs text-muted-foreground">Sent</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.accepted}</p><p className="text-xs text-muted-foreground">Accepted</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><DollarSign className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{stats.draft}</p><p className="text-xs text-muted-foreground">Drafts</p></CardContent></Card>
      </section>
      <Card>
        <CardHeader><CardTitle>All Offers</CardTitle></CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <EmptyState icon={Send} title="No offers yet" description="Create an offer when a candidate is ready" action={{ label: 'Create Offer', onClick: () => setShowCreate(true) }} />
          ) : (
            <DataTable data={offers} columns={[
              { key: 'candidateName', header: 'Candidate', sortable: true, render: (o: any) => <span className="font-medium">{o.candidateName}</span> },
              { key: 'jobTitle', header: 'Position' },
              { key: 'salaryMax', header: 'Salary', render: (o: any) => <span className="font-medium text-success">{o.salaryMin ? '₹' + (+o.salaryMin/100000).toFixed(1) + 'L' : '-'} - {o.salaryMax ? '₹' + (+o.salaryMax/100000).toFixed(1) + 'L' : '-'}</span> },
              { key: 'status', header: 'Status', render: (o: any) => <Badge variant={statusColors[o.status] || 'default'}>{o.status}</Badge> },
              { key: 'sentDate', header: 'Sent', render: (o: any) => <span className="text-xs">{o.sentDate ? new Date(o.sentDate).toLocaleDateString() : '-'}</span> },
              { key: 'actions', header: '', render: (o: any) => (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  {o.status === 'Draft' && <Button variant="ghost" size="sm" onClick={() => handleSend(o)}><Send className="h-3.5 w-3.5 mr-1" /> Send</Button>}
                  {o.status === 'Sent' && <><Button variant="ghost" size="sm" onClick={() => offerService.accept(o._id).then(fetchOffers)}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => offerService.reject(o._id).then(fetchOffers)}><XCircle className="h-3.5 w-3.5 mr-1" /> Reject</Button></>}
                </div>
              )},
            ]} searchable searchPlaceholder="Search offers..." />
          )}
        </CardContent>
      </Card>
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Offer</DialogTitle><DialogDescription>Create a new offer for a selected candidate</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-1 block">Application ID *</label><Input value={formData.applicationId} onChange={e => setFormData({ ...formData, applicationId: e.target.value })} placeholder="Application Object ID" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Candidate Name</label><Input value={formData.candidateName} onChange={e => setFormData({ ...formData, candidateName: e.target.value })} placeholder="Full name" /></div>
              <div><label className="text-sm font-medium mb-1 block">Candidate Email</label><Input value={formData.candidateEmail} onChange={e => setFormData({ ...formData, candidateEmail: e.target.value })} placeholder="email@example.com" /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Job Title</label><Input value={formData.jobTitle} onChange={e => setFormData({ ...formData, jobTitle: e.target.value })} placeholder="Job title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Min Salary (LPA)</label><Input type="number" value={formData.salaryMin} onChange={e => setFormData({ ...formData, salaryMin: e.target.value })} placeholder="10" /></div>
              <div><label className="text-sm font-medium mb-1 block">Max Salary (LPA)</label><Input type="number" value={formData.salaryMax} onChange={e => setFormData({ ...formData, salaryMax: e.target.value })} placeholder="25" /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Notes</label><textarea className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm" rows={3} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Offer details..." /></div>
            <div className="flex gap-3 justify-end"><Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button><Button className="bg-gradient-to-r from-primary to-purple-500" onClick={handleCreate}>Create Offer</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
