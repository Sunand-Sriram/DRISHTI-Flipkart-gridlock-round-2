import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'

const LenisContext = createContext<Lenis | null>(null)

export function useLenis() {
  return useContext(LenisContext)
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    // Smooth-wheel scrolling is only desired on the marketing Landing page.
    // The officer/citizen portals scroll inside inner overflow containers
    // (e.g. OfficerLayout's <main>), and a global Lenis instance hijacks the
    // wheel event for the window — which can't move — leaving only the
    // scrollbar thumb working. So enable Lenis on "/" and use native scroll
    // everywhere else.
    if (pathname !== '/') {
      lenisRef.current = null
      return
    }
    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
    })
    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    const id = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [pathname])

  return (
    <LenisContext.Provider value={lenisRef.current}>
      {children}
    </LenisContext.Provider>
  )
}
