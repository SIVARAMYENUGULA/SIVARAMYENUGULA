import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'destructive', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onCancel}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm rounded-xl border border-border/50 bg-card p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10')}>
                <AlertTriangle className={cn('h-5 w-5', variant === 'destructive' ? 'text-destructive' : 'text-primary')} />
              </div>
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={onCancel} aria-label={cancelLabel}>{cancelLabel}</Button>
              <Button variant={variant === 'destructive' ? 'destructive' : 'default'} onClick={onConfirm} aria-label={confirmLabel}>{confirmLabel}</Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function useConfirm() {
  const [state, setState] = useState<{ open: boolean; title: string; message: string; resolve?: (v: boolean) => void }>({ open: false, title: '', message: '' })
  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise(resolve => {
      setState({ open: true, title, message, resolve })
    })
  }
  const handleConfirm = () => { state.resolve?.(true); setState({ open: false, title: '', message: '' }) }
  const handleCancel = () => { state.resolve?.(false); setState({ open: false, title: '', message: '' }) }
  return { confirm, ConfirmDialog: () => <ConfirmDialog open={state.open} title={state.title} message={state.message} onConfirm={handleConfirm} onCancel={handleCancel} /> }
}
