import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, MicOff, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface VideoState {
  videoWidth: number
  videoHeight: number
  readyState: number
  playing: boolean
}

interface CameraPreviewProps {
  stream: MediaStream | null
  cameraEnabled: boolean
  micEnabled: boolean
  cameraError?: string | null
  micError?: string | null
  className?: string
  /** Whether to mirror the video horizontally (default: true for selfie cams) */
  mirror?: boolean
  /** Called when video state changes (dimensions, readyState, playing) */
  onVideoState?: (state: VideoState) => void
}

export function CameraPreview({ stream, cameraEnabled, micEnabled, cameraError, micError, className = '', mirror: initialMirror = true, onVideoState }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mirror, setMirror] = useState(initialMirror)

  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current
      console.log('[DEBUG] CameraPreview stream:', stream.id, 'videoTracks:', stream.getVideoTracks().length)
      video.srcObject = stream
      console.log('[STEP4] CameraPreview MOUNTED — stream:', stream.id, '| videoTracks:', stream.getVideoTracks().length, '| audioTracks:', stream.getAudioTracks().length)
      console.log('[STEP5] srcObject ASSIGNED to video element')
      // Explicit play() required for Safari — autoPlay is not sufficient for remote streams
      video.play().then(() => {
        const state = {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          currentTime: video.currentTime,
          playing: true,
        }
        console.log('[DEBUG] onVideoState fired — play() success, state:', JSON.stringify(state))
        console.log('[STEP6] play() SUCCEEDED —', JSON.stringify(state), '| tracks:', stream.getVideoTracks().map(t => `kind=${t.kind} enabled=${t.enabled} readyState=${t.readyState}`))
        onVideoState?.(state)
      }).catch(err => {
        console.warn('[STEP6] play() FAILED:', err.message)
      })

      // Listen for metadata load (dimensions become available)
      const onMeta = () => {
        const state = {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          playing: !video.paused,
        }
        console.log('[DEBUG] metadata loaded — width:', video.videoWidth, 'height:', video.videoHeight, 'readyState:', video.readyState)
        console.log('[CameraPreview] loadedmetadata:', state)
        console.log('[DEBUG] onVideoState fired — loadedmetadata, state:', JSON.stringify(state))
        onVideoState?.(state)
      }
      video.addEventListener('loadedmetadata', onMeta)

      return () => {
        video.removeEventListener('loadedmetadata', onMeta)
      }
    }
  }, [stream, onVideoState])

  // Dimension polling: check every 500ms for up to 6s until video has valid dimensions
  // This catches scenarios where loadedmetadata fires before React re-renders,
  // or where the browser delays metadata loading for remote streams.
  useEffect(() => {
    if (!videoRef.current || !stream) return
    const video = videoRef.current
    let attempts = 0
    let cancelled = false
    const maxAttempts = 12 // 6 seconds total

    const poll = () => {
      if (cancelled) return
      attempts++
      const hasValidDimensions = video.videoWidth > 0 && video.videoHeight > 0
      if (hasValidDimensions || attempts >= maxAttempts) {
        const state = {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          playing: !video.paused,
        }
        console.log('[DEBUG] CameraPreview dimension poll — attempt', attempts, '|', state.videoWidth, 'x', state.videoHeight, 'rs:', state.readyState)
        if (hasValidDimensions) {
          console.log('[CameraPreview] Dimension poll fired onVideoState with:', state)
          onVideoState?.(state)
        }
        return
      }
      setTimeout(poll, 500)
    }
    poll()
    return () => { cancelled = true }
  }, [stream, onVideoState])

  // 2-second delayed dimension check to verify video is actually rendering
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current
      const timer = setTimeout(() => {
        console.log('[WEBRTC] Remote stream render check:', {
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          readyState: video.readyState,
          paused: video.paused,
          currentTime: video.currentTime,
          tracks: stream.getVideoTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState, id: t.id })),
        })

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.warn('[WEBRTC] FAILURE: video dimensions are 0 — video not rendering')
          console.warn('[WEBRTC] Failure point: srcObject assigned but video.play() did not produce frames')
          console.warn('[WEBRTC] Possible causes: Safari autoplay blocked, track not live, or no frames received yet')

          // Try calling play() again as a recovery attempt
          video.play().then(() => {
            console.log('[WEBRTC] Recovery play() succeeded, new state:', {
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
              readyState: video.readyState,
            })
          }).catch(err => {
            console.warn('[WEBRTC] Recovery play() failed:', err.message)
          })
        } else {
          console.log('[WEBRTC] SUCCESS: Video rendering OK -', video.videoWidth, 'x', video.videoHeight)
        }
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [stream])

  // Log when no stream is available
  useEffect(() => {
    if (!stream && cameraEnabled) {
      console.warn('[CameraPreview] cameraEnabled but no stream available')
    }
  }, [stream, cameraEnabled])

  return (
    <div className={`relative rounded-xl overflow-hidden border border-border/50 bg-black/90 ${className}`}>
      {cameraEnabled && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${mirror ? '-scale-x-100' : ''}`}
        />
      ) : (
        <div className="flex items-center justify-center h-full min-h-[180px] bg-muted/20">
          <CameraOff className="h-10 w-10 text-muted-foreground/40" />
        </div>
      )}

      <div className="absolute top-2 left-2 flex gap-1.5">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium backdrop-blur-sm ${
          cameraEnabled ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
        }`}>
          {cameraEnabled ? <CheckCircle2 className="h-3 w-3" /> : <CameraOff className="h-3 w-3" />}
          {cameraEnabled ? 'CAM' : 'OFF'}
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium backdrop-blur-sm ${
          micEnabled ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
        }`}>
          {micEnabled ? <CheckCircle2 className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
          {micEnabled ? 'MIC' : 'OFF'}
        </div>
      </div>

      {(cameraError || micError) && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-destructive/80 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-[10px] text-destructive-foreground">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span>{cameraError || micError}</span>
          </div>
        </div>
      )}

      <button
        onClick={() => setMirror(!mirror)}
        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        title="Toggle mirror"
      >
        <Camera className="h-3 w-3" />
      </button>
    </div>
  )
}
