import { ShieldAlert, ShieldCheck, Maximize2, Monitor, Columns } from 'lucide-react'
import type { ProctoringState, ProctoringEvent } from '@/hooks/useProctoring'

interface ProctoringOverlayProps {
  state: ProctoringState
  onRequestFullscreen: () => void
  events: ProctoringEvent[]
}

export function ProctoringOverlay({ state, onRequestFullscreen, events }: ProctoringOverlayProps) {
  if (!state.fullscreenEnabled) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
        <div className="text-center space-y-6 max-w-md mx-auto p-8">
          <div className="h-20 w-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <Maximize2 className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-white">Fullscreen Required</h2>
          <p className="text-muted-foreground">
            This assessment requires fullscreen mode. Please click the button below to enable it.
          </p>
          <button
            onClick={onRequestFullscreen}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
            Enter Fullscreen Mode
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex items-center justify-between px-4 py-2 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
            state.violationCount === 0
              ? 'bg-success/10 text-success'
              : state.violationCount < 3
                ? 'bg-warning/10 text-warning'
                : 'bg-destructive/10 text-destructive'
          }`}>
            {state.violationCount === 0 ? (
              <ShieldCheck className="h-3.5 w-3.5" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5" />
            )}
            {state.violationCount === 0 ? 'Secure' : `${state.violationCount} violation${state.violationCount !== 1 ? 's' : ''}`}
          </div>

          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
            state.tabFocused ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          }`}>
            <Monitor className="h-3 w-3" />
            {state.tabFocused ? 'Focused' : 'Away'}
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Columns className="h-3 w-3" />
          <span>{events.length} events logged</span>
        </div>
      </div>
    </div>
  )
}
