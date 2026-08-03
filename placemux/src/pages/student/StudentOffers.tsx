import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useConfirm } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import apiClient from '@/lib/api'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { DashboardSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import {
  Mail, CheckCircle2, XCircle, Clock, Building2,
  Briefcase, Calendar, Send, Award
} from 'lucide-react'

interface StudentOffer {
  _id: string
  candidateName: string
  candidateEmail: string
  jobTitle: string
  companyName: string
  companyLogo: string
  companyIndustry: string
  companyLocation: string
  salaryMin: number
  salaryMax: number
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired'
  sentDate: string
  expiryDate: string
  acceptedDate: string
  rejectedDate: string
  notes: string
  createdAt: string
}

const statusColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
  Draft: 'secondary', Sent: 'info', Accepted: 'success', Rejected: 'destructive', Expired: 'default',
}

export function StudentOffers() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offers, setOffers] = useState<StudentOffer[]>([])
  const [selectedOffer, setSelectedOffer] = useState<StudentOffer | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const { addToast } = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get('/offers')
      setOffers(res.data.data || [])
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to load offers')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchOffers() }, [])

  if (loading) return <PageTransition><DashboardSkeleton /></PageTransition>
  if (error) return <PageTransition><ErrorState type="page" message={error} onRetry={fetchOffers} /></PageTransition>

  const stats = {
    total: offers.length, sent: offers.filter(o => o.status === 'Sent').length,
    accepted: offers.filter(o => o.status === 'Accepted').length,
    rejected: offers.filter(o => o.status === 'Rejected').length,
  }

  const handleRowClick = (offer: StudentOffer) => {
    setSelectedOffer(offer)
    setShowDetail(true)
  }

  const handleAccept = async (offer: StudentOffer) => {
    const confirmed = await confirm('Accept Offer', 'Are you sure you want to accept the offer for ' + offer.jobTitle + ' at ' + offer.companyName + '? This action cannot be undone.')
    if (!confirmed) return
    setActionLoading(prev => ({ ...prev, ['accept-' + offer._id]: true }))
    try {
      const res = await apiClient.post('/offers/' + offer._id + '/accept')
      addToast({ title: 'Offer Accepted!', description: res.data.message || 'Congratulations! Offer accepted.', variant: 'success' })
      setOffers(prev => prev.map(o => o._id === offer._id ? { ...o, status: 'Accepted' as const } : o))
      if (selectedOffer?._id === offer._id) setSelectedOffer(prev => prev ? { ...prev, status: 'Accepted' } : prev)
      setShowDetail(false)
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to accept offer', variant: 'error' })
    } finally { setActionLoading(prev => ({ ...prev, ['accept-' + offer._id]: false })) }
  }

  const handleReject = async (offer: StudentOffer) => {
    const confirmed = await confirm('Reject Offer', 'Are you sure you want to reject the offer for ' + offer.jobTitle + ' at ' + offer.companyName + '? This action cannot be undone.')
    if (!confirmed) return
    setActionLoading(prev => ({ ...prev, ['reject-' + offer._id]: true }))
    try {
      const res = await apiClient.post('/offers/' + offer._id + '/reject')
      addToast({ title: 'Offer Rejected', description: res.data.message || 'Offer rejected.', variant: 'info' })
      setOffers(prev => prev.map(o => o._id === offer._id ? { ...o, status: 'Rejected' as const } : o))
      if (selectedOffer?._id === offer._id) setSelectedOffer(prev => prev ? { ...prev, status: 'Rejected' } : prev)
      setShowDetail(false)
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to reject offer', variant: 'error' })
    } finally { setActionLoading(prev => ({ ...prev, ['reject-' + offer._id]: false })) }
  }

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return 'Negotiable'
    const ml = (v: number) => '\u20B9' + (v / 100000).toFixed(1) + 'L'
    return min && max ? ml(min) + ' - ' + ml(max) : min ? ml(min) : max ? ml(max) : ''
  }

  return (
    <main className="space-y-8" aria-label="My offers">
      <ConfirmDialog />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">My Offers</h1><p className="text-muted-foreground mt-1">View and manage your job offers</p></div>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><Mail className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Offers</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Send className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.sent}</p><p className="text-xs text-muted-foreground">Pending Response</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.accepted}</p><p className="text-xs text-muted-foreground">Accepted</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><XCircle className="h-8 w-8 text-destructive mx-auto mb-2" /><p className="text-2xl font-bold">{stats.rejected}</p><p className="text-xs text-muted-foreground">Rejected</p></CardContent></Card>
      </section>
      <Card>
        <CardHeader><CardTitle id="offers-title">All Offers</CardTitle></CardHeader>
        <CardContent aria-labelledby="offers-title">
          {offers.length === 0 ? (
            <EmptyState icon={Award} title="No offers yet" description="When a company sends you an offer, it will appear here" />
          ) : (
            <DataTable data={offers} columns={[
              { key: 'companyName', header: 'Company', sortable: true, render: (o: StudentOffer) => <div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div><span className="font-medium">{o.companyName || 'Unknown'}</span></div> },
              { key: 'jobTitle', header: 'Position', render: (o: StudentOffer) => <span>{o.jobTitle}</span> },
              { key: 'salaryMax', header: 'Package', render: (o: StudentOffer) => <span className="font-medium text-success">{formatSalary(o.salaryMin, o.salaryMax)}</span> },
              { key: 'status', header: 'Status', render: (o: StudentOffer) => <Badge variant={statusColors[o.status] || 'default'}>{o.status}</Badge> },
              { key: 'sentDate', header: 'Received', render: (o: StudentOffer) => <span className="text-xs">{o.sentDate ? new Date(o.sentDate).toLocaleDateString() : '-'}</span> },
              { key: 'expiryDate', header: 'Expires', render: (o: StudentOffer) => {
                if (!o.expiryDate) return <span className="text-xs text-muted-foreground">No expiry</span>
                const isExpired = new Date(o.expiryDate) < new Date()
                return <span className={`text-xs ${isExpired ? 'text-destructive font-medium' : ''}`}>{new Date(o.expiryDate).toLocaleDateString()}{isExpired ? ' (Expired)' : ''}</span>
              }},
              { key: 'actions', header: '', render: (o: StudentOffer) => (
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  {o.status === 'Sent' && (
                    <>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-success" onClick={() => handleAccept(o)} disabled={actionLoading['accept-' + o._id]}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={() => handleReject(o)} disabled={actionLoading['reject-' + o._id]}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </>
                  )}
                  {(o.status === 'Accepted' || o.status === 'Rejected') && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleRowClick(o)}>View</Button>
                  )}
                </div>
              )},
            ]} searchable searchPlaceholder="Search offers..." onRowClick={handleRowClick} />
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Offer Details</DialogTitle></DialogHeader>
          {selectedOffer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Company</p><p className="font-medium">{selectedOffer.companyName}</p></div>
                <div><p className="text-sm text-muted-foreground">Position</p><p className="font-medium">{selectedOffer.jobTitle}</p></div>
                <div><p className="text-sm text-muted-foreground">Package</p><p className="font-medium text-success">{formatSalary(selectedOffer.salaryMin, selectedOffer.salaryMax)}</p></div>
                <div><p className="text-sm text-muted-foreground">Status</p><Badge variant={statusColors[selectedOffer.status]}>{selectedOffer.status}</Badge></div>
                <div><p className="text-sm text-muted-foreground">Sent</p><p className="font-medium">{selectedOffer.sentDate ? new Date(selectedOffer.sentDate).toLocaleDateString() : '-'}</p></div>
                <div><p className="text-sm text-muted-foreground">Expires</p><p className="font-medium">{selectedOffer.expiryDate ? new Date(selectedOffer.expiryDate).toLocaleDateString() : '-'}</p></div>
              </div>
              {selectedOffer.notes && (
                <div><p className="text-sm text-muted-foreground mb-1">Notes</p><p className="text-sm bg-muted/10 rounded-lg p-3">{selectedOffer.notes}</p></div>
              )}
              <div className="flex gap-2 pt-2">
                {selectedOffer.status === 'Sent' && (
                  <>
                    <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => handleAccept(selectedOffer)}>Accept Offer</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReject(selectedOffer)}>Decline</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
