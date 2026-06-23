import { useRef, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { motion, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const variants = {
  primary: 'bg-gradient-to-r from-amethyst to-amethyst-light text-white shadow-lg shadow-amethyst/20 hover:shadow-amethyst/30',
  outline: 'glass border border-amethyst/30 text-amethyst-light hover:bg-amethyst/10',
  ghost: 'text-text-secondary hover:bg-white/[0.04] hover:text-text-primary',
  danger: 'bg-crimson/15 text-crimson border border-crimson/20 hover:bg-crimson/25',
  success: 'bg-emerald/15 text-emerald border border-emerald/20 hover:bg-emerald/25',
  citizen: 'bg-citizen-primary text-white shadow-lg shadow-citizen-primary/20 hover:bg-citizen-primary-dark',
  secondary: 'bg-surface text-text-secondary border border-border-glass hover:bg-surface-2',
}

const sizes = {
  sm: 'h-8 text-xs px-3 gap-1.5 rounded-lg',
  md: 'h-10 text-sm px-4 gap-2 rounded-xl',
  lg: 'h-12 text-base px-6 gap-2.5 rounded-xl',
}

interface MagneticButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  loading?: boolean
  icon?: ReactNode
  magnetic?: boolean
}

export function MagneticButton({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  magnetic = true,
  children,
  className,
  disabled,
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })

  const handleMouse = (e: React.MouseEvent) => {
    if (!magnetic || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    x.set((e.clientX - cx) * 0.15)
    y.set((e.clientY - cy) * 0.15)
  }

  const reset = () => { x.set(0); y.set(0) }

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      disabled={disabled || loading}
      className={cn(
        'relative inline-flex items-center justify-center font-medium font-display',
        'transition-none select-none',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
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
