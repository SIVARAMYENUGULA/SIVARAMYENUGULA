import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CommandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children?: React.ReactNode
}

export function CommandDialog({ open, onOpenChange, children }: CommandDialogProps) {
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]">
        {children}
      </div>
    </div>
  )
}

export interface CommandProps {
  children?: React.ReactNode
  className?: string
  placeholder?: string
  onSearch?: (value: string) => void
}

export function Command({ children, className, placeholder = 'Search...', onSearch }: CommandProps) {
  const [query, setQuery] = React.useState('')

  return (
    <div className={cn('rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden', className)}>
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          autoFocus
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onSearch?.(e.target.value)
          }}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <kbd className="hidden rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs text-muted-foreground sm:inline-block">
          ESC
        </kbd>
      </div>
      <div className="max-h-72 overflow-y-auto p-2">
        {children}
      </div>
    </div>
  )
}

export interface CommandGroupProps {
  heading?: string
  children?: React.ReactNode
  className?: string
}

export function CommandGroup({ heading, children, className }: CommandGroupProps) {
  return (
    <div className={cn('mb-2', className)}>
      {heading && (
        <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</p>
      )}
      <div>{children}</div>
    </div>
  )
}

export interface CommandItemProps {
  children?: React.ReactNode
  onSelect?: () => void
  className?: string
  disabled?: boolean
}

export function CommandItem({ children, onSelect, className, disabled }: CommandItemProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}
