import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'citizen'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-officer-primary text-white hover:bg-amber-500 shadow-lg shadow-amber-500/20',
  secondary: 'bg-officer-surface text-white border border-officer-border hover:border-amber-500/40',
  outline: 'border border-officer-border text-officer-muted hover:border-amber-500/50 hover:text-white bg-transparent',
  ghost: 'text-officer-muted hover:text-white hover:bg-white/5',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25',
  success: 'bg-emerald-500 text-officer-bg hover:bg-emerald-400',
  citizen: 'bg-citizen-primary text-white hover:bg-amber-900 shadow-lg shadow-amber-900/15',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-lg',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-13 px-6 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => (
    <motion.div whileHover={{ scale: disabled || loading ? 1 : 1.02 }} whileTap={{ scale: disabled || loading ? 1 : 0.98 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    </motion.div>
  )
)
Button.displayName = 'Button'
