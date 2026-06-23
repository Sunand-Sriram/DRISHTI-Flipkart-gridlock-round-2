import { useEffect, useState, type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  trend?: number
  icon?: ReactNode
  className?: string
}

export function KPICard({ label, value, prefix = '', suffix = '', trend, icon, className }: KPICardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!isInView) return
    const duration = 1200
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(value * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0 }}
      animate={isInView ? { y: 0, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={cn('glass glass-hover rounded-2xl p-6', className)}
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-label text-text-muted">{label}</span>
        {icon && (
          <div className="p-2 rounded-xl bg-amethyst/10 text-amethyst">
            {icon}
          </div>
        )}
      </div>
      <div className="text-data text-gradient-amethyst">
        {prefix}{displayValue.toLocaleString('en-IN')}{suffix}
      </div>
      {trend !== undefined && trend !== 0 && (
        <div className={cn(
          'flex items-center gap-1 mt-2 text-xs font-medium',
          trend > 0 ? 'text-emerald' : 'text-crimson',
        )}>
          {trend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(trend)}% from last period
        </div>
      )}
    </motion.div>
  )
}
