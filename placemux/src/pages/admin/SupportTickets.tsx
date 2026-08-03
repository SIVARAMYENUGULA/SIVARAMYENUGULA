import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { supportService, type SupportTicket } from '@/services/support'
import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'
import { LifeBuoy, MessageSquare, Clock, CheckCircle, Reply, Filter, BarChart3 } from 'lucide-react'

export function AdminSupportTickets() {
  const { addToast } = useToast()
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<{ total: number; open: number; inProgress: number; resolved: number; closed: number } | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = async (status?: string) => {
    try {
      const params = status ? { status } : {}
      const [ticketsData, statsData] = await Promise.all([
        supportService.getAll(params),
        supportService.getStats(),
      ])
      setTickets(ticketsData)
      setStats(statsData)
    } catch (err: any) {
      setPageError(err?.response?.data?.error?.message || 'Failed to load tickets')
    } finally {
      setPageLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return
    setSaving(true)
    try {
      const updated = await supportService.reply(selectedTicket._id, replyText)
      setSelectedTicket(updated)
      setReplyText('')
      addToast({ title: 'Reply Sent', description: 'Your response has been sent to the student', variant: 'success' })
      fetchData(filterStatus || undefined)
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to send reply', variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await supportService.updateStatus(id, status)
      addToast({ title: 'Status Updated', description: `Ticket moved to ${status}`, variant: 'success' })
      fetchData(filterStatus || undefined)
      if (selectedTicket?._id === id) {
        setSelectedTicket((prev: SupportTicket | null) => prev ? { ...prev, status: status as SupportTicket['status'] } : prev)
      }
    } catch (err: any) {
      addToast({ title: 'Error', description: err?.response?.data?.error?.message || 'Failed to update status', variant: 'error' })
    }
  }

  const statusBadge = (status: string) => {
    const variantMap: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
      'Open': 'info',
      'In Progress': 'warning',
      'Resolved': 'success',
      'Closed': 'secondary',
    }
    return <Badge variant={variantMap[status] || 'secondary'}>{status}</Badge>
  }

  return (
    <main className="space-y-8" aria-label="Support ticket management">
      <div>
        <h1 className="text-3xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground mt-1">Manage student support requests</p>
      </div>

      {stats && (
        <section aria-label="Ticket statistics">
          <div className="grid gap-4 md:grid-cols-5">
            <Card><CardContent className="pt-6 text-center"><BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><LifeBuoy className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.open}</p><p className="text-xs text-muted-foreground">Open</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{stats.inProgress}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.resolved}</p><p className="text-xs text-muted-foreground">Resolved</p></CardContent></Card>
            <Card><CardContent className="pt-6 text-center"><CheckCircle className="h-8 w-8 text-secondary mx-auto mb-2" /><p className="text-2xl font-bold">{stats.closed}</p><p className="text-xs text-muted-foreground">Closed</p></CardContent></Card>
          </div>
        </section>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); fetchData(e.target.value || undefined) }}
            className="px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <span className="text-sm text-muted-foreground">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</span>
      </div>

      <Card>
        <CardContent>
          {tickets.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No tickets found" description="No support tickets match your filters" />
          ) : (
            <DataTable
              data={tickets}
              columns={[
                { key: 'subject', header: 'Subject', sortable: true, render: (t: SupportTicket) => <span className="font-medium">{t.subject}</span> },
                { key: 'student', header: 'Student', render: (t: SupportTicket) => <span className="text-sm">{t.userId?.name || 'Unknown'}</span> },
                { key: 'email', header: 'Email', render: (t: SupportTicket) => <span className="text-xs text-muted-foreground">{t.userId?.email || ''}</span> },
                { key: 'category', header: 'Category', render: (t: SupportTicket) => <Badge variant="secondary" className="text-[10px]">{t.category}</Badge> },
                { key: 'status', header: 'Status', render: (t: SupportTicket) => statusBadge(t.status) },
                { key: 'priority', header: 'Priority', render: (t: SupportTicket) => {
                  const col: Record<string, 'destructive' | 'warning' | 'info' | 'secondary'> = { 'Urgent': 'destructive', 'High': 'warning', 'Medium': 'info', 'Low': 'secondary' }
                  return <Badge variant={col[t.priority] || 'secondary'} className="text-[10px]">{t.priority}</Badge>
                }},
                { key: 'createdAt', header: 'Date', render: (t: SupportTicket) => <span className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</span> },
                { key: 'actions', header: '', render: (t: SupportTicket) => (
                  <Button variant="ghost" size="sm" className="h-8" onClick={() => { setSelectedTicket(t); setReplyText('') }}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1" /> Manage
                  </Button>
                )},
              ]}
              searchable
              searchPlaceholder="Search tickets..."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null) }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {statusBadge(selectedTicket.status)}
                  <Badge variant="secondary">{selectedTicket.category}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{selectedTicket.userId?.name} &lt;{selectedTicket.userId?.email}&gt;</span>
              </div>

              <div className="p-4 rounded-lg bg-muted/20">
                <p className="text-sm font-medium mb-1">Student Message:</p>
                <p className="text-sm">{selectedTicket.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>

              {selectedTicket.adminReply && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm font-medium mb-1">Your Reply:</p>
                  <p className="text-sm">{selectedTicket.adminReply}</p>
                  <p className="text-xs text-muted-foreground mt-2">{selectedTicket.repliedAt ? new Date(selectedTicket.repliedAt).toLocaleString() : ''}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminReply">Reply to Student</Label>
                <Textarea
                  id="adminReply"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Type your response..."
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Select defaultValue="" onValueChange={(v) => { if (v) handleStatusChange(selectedTicket._id, v) }}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Change Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleReply} disabled={saving || !replyText.trim()} className="gap-2">
                  <Reply className="h-4 w-4" /> {saving ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
