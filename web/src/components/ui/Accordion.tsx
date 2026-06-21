import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionItemProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  citizen?: boolean
  badge?: React.ReactNode
}

export function AccordionItem({ title, children, defaultOpen = false, citizen, badge }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border',
        citizen ? 'border-slate-100 bg-white' : 'border-officer-border bg-officer-surface/80'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between gap-3 p-4 text-left transition-colors',
          citizen ? 'hover:bg-slate-50' : 'hover:bg-white/5'
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn('font-medium', citizen ? 'text-citizen-primary' : 'text-white')}>{title}</span>
          {badge}
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <ChevronDown className={cn('h-5 w-5', citizen ? 'text-citizen-muted' : 'text-officer-muted')} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className={cn('border-t px-4 pb-4 pt-2', citizen ? 'border-slate-100' : 'border-officer-border')}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
