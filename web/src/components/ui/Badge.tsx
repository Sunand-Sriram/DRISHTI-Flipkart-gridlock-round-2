import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const colorMap = {
  default: 'bg-amethyst/10 text-amethyst-light border border-amethyst/20',
  success: 'bg-emerald/10 text-emerald border border-emerald/20',
  warning: 'bg-amber/10 text-amber border border-amber/20',
  danger: 'bg-crimson/10 text-crimson border border-crimson/20',
  info: 'bg-cyan/10 text-cyan border border-cyan/20',
  muted: 'bg-white/[0.04] text-text-muted border border-white/[0.06]',
}

interface BadgeProps {
  children: ReactNode
  className?: string
  variant?: keyof typeof colorMap
  dot?: boolean
}

export function Badge({ children, className, variant = 'default', dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorMap[variant],
        className,
      )}
    >
      {dot && (
        <span className={cn(
          'h-1.5 w-1.5 rounded-full animate-dot-pulse',
          variant === 'success' ? 'bg-emerald' :
          variant === 'danger' ? 'bg-crimson' :
          variant === 'warning' ? 'bg-amber' :
          variant === 'info' ? 'bg-cyan' :
          'bg-amethyst',
        )} />
      )}
      {children}
    </span>
  )
}
