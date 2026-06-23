import { cn } from '@/lib/utils'
import { Eye, Shield } from 'lucide-react'

interface DrishtiLogoProps {
  size?: 'sm' | 'md' | 'lg'
  citizen?: boolean
  animate?: boolean
  showText?: boolean
}

export function DrishtiLogo({ size = 'md', citizen, animate, showText = true }: DrishtiLogoProps) {
  const px = { sm: 24, md: 32, lg: 48 }[size]
  const textSize = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }[size]

  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        'relative flex items-center justify-center',
        animate && 'animate-glow-pulse',
      )}>
        <Shield
          size={px}
          className={cn(
            citizen ? 'text-citizen-primary' : 'text-amethyst',
          )}
          strokeWidth={1.5}
        />
        <Eye
          size={px * 0.4}
          className={cn(
            'absolute',
            citizen ? 'text-citizen-primary' : 'text-amethyst-light',
          )}
          strokeWidth={2}
        />
      </div>
      {showText && (
        <span className={cn(
          'font-display font-bold tracking-tight',
          textSize,
          citizen ? 'text-citizen-text' : 'text-text-primary',
        )}>
          DRISHTI
        </span>
      )}
    </div>
  )
}
