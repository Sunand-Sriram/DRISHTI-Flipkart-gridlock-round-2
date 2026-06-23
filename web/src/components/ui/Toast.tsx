import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald" />,
  error: <XCircle className="h-5 w-5 text-crimson" />,
  info: <Info className="h-5 w-5 text-cyan" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber" />,
}

const borderColors: Record<ToastVariant, string> = {
  success: 'border-l-emerald',
  error: 'border-l-crimson',
  info: 'border-l-cyan',
  warning: 'border-l-amber',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = ++toastId
    setToasts((t) => [...t, { id, message, variant }])
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id))
    }, 5000)
  }, [])

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  const value: ToastContextValue = {
    success: (m) => addToast(m, 'success'),
    error: (m) => addToast(m, 'error'),
    info: (m) => addToast(m, 'info'),
    warning: (m) => addToast(m, 'warning'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[300] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: 100, opacity: 0, scale: 0.95 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 100, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className={cn(
                'glass-strong rounded-xl p-4 flex items-start gap-3 pointer-events-auto border-l-4',
                borderColors[toast.variant],
              )}
            >
              <span className="shrink-0 mt-0.5">{icons[toast.variant]}</span>
              <p className="text-sm text-text-primary flex-1">{toast.message}</p>
              <button onClick={() => remove(toast.id)} className="shrink-0 text-text-muted hover:text-text-primary">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
