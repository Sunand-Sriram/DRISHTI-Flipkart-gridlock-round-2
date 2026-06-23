import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  citizen?: boolean
}

export function Accordion({ title, children, defaultOpen = false, citizen }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn(
      'rounded-xl overflow-hidden',
      citizen ? 'bg-white border border-citizen-border' : 'glass',
    )}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-5 py-4 text-left',
          citizen ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]',
        )}
      >
        <span className={cn(
          'font-display font-semibold text-sm',
          citizen ? 'text-citizen-text' : 'text-text-primary',
        )}>
          {title}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <ChevronDown className={cn(
            'h-4 w-4',
            citizen ? 'text-citizen-muted' : 'text-text-muted',
          )} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="overflow-hidden"
          >
            <div className={cn(
              'px-5 pb-4 text-sm',
              citizen ? 'text-citizen-muted' : 'text-text-secondary',
            )}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
