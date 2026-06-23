import { type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface ParallaxSectionProps {
  children: ReactNode
  className?: string
  speed?: number
  scale?: boolean
}

export function ParallaxSection({
  children,
  className,
  speed = 0.2,
  scale = false,
}: ParallaxSectionProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100])
  const s = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95])

  return (
    <motion.div
      ref={ref}
      style={{ y, scale: scale ? s : undefined }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
