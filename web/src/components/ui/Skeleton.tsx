import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  h?: string
  w?: string
  rounded?: 'md' | 'lg' | 'full' | '2xl'
}

export function Skeleton({ className, h = 'h-4', w = 'w-full', rounded = 'lg' }: SkeletonProps) {
  return (
    <div className={cn(
      'animate-shimmer',
      `rounded-${rounded}`,
      'bg-white/[0.04]',
      h, w,
      className,
    )} />
  )
}
