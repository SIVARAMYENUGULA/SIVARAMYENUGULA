import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { useToast } from '@/hooks/use-toast'
import { supportService, type SupportTicket } from '@/services/support'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle, Eye } from 'lucide-react'

export function StudentSupport() {
  const { addToast } = useToast()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ subject: '', message: '', category: 'General', priority: 'Medium' })

  const fetchTickets = async () => {
    try {
      const data = await supportService.getAll()
      setTickets(data)
    } catch (err: any) {
      setPageError(err?.response?.data?.error?.message || 'Failed to load tickets')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const openCount = tickets.filter(t => t.status === 'Open').length
  const resolvedCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.message.trim()) {
      addToast({ title: 'Validation', description: 'Subject and message are required', variant: 'error' })
      return
    }
    setSaving(true)
    try {
      await supportService.create(form)
      addToast({ title: 'Ticket Created', description: 'Your support request has been submitted', variant: 'success' })
      setShowCreateDialog(false)
      setForm({ subject: '', message: '', category: 'General', priority: 'Medium' })
      fetchTickets()
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to create ticket', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (status: string) => {
    const variantMap: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
      'Open': 'info',
      'In Progress': 'warning',
      'Resolved': 'success',
      'Closed': 'secondary',
    }
    return <Badge variant={variantMap[status] || 'secondary'} className="text-[10px]">{status}</Badge>
  }

  const priorityBadge = (p: string) => {
    const variantMap: Record<string, 'destructive' | 'warning' | 'info' | 'secondary'> = {
      'Urgent': 'destructive',
      'High': 'warning',
      'Medium': 'info',
      'Low': 'secondary',
    }
    return <Badge variant={variantMap[p] || 'secondary'} className="text-[10px]">{p}</Badge>
  }

  return (
    <main className="space-y-8" aria-label="Help and support">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground mt-1">Submit requests and track their progress</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Ticket
        </Button>
      </div>

      <section aria-label="Support statistics">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="pt-6 text-center"><LifeBuoy className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{tickets.length}</p><p className="text-xs text-muted-foreground">Total Tickets</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{openCount}</p><p className="text-xs text-muted-foreground">Open</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{resolvedCount}</p><p className="text-xs text-muted-foreground">Resolved</p></CardContent></Card>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle id="tickets-title">My Support Tickets</CardTitle></CardHeader>
        <CardContent aria-labelledby="tickets-title">
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No support tickets" description="Create a ticket to get help from our team" action={{ label: 'Create Ticket', onClick: () => setShowCreateDialog(true) }} />
          ) : (
            <DataTable
              data={tickets}
              columns={[
                { key: 'subject', header: 'Subject', sortable: true, render: (t: SupportTicket) => <span className="font-medium">{t.subject}</span> },
                { key: 'category', header: 'Category', render: (t: SupportTicket) => <Badge variant="secondary" className="text-[10px]">{t.category}</Badge> },
                { key: 'status', header: 'Status', render: (t: SupportTicket) => statusBadge(t.status) },
                { key: 'priority', header: 'Priority', render: (t: SupportTicket) => priorityBadge(t.priority) },
                { key: 'createdAt', header: 'Created', render: (t: SupportTicket) => <span className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</span> },
                { key: 'actions', header: '', render: (t: SupportTicket) => (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTicket(t)} aria-label="View ticket">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                )},
              ]}
              searchable
              searchPlaceholder="Search tickets..."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) setForm({ subject: '', message: '', category: 'General', priority: 'Medium' }) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-primary" /> Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief description of your issue" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Account">Account</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                  <SelectItem value="Placement">Placement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} rows={5} placeholder="Describe your issue in detail..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving} className="gap-2">
                {saving ? 'Submitting...' : <><MessageSquare className="h-4 w-4" /> Submit Ticket</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {statusBadge(selectedTicket.status)}
                {priorityBadge(selectedTicket.priority)}
                <Badge variant="secondary" className="text-[10px]">{selectedTicket.category}</Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground mb-1">Your message:</p>
                <p className="text-sm">{selectedTicket.message}</p>
                <p className="text-xs text-muted-foreground mt-2">Submitted on {new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              {selectedTicket.adminReply && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1"><MessageSquare className="h-4 w-4 text-primary" /> Admin Response:</p>
                  <p className="text-sm">{selectedTicket.adminReply}</p>
                  {selectedTicket.repliedAt && (
                    <p className="text-xs text-muted-foreground mt-2">Replied on {new Date(selectedTicket.repliedAt).toLocaleString()}</p>
                  )}
                </div>
              )}
              {!selectedTicket.adminReply && selectedTicket.status !== 'Closed' && (
                <div className="p-4 rounded-lg bg-muted/20 text-center">
                  <p className="text-sm text-muted-foreground">Waiting for admin response...</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
