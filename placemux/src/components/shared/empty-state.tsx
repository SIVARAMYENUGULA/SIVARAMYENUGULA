import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: { label: string; onClick?: () => void }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col items-center justify-center py-16 text-center', className)}
    >
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30">
          <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
      {action && <Button variant="outline" onClick={action.onClick}>{action.label}</Button>}
    </motion.div>
  )
}