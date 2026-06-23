import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  citizen?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, citizen, className, ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            className={cn(
              'h-11 w-full rounded-xl px-4 pr-10 text-sm outline-none appearance-none cursor-pointer transition-shadow duration-200',
              citizen
                ? 'bg-white border border-citizen-border text-citizen-text focus:ring-2 focus:ring-citizen-primary/30'
                : 'bg-white/[0.03] border border-border-glass text-text-primary focus:ring-2 focus:ring-amethyst/30',
              className,
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-void text-text-primary">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none',
            citizen ? 'text-citizen-muted' : 'text-text-muted',
          )} />
        </div>
      </div>
    )
  }
)
Select.displayName = 'Select'
