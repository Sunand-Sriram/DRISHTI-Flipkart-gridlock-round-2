import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface BentoGridProps {
  children: ReactNode
  className?: string
  cols?: number
}

export function BentoGrid({ children, className, cols = 3 }: BentoGridProps) {
  return (
    <div className={cn(
      'grid gap-4',
      cols === 2 && 'grid-cols-1 md:grid-cols-2',
      cols === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      cols === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      className,
    )}>
      {children}
    </div>
  )
}

interface BentoCardProps {
  children: ReactNode
  className?: string
  span?: number
}

export function BentoCard({ children, className, span }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTransform(`perspective(800px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`)
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => setTransform('')}
      style={{ transform }}
      className={cn(
        'glass glass-hover rounded-2xl p-6 transition-transform duration-75',
        span === 2 && 'md:col-span-2',
        span === 3 && 'md:col-span-3',
        className,
      )}
    >
      {children}
    </div>
  )
}
