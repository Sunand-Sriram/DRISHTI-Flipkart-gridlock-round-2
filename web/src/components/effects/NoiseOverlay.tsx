import { useEffect, useRef } from 'react'

export function NoiseOverlay({ opacity = 0.035 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let lastTime = 0
    const FPS = 8

    const resize = () => {
      canvas.width = window.innerWidth / 2
      canvas.height = window.innerHeight / 2
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = (time: number) => {
      animId = requestAnimationFrame(draw)
      if (time - lastTime < 1000 / FPS) return
      lastTime = time

      const w = canvas.width
      const h = canvas.height
      const imageData = ctx.createImageData(w, h)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255
        data[i] = v
        data[i + 1] = v
        data[i + 2] = v
        data[i + 3] = 255
      }
      ctx.putImageData(imageData, 0, 0)
    }
    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[100]"
      style={{
        opacity,
        mixBlendMode: 'overlay',
        width: '100vw',
        height: '100vh',
        imageRendering: 'pixelated',
      }}
    />
  )
}
