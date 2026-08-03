import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ElementType
  className?: string
  delay?: number
}

export function MetricCard({ label, value, change, trend, icon: Icon, className, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change !== undefined && trend && (
            <div className="flex items-center gap-1">
              {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-success" />}
              {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
              {trend === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              <span
                className={cn(
                  'text-xs font-medium',
                  trend === 'up' && 'text-success',
                  trend === 'down' && 'text-destructive',
                  trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {change > 0 ? '+' : ''}{change}% from last month
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
