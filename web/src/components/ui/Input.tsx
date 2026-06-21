import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  mono?: boolean
  citizen?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, mono, citizen, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium',
              citizen ? 'text-citizen-primary/80' : 'text-officer-muted'
            )}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-12 w-full rounded-xl border px-4 text-sm outline-none transition-all focus:ring-2',
            mono && 'font-mono uppercase tracking-wide',
            citizen
              ? 'border-slate-200 bg-white text-slate-800 focus:border-citizen-primary focus:ring-citizen-primary/20'
              : 'border-officer-border bg-officer-surface text-white placeholder:text-officer-muted/60 focus:border-officer-primary focus:ring-officer-primary/25',
            error && 'border-red-400 focus:ring-red-400/25',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
