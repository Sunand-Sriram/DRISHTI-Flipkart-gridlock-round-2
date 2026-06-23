import { useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  tilt?: boolean
  citizen?: boolean
  onClick?: () => void
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  tilt = false,
  citizen = false,
  onClick,
}: AnimatedCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')

  const handleMouse = (e: React.MouseEvent) => {
    if (!tilt || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTransform(`perspective(600px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`)
  }

  const resetTilt = () => setTransform('')

  return (
    <motion.div
      ref={ref}
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay,
      }}
      onMouseMove={handleMouse}
      onMouseLeave={resetTilt}
      onClick={onClick}
      style={{ transform: tilt ? transform : undefined }}
      className={cn(
        'rounded-2xl p-6',
        citizen ? 'glass-citizen' : 'glass glass-hover',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
