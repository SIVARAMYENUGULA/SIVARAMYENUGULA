import { useState, useEffect, useCallback, useRef } from 'react'

export type ProctoringEventType = 'tab_switch' | 'fullscreen_exit' | 'camera_disconnect' | 'copy_paste' | 'browser_blur' | 'suspicious_activity' | 'camera_health' | 'keyboard_shortcut' | 'multiple_faces' | 'face_not_visible' | 'audio_multiple_voices' | 'object_detected_book' | 'camera_quality_degraded' | 'face_not_matched' | 'looking_away' | 'devtools_opened'
export type Severity = 'info' | 'warning' | 'critical'

export interface ProctoringEvent {
  type: ProctoringEventType
  severity: Severity
  timestamp: number
  details: string
}

export interface ProctoringState {
  cameraEnabled: boolean
  micEnabled: boolean
  fullscreenEnabled: boolean
  tabFocused: boolean
  browserFocused: boolean
  violationCount: number
  events: ProctoringEvent[]
  mediaStream: MediaStream | null
  cameraError: string | null
  micError: string | null
}

interface UseProctoringOptions {
  sessionId?: string
  onViolation?: (event: ProctoringEvent) => void
  onCriticalViolation?: (event: ProctoringEvent) => void
}

export function useProctoring(options: UseProctoringOptions = {}) {
  const [state, setState] = useState<ProctoringState>({
    cameraEnabled: false,
    micEnabled: false,
    fullscreenEnabled: !!document.fullscreenElement,
    tabFocused: !document.hidden,
    browserFocused: document.hasFocus(),
    violationCount: 0,
    events: [],
    mediaStream: null,
    cameraError: null,
    micError: null,
  })

  const streamRef = useRef<MediaStream | null>(null)
  const eventsRef = useRef<ProctoringEvent[]>([])
  const { onViolation, onCriticalViolation } = options

  const addEvent = useCallback((type: ProctoringEventType, severity: Severity, details: string) => {
    const event: ProctoringEvent = { type, severity, timestamp: Date.now(), details }
    eventsRef.current = [...eventsRef.current, event]
    setState(prev => ({
      ...prev,
      events: eventsRef.current,
      violationCount: eventsRef.current.filter(e => e.severity !== 'info').length,
    }))
    if (severity === 'critical' && onCriticalViolation) onCriticalViolation(event)
    if (onViolation) onViolation(event)
  }, [onViolation, onCriticalViolation])

  // Camera & Microphone initialization
  const initMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: 'user' },
        audio: true,
      })
      streamRef.current = stream
      setState(prev => ({ ...prev, mediaStream: stream, cameraEnabled: true, micEnabled: true, cameraError: null, micError: null }))
      return stream
    } catch (err: any) {
      const isCameraErr = err.name === 'NotAllowedError' || err.name === 'NotFoundError' || err.name === 'NotReadableError' || err.name === 'OverconstrainedError'
      setState(prev => ({
        ...prev,
        cameraEnabled: !isCameraErr,
        micEnabled: isCameraErr,
        cameraError: isCameraErr ? err.message : null,
        micError: !isCameraErr ? err.message : null,
      }))
      addEvent('camera_disconnect', 'warning', `Media error: ${err.message}`)
      return null
    }
  }, [addEvent])

  // Fullscreen enforcement
  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen()
        setState(prev => ({ ...prev, fullscreenEnabled: true }))
      }
    } catch { /* ignored */ }
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  // Tab switch detection
  useEffect(() => {
    const handleVisibility = () => {
      const hidden = document.hidden
      setState(prev => ({ ...prev, tabFocused: !hidden }))
      if (hidden) addEvent('tab_switch', 'warning', 'Student switched tabs')
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [addEvent])

  // Browser focus detection
  useEffect(() => {
    const handleFocus = () => setState(prev => ({ ...prev, browserFocused: true }))
    const handleBlur = () => {
      setState(prev => ({ ...prev, browserFocused: false }))
      addEvent('browser_blur', 'warning', 'Browser lost focus')
    }
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [addEvent])

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreen = () => {
      const isFullscreen = !!document.fullscreenElement
      setState(prev => ({ ...prev, fullscreenEnabled: isFullscreen }))
      if (!isFullscreen) addEvent('fullscreen_exit', 'critical', 'Student exited fullscreen mode')
    }
    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [addEvent])

  // Copy/Paste detection
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      addEvent('copy_paste', 'warning', 'Copy action detected and blocked')
    }
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      addEvent('copy_paste', 'warning', 'Paste action detected and blocked')
    }
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('cut', (e) => {
      e.preventDefault()
      addEvent('copy_paste', 'warning', 'Cut action detected and blocked')
    })
    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
    }
  }, [addEvent])

  // Context menu (right-click) prevention
  useEffect(() => {
    const handleContext = (e: MouseEvent) => {
      e.preventDefault()
      addEvent('suspicious_activity', 'warning', 'Right-click detected and blocked')
    }
    document.addEventListener('contextmenu', handleContext)
    return () => document.removeEventListener('contextmenu', handleContext)
  }, [addEvent])

  // DevTools detection
  useEffect(() => {
    let devtoolsOpen = false
    const threshold = 160

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold
      const heightThreshold = window.outerHeight - window.innerHeight > threshold
      const isOpen = widthThreshold || heightThreshold

      if (isOpen && !devtoolsOpen) {
        devtoolsOpen = true
        addEvent('devtools_opened', 'critical', 'Developer tools detected')
      } else if (!isOpen && devtoolsOpen) {
        devtoolsOpen = false
      }
    }

    // Check periodically
    const devToolsInterval = setInterval(checkDevTools, 2000)

    return () => {
      clearInterval(devToolsInterval)
    }
  }, [addEvent])

  return { state, initMedia, requestFullscreen, cleanup, addEvent }
}

// Proctoring event logging to backend
export async function logProctoringEvent(
  sessionId: string,
  eventType: string,
  severity: string,
  details: string,
  metadata?: any
) {
  try {
    const { default: apiClient } = await import('@/lib/api')
    await apiClient.post(`/proctoring/sessions/${sessionId}/events`, {
      eventType,
      severity,
      details,
      metadata,
    })
  } catch (err) {
    console.error('Failed to log proctoring event:', err)
  }
}
