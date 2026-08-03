import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted/40', className)} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between">
        <div className="space-y-2"><Pulse className="h-8 w-64" /><Pulse className="h-4 w-40" /></div>
        <Pulse className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1,2,3,4].map(i => (
          <Card key={i}><CardContent className="pt-6 space-y-3"><Pulse className="h-4 w-20" /><Pulse className="h-8 w-16" /><Pulse className="h-3 w-24" /></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><Pulse className="h-5 w-40" /></CardHeader><CardContent className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="flex gap-4"><Pulse className="h-4 flex-1" /><Pulse className="h-4 w-24" /><Pulse className="h-4 w-20" /></div>)}
      </CardContent></Card>
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Pulse className="h-10 w-full rounded-xl" />
      {Array.from({length:rows}).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Pulse className="h-8 flex-[2]" />
          <Pulse className="h-8 flex-1" />
          <Pulse className="h-8 w-24" />
          <Pulse className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return <Card><CardContent className="pt-6 space-y-3"><Pulse className="h-4 w-20" /><Pulse className="h-8 w-16" /><Pulse className="h-3 w-24" /></CardContent></Card>
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return <div className="rounded-xl border border-border/50 bg-card"><div className="flex items-center justify-center" style={{height}}><Pulse className="h-[80%] w-[90%] rounded-lg" /></div></div>
}

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3 p-8">
      <Card><CardContent className="pt-6 space-y-4 text-center">
        <Pulse className="h-24 w-24 rounded-full mx-auto" />
        <Pulse className="h-5 w-32 mx-auto" />
        <Pulse className="h-4 w-48 mx-auto" />
        <Pulse className="h-8 w-full" />
      </CardContent></Card>
      <div className="lg:col-span-2 space-y-6">
        {[1,2,3].map(i => (
          <Card key={i}><CardContent className="pt-6 space-y-3">
            <Pulse className="h-5 w-32" />
            {[1,2,3,4].map(j => <Pulse key={j} className="h-10 w-full" />)}
          </CardContent></Card>
        ))}
      </div>
    </div>
  )
}