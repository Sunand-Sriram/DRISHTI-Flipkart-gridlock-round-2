import { type ReactNode } from 'react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  direction?: 'up' | 'left' | 'right'
  distance?: number
  delay?: number
  once?: boolean
}

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  distance = 40,
  delay = 0,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: '-50px' })

  const initial = {
    up: { y: distance, x: 0 },
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
  }[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ ...initial, opacity: 0 }}
      animate={isInView ? { x: 0, y: 0, opacity: 1 } : { ...initial, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
