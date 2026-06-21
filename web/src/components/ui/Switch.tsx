import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  citizen?: boolean
}

export function Switch({ checked, onChange, label, citizen }: SwitchProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      {label && (
        <span className={cn('text-sm', citizen ? 'text-slate-600' : 'text-officer-muted')}>{label}</span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-7 w-12 rounded-full transition-colors',
          checked
            ? citizen
              ? 'bg-citizen-primary'
              : 'bg-officer-primary'
            : citizen
              ? 'bg-slate-200'
              : 'bg-officer-border'
        )}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'absolute top-1 h-5 w-5 rounded-full bg-white shadow-md',
            checked ? 'left-6' : 'left-1'
          )}
        />
      </button>
    </label>
  )
}
