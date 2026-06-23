import { type ReactNode, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  citizen?: boolean
  hover?: boolean
}

export function Card({ children, className, citizen, hover = true, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        citizen ? 'glass-citizen' : 'glass',
        hover && (citizen ? 'glass-citizen-hover' : 'glass-hover'),
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

interface CardTitleProps {
  children: ReactNode
  className?: string
  gradient?: boolean
}

export function CardTitle({ children, className, gradient }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-h3',
        gradient ? 'text-gradient-amethyst' : 'text-text-primary',
        className,
      )}
    >
      {children}
    </h3>
  )
}
