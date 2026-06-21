import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  citizen?: boolean
  hover?: boolean
  padding?: boolean
}

export function Card({ children, className, citizen, hover, padding = true }: CardProps) {
  const Wrapper = hover ? motion.div : 'div'
  const motionProps = hover
    ? {
        whileHover: { y: -2, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } },
      }
    : {}

  return (
    <Wrapper
      {...motionProps}
      className={cn(
        'rounded-2xl border',
        padding && 'p-[clamp(1rem,3vw,1.75rem)]',
        citizen
          ? 'border-slate-100 bg-citizen-surface shadow-sm shadow-amber-900/5'
          : 'border-officer-border bg-officer-surface',
        className
      )}
    >
      {children}
    </Wrapper>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)}>{children}</div>
}

export function CardTitle({ children, className, citizen }: { children: React.ReactNode; className?: string; citizen?: boolean }) {
  return (
    <h3 className={cn('text-lg font-semibold tracking-tight', citizen ? 'text-citizen-primary' : 'text-white', className)}>
      {children}
    </h3>
  )
}
