import { cn, VIOLATION_LABEL, VIOLATION_COLOR, STATUS_COLOR, titleCase } from '@/lib/utils'

interface ViolationBadgeProps {
  violation: string
  className?: string
}

export function ViolationBadge({ violation, className }: ViolationBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
      VIOLATION_COLOR[violation] || 'bg-white/[0.04] text-text-muted border-white/[0.06]',
      className,
    )}>
      {VIOLATION_LABEL[violation] || titleCase(violation)}
    </span>
  )
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
      STATUS_COLOR[status] || 'bg-white/[0.04] text-text-muted border-white/[0.06]',
      className,
    )}>
      {titleCase(status)}
    </span>
  )
}
