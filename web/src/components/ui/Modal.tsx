import { type ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  wide?: boolean
  citizen?: boolean
}

export function Modal({ open, onClose, children, title, wide, citizen }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'relative z-10 w-full rounded-2xl overflow-hidden',
              wide ? 'max-w-3xl' : 'max-w-lg',
              citizen
                ? 'bg-white border border-citizen-border shadow-2xl'
                : 'glass-strong',
            )}
          >
            {/* Header */}
            {title && (
              <div className={cn(
                'flex items-center justify-between px-6 py-4 border-b',
                citizen ? 'border-citizen-border' : 'border-border-glass',
              )}>
                <h2 className={cn(
                  'text-h3',
                  citizen ? 'text-citizen-text' : 'text-text-primary',
                )}>{title}</h2>
                <button
                  onClick={onClose}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    citizen ? 'hover:bg-gray-100 text-citizen-muted' : 'hover:bg-white/[0.06] text-text-muted',
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
