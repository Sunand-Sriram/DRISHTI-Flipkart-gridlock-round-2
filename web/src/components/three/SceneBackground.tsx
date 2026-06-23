import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import { ParticleField } from './ParticleField'
import { FloatingNodes } from './FloatingNodes'
import { cn } from '@/lib/utils'

interface SceneBackgroundProps {
  variant?: 'officer' | 'citizen' | 'landing'
  className?: string
}

export function SceneBackground({ variant = 'officer', className }: SceneBackgroundProps) {
  const config = {
    officer: { particleColor: '#14B8A6', particleCount: 1200, showNodes: true },
    citizen: { particleColor: '#0D9488', particleCount: 600, showNodes: false },
    landing: { particleColor: '#14B8A6', particleCount: 2000, showNodes: true },
  }[variant]

  return (
    <div
      className={cn(
        'fixed inset-0 -z-10 pointer-events-none',
        className
      )}
    >
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6], fov: 60, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.1} />
        <ParticleField
          count={config.particleCount}
          color={config.particleColor}
        />
        {config.showNodes && <FloatingNodes />}
        {variant === 'landing' && (
          <ParticleField count={800} color="#34D399" size={0.008} radius={10} />
        )}
        <Preload all />
      </Canvas>
    </div>
  )
}
