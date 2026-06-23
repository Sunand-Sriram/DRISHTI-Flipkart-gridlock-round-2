import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  citizen?: boolean
  mono?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, citizen, mono, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className={cn(
            'text-label',
            citizen ? 'text-citizen-muted' : 'text-text-muted',
          )}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'h-11 w-full rounded-xl px-4 text-sm outline-none transition-shadow duration-200',
            citizen
              ? 'bg-white border border-citizen-border text-citizen-text placeholder:text-citizen-faint focus:ring-2 focus:ring-citizen-primary/30 focus:border-citizen-primary'
              : 'bg-white/[0.03] border border-border-glass text-text-primary placeholder:text-text-faint focus:ring-2 focus:ring-amethyst/30 focus:border-amethyst/40',
            mono && 'font-mono tracking-wider uppercase',
            error && 'ring-2 ring-crimson/30 border-crimson/40',
            className,
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-crimson">{error}</span>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'
