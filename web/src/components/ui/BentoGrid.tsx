import { cn } from '@/lib/utils'

interface BentoGridProps {
  children: React.ReactNode
  className?: string
  cols?: 2 | 3 | 4
}

export function BentoGrid({ children, className, cols = 4 }: BentoGridProps) {
  const colClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 xl:grid-cols-3',
    4: 'md:grid-cols-2 xl:grid-cols-4',
  }[cols]

  return (
    <div className={cn('grid grid-cols-1 gap-4', colClass, className)}>{children}</div>
  )
}

export function BentoCard({
  children,
  className,
  scrollable,
  span = 1,
}: {
  children: React.ReactNode
  className?: string
  scrollable?: boolean
  span?: 1 | 2
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-officer-border bg-officer-surface p-[clamp(1rem,2.5vw,1.5rem)]',
        span === 2 && 'md:col-span-2',
        scrollable && 'max-h-[420px] overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  )
}
