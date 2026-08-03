import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from '@/components/ui/toast'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const variantConfig: Record<string, { icon: React.ElementType; className: string }> = {
  default: { icon: Info, className: 'border-border/50' },
  success: { icon: CheckCircle2, className: 'border-green-500/30 bg-green-500/5' },
  error: { icon: AlertCircle, className: 'border-red-500/30 bg-red-500/5' },
  info: { icon: Info, className: 'border-blue-500/30 bg-blue-500/5' },
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <ToastProvider>
      <ToastViewport>
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const config = variantConfig[toast.variant || 'default']
            const Icon = config.icon
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Toast className={cn('flex items-start gap-3', config.className)}>
                  <Icon className={cn(
                    'h-5 w-5 mt-0.5 shrink-0',
                    toast.variant === 'success' && 'text-green-500',
                    toast.variant === 'error' && 'text-red-500',
                    toast.variant === 'info' && 'text-blue-500',
                    (!toast.variant || toast.variant === 'default') && 'text-muted-foreground'
                  )} />
                  <div className="flex-1 min-w-0">
                    <ToastTitle>{toast.title}</ToastTitle>
                    {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
                  </div>
                  <ToastClose onClick={() => removeToast(toast.id)} aria-label="Dismiss notification">
                    <X className="h-4 w-4" />
                  </ToastClose>
                </Toast>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </ToastViewport>
    </ToastProvider>
  )
}
