import { motion } from 'framer-motion'
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  type?: 'network' | 'page' | 'empty' | 'generic'
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ type = 'generic', title, message, onRetry, className }: ErrorStateProps) {
  const config = {
    network: { icon: WifiOff, title: 'Network Error', message: 'Unable to connect. Please check your internet connection.' },
    page: { icon: AlertTriangle, title: 'Something went wrong', message: 'An unexpected error occurred. Please try again.' },
    empty: { icon: AlertTriangle, title: 'No data available', message: 'There is nothing to display right now.' },
    generic: { icon: AlertTriangle, title: 'Error', message: 'An error occurred. Please try again.' },
  }
  const c = config[type]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <c.icon className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{title || c.title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{message || c.message}</p>
      {onRetry && <Button variant="outline" onClick={onRetry}><RefreshCw className="h-4 w-4 mr-2" /> Try Again</Button>}
    </motion.div>
  )
}