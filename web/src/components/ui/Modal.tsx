import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  citizen?: boolean
  wide?: boolean
}

export function Modal({ open, onClose, title, children, citizen, wide }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className={cn(
              'fixed left-1/2 top-1/2 z-50 max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-2xl border p-6 shadow-2xl',
              wide ? 'w-[min(92vw,900px)]' : 'w-[min(92vw,520px)]',
              citizen ? 'border-slate-100 bg-white' : 'border-officer-border bg-officer-surface'
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              {title && (
                <h2 className={cn('text-lg font-semibold', citizen ? 'text-citizen-primary' : 'text-white')}>
                  {title}
                </h2>
              )}
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'ml-auto rounded-lg p-2 transition-colors',
                  citizen ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-officer-muted'
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
