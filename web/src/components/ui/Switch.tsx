import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'group inline-flex items-center gap-3',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      <div className={cn(
        'relative h-6 w-11 rounded-full p-0.5 transition-colors duration-200',
        checked ? 'bg-amethyst shadow-md shadow-amethyst/30' : 'bg-white/10 border border-border-glass',
      )}>
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'h-5 w-5 rounded-full bg-white shadow-sm',
            checked ? 'ml-auto' : 'ml-0',
          )}
        />
      </div>
      {label && (
        <span className="text-sm text-text-secondary">{label}</span>
      )}
    </button>
  )
}
