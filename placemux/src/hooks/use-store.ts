import { useState, useCallback } from 'react'

export function useSidebar() {
  const [open, setOpen] = useState(true)
  const toggle = useCallback(() => setOpen((prev) => !prev), [])
  return { open, setOpen, toggle }
}

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(2)
  const markAllRead = useCallback(() => setUnreadCount(0), [])
  const markRead = useCallback(() => {
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])
  return { unreadCount, markAllRead, markRead }
}
