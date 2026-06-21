import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  citizen?: boolean
  options: { value: string; label: string }[]
}

export function Select({ label, citizen, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className={cn('text-sm font-medium', citizen ? 'text-citizen-primary/80' : 'text-officer-muted')}>
          {label}
        </label>
      )}
      <select
        className={cn(
          'h-11 rounded-xl border px-3 text-sm outline-none transition-all focus:ring-2',
          citizen
            ? 'border-slate-200 bg-white text-slate-800 focus:border-citizen-primary focus:ring-citizen-primary/20'
            : 'border-officer-border bg-officer-surface text-white focus:border-officer-primary focus:ring-officer-primary/25',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
