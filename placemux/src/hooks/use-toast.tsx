import { useState, useCallback, createContext, useContext, type ReactNode } from 'react'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'info'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastCtx = createContext<ToastContextType>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

export function ToastContextProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])
  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { ...t, id }])
    setTimeout(() => removeToast(id), 4000)
  }, [removeToast])
  return (
    <ToastCtx.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
