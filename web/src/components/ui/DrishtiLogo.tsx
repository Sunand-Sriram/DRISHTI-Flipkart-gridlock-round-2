import { cn } from '@/lib/utils'

export function DrishtiLogo({ size = 'md', citizen }: { size?: 'sm' | 'md' | 'lg'; citizen?: boolean }) {
  const sizes = { sm: 28, md: 36, lg: 52 }
  const s = sizes[size]
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'grid place-items-center flex-none border rotate-45 rounded-xl',
          citizen ? 'border-citizen-primary/40' : 'border-officer-primary/50 shadow-lg shadow-amber-500/20'
        )}
        style={{ width: s, height: s }}
      >
        <span
          className={cn(
            'block rounded-full rotate-[-45deg]',
            citizen ? 'bg-citizen-primary' : 'bg-officer-primary shadow-[0_0_12px_rgba(139,92,246,0.8)]'
          )}
          style={{ width: s * 0.25, height: s * 0.25 }}
        />
      </div>
      <span
        className={cn(
          'font-bold tracking-[0.15em]',
          size === 'lg' && 'text-4xl',
          size === 'md' && 'text-xl',
          size === 'sm' && 'text-base',
          citizen ? 'text-citizen-primary' : 'text-white'
        )}
      >
        DRISHTI
      </span>
    </div>
  )
}
