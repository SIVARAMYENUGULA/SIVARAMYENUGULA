import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/empty-state'
import apiClient from '@/lib/api'
import { Download, Shield, Clock, Activity, AlertTriangle, Eye } from 'lucide-react'

import { useState, useEffect } from 'react'
import { PageTransition } from '@/components/shared/page-transition'
import { TableSkeleton } from '@/components/ui/loading'
import { ErrorState } from '@/components/shared/error-state'

export function AdminAudit() {
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError] = useState<null | string>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/audit-logs', { params: { limit: 100 } })
        setLogs(res.data.data || [])
        setTotal(res.data.pagination?.total || 0)
      } catch (err: any) {
        setPageError(err?.response?.data?.error?.message || 'Failed to load audit logs')
      } finally {
        setPageLoading(false)
      }
    }
    fetchData()
  }, [])

  if (pageLoading) return <PageTransition><TableSkeleton /></PageTransition>
  if (pageError) return <PageTransition><ErrorState type="page" message={pageError} onRetry={() => window.location.reload()} /></PageTransition>

  return (
    <main className="space-y-8" aria-label="Audit logs">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div><h1 className="text-3xl font-bold">Audit Logs</h1><p className="text-muted-foreground mt-1">System activity and security monitoring</p></div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" aria-label="Export logs"><Download className="h-4 w-4 mr-2" /> Export</Button>
        </div>
      </div>

      <section aria-label="Audit statistics">
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6 text-center"><Activity className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Events</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Shield className="h-8 w-8 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{logs.filter((l:any)=>l.userId?.role==='admin').length}</p><p className="text-xs text-muted-foreground">Admin Actions</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><AlertTriangle className="h-8 w-8 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">0</p><p className="text-xs text-muted-foreground">Alerts</p></CardContent></Card>
          <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 text-info mx-auto mb-2" /><p className="text-2xl font-bold">Real-time</p><p className="text-xs text-muted-foreground">Live Feed</p></CardContent></Card>
        </div>
      </section>

      <Card>
        <CardHeader><CardTitle id="activity-log-title">Activity Log</CardTitle></CardHeader>
        <CardContent aria-labelledby="activity-log-title">
          {logs.length === 0 ? (
            <EmptyState icon={Eye} title="No audit logs" description="System activity logs will appear here" />
          ) : (
            <DataTable data={logs} columns={[
              {key:'action',header:'Action',sortable:true,render:(l:any)=><span className="font-medium">{l.action}</span>},
              {key:'userId',header:'User',render:(l:any)=><span>{l.userId?.name || l.userId?.email || 'Unknown'}</span>},
              {key:'resource',header:'Resource',render:(l:any)=><Badge variant="secondary" className="text-[10px]">{l.resource || '-'}</Badge>},
              {key:'details',header:'Details',render:(l:any)=><span className="text-xs text-muted-foreground">{l.details || '-'}</span>},
              {key:'createdAt',header:'Timestamp',render:(l:any)=><span className="text-xs">{new Date(l.createdAt).toLocaleString()}</span>},
            ]} searchable searchPlaceholder="Search audit logs..." />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
