import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function RouteLoadingIndicator() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handleStart = () => setLoading(true)
    const handleEnd = () => setLoading(false)
    window.addEventListener('route-change-start', handleStart)
    window.addEventListener('route-change-end', handleEnd)
    return () => {
      window.removeEventListener('route-change-start', handleStart)
      window.removeEventListener('route-change-end', handleEnd)
    }
  }, [])

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-gradient-to-r from-primary via-purple-500 to-blue-500 origin-left"
          style={{ transformOrigin: 'left' }}
          role="progressbar"
          aria-label="Page loading"
        />
      )}
    </AnimatePresence>
  )
}

export function triggerRouteStart() {
  window.dispatchEvent(new Event('route-change-start'))
}

export function triggerRouteEnd() {
  setTimeout(() => window.dispatchEvent(new Event('route-change-end')), 300)
}
