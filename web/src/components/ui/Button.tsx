import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const variantStyles = {
  primary: 'bg-gradient-to-r from-amethyst to-amethyst-light text-white shadow-lg shadow-amethyst/20',
  outline: 'glass border-amethyst/30 text-amethyst-light hover:bg-amethyst/10',
  ghost: 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary',
  danger: 'bg-crimson/15 text-crimson border border-crimson/20 hover:bg-crimson/25',
  success: 'bg-emerald/15 text-emerald border border-emerald/20 hover:bg-emerald/25',
  citizen: 'bg-citizen-primary text-white shadow-lg shadow-citizen-primary/20 hover:bg-citizen-primary-dark',
  secondary: 'bg-surface text-text-secondary border border-border-glass hover:bg-surface-2',
}

const sizeStyles = {
  sm: 'h-8 text-xs px-3 gap-1.5 rounded-lg',
  md: 'h-10 text-sm px-4 gap-2 rounded-xl',
  lg: 'h-12 text-base px-6 gap-2.5 rounded-xl font-semibold',
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center font-medium font-display select-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...(props as HTMLMotionProps<'button'>)}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
