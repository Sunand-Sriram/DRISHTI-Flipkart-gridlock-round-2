import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const KEYFRAMES = `
@keyframes lp-floatOfficer { 0%,100%{transform:perspective(1000px) rotateX(8deg) rotateY(-14deg) translateY(0)} 50%{transform:perspective(1000px) rotateX(8deg) rotateY(-14deg) translateY(-14px)} }
@keyframes lp-floatCitizen { 0%,100%{transform:perspective(1000px) rotateX(8deg) rotateY(14deg) translateY(0)} 50%{transform:perspective(1000px) rotateX(8deg) rotateY(14deg) translateY(-14px)} }
@keyframes lp-pulseGlow { 0%,100%{opacity:.55} 50%{opacity:1} }
@keyframes lp-gridMove { from{background-position:0 0} to{background-position:0 72px} }
@keyframes lp-marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
@keyframes lp-scanLine { 0%{top:-3px;opacity:0} 10%{opacity:.85} 88%{opacity:.85} 100%{top:100%;opacity:0} }
@keyframes lp-dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(.7)} }
@keyframes lp-fadeUp { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:translateY(0)} }
@keyframes lp-amberGlow { 0%,100%{box-shadow:0 0 28px rgba(255,167,51,.22),0 0 0 1px rgba(255,167,51,.18)} 50%{box-shadow:0 0 56px rgba(255,167,51,.45),0 0 0 1px rgba(255,167,51,.32)} }
@keyframes lp-blueGlow { 0%,100%{box-shadow:0 0 28px rgba(45,91,255,.2),0 0 0 1px rgba(45,91,255,.16)} 50%{box-shadow:0 0 52px rgba(45,91,255,.42),0 0 0 1px rgba(45,91,255,.3)} }
.lp-navlink{padding:8px 16px;border-radius:8px;color:#8a93a3;font-size:13.5px;text-decoration:none;transition:.15s}
.lp-navlink:hover{color:#f4f6fa;background:rgba(255,255,255,.05)}
.lp-feat{border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:30px;background:linear-gradient(155deg,rgba(14,22,48,.85),rgba(8,13,28,.85));transition:border-color .2s,transform .22s}
.lp-feat:hover{transform:translateY(-5px)}
.lp-foot{font-size:13px;color:#5b6473;text-decoration:none;transition:.15s;cursor:pointer}
.lp-foot:hover{color:#f4f6fa}
.lp-cta{transition:box-shadow .2s,transform .2s}
.lp-cta:hover{transform:translateY(-2px)}
`

const MONO = "'JetBrains Mono',monospace"

export default function LandingPage() {
  const navigate = useNavigate()
  const heroRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const oCardRef = useRef<HTMLDivElement>(null)
  const cCardRef = useRef<HTMLDivElement>(null)

  // particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0, raf = 0
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H }
    resize()
    window.addEventListener('resize', resize)
    const ps = Array.from({ length: 90 }, () => ({
      x: Math.random() * 1600, y: Math.random() * 800, r: Math.random() * 1.3 + 0.3,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      a: Math.random() * 0.35 + 0.05,
      c: Math.random() > 0.55 ? '255,167,51' : Math.random() > 0.5 ? '45,91,255' : '52,211,153',
    }))
    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      ps.forEach((p) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(${p.c},${p.a})`; ctx.fill()
      })
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const dx = ps[i].x - ps[j].x, dy = ps[i].y - ps[j].y, d = Math.hypot(dx, dy)
        if (d < 100) { ctx.beginPath(); ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.strokeStyle = `rgba(255,167,51,${0.07 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke() }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  // counters
  useEffect(() => {
    const counters: [string, number, (v: number) => string][] = [
      ['sc-challans', 3241, (v) => v.toLocaleString('en-IN')],
      ['sc-cams', 12, (v) => String(v)],
      ['sc-fines', 48, (v) => `₹${v}L`],
      ['sc-cleared', 248, (v) => v.toLocaleString('en-IN')],
      ['sc-emerg', 3, (v) => String(v)],
    ]
    counters.forEach(([id, target, fmt]) => {
      const el = document.getElementById(id); if (!el) return
      let start: number | null = null
      const step = (ts: number) => {
        if (start === null) start = ts
        const t = Math.min(1, (ts - start) / 1800), e = 1 - Math.pow(1 - t, 3)
        el.textContent = fmt(Math.round(target * e))
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }, [])

  // mouse parallax
  useEffect(() => {
    const hero = heroRef.current; if (!hero) return
    const onMove = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect()
      const mx = (e.clientX - r.left) / r.width - 0.5, my = (e.clientY - r.top) / r.height - 0.5
      if (oCardRef.current) oCardRef.current.style.transform = `perspective(1000px) rotateX(${-my * 11 + 6}deg) rotateY(${mx * 11 - 12}deg) translateY(${my * -5}px)`
      if (cCardRef.current) cCardRef.current.style.transform = `perspective(1000px) rotateX(${-my * 11 + 6}deg) rotateY(${mx * 11 + 12}deg) translateY(${my * -5}px)`
    }
    const onLeave = () => { if (oCardRef.current) oCardRef.current.style.transform = ''; if (cCardRef.current) cCardRef.current.style.transform = '' }
    hero.addEventListener('mousemove', onMove); hero.addEventListener('mouseleave', onLeave)
    return () => { hero.removeEventListener('mousemove', onMove); hero.removeEventListener('mouseleave', onLeave) }
  }, [])

  const arrow = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#060a14', color: '#f4f6fa', fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>
      <style>{KEYFRAMES}</style>

      {/* NAVBAR */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 66, display: 'flex', alignItems: 'center', padding: '0 clamp(16px,4vw,48px)', background: 'rgba(6,10,20,.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.055)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, border: '1.5px solid #ffa733', borderRadius: 10, transform: 'rotate(45deg)', display: 'grid', placeItems: 'center', boxShadow: '0 0 18px rgba(255,167,51,.32)' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffa733', transform: 'rotate(-45deg)', boxShadow: '0 0 8px rgba(255,167,51,.8)' }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 22, letterSpacing: '.15em' }}>DRISHTI</span>
          <span className="lp-tagline" style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.2em', color: '#4a5264', borderLeft: '1px solid rgba(255,255,255,.09)', paddingLeft: 14, textTransform: 'uppercase' }}>Traffic Violation Detection</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          <a href="#features" className="lp-navlink">Features</a>
          <a href="#about" className="lp-navlink">About</a>
          <a href="#footer" className="lp-navlink">Resources</a>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.09)', margin: '0 8px' }} />
          <button onClick={() => navigate('/officer')} className="lp-cta" style={{ height: 38, padding: '0 18px', border: '1.5px solid rgba(255,167,51,.6)', borderRadius: 9, background: 'transparent', color: '#ffa733', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Officer Login</button>
          <button onClick={() => navigate('/citizen')} className="lp-cta" style={{ height: 38, padding: '0 18px', border: 'none', borderRadius: 9, background: '#2d5bff', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 6, boxShadow: '0 4px 18px -4px rgba(45,91,255,.55)' }}>Citizen Portal</button>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 66 }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
        {/* glow blobs */}
        <div style={{ position: 'absolute', left: '6%', top: '14%', width: 540, height: 540, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,167,51,.11),transparent 65%)', animation: 'lp-pulseGlow 5.5s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', right: '6%', top: '18%', width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,91,255,.10),transparent 65%)', animation: 'lp-pulseGlow 5.5s 2.2s ease-in-out infinite' }} />
        {/* grid floor */}
        <div style={{ position: 'absolute', bottom: 0, left: '-30%', right: '-30%', height: '48%', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
          <div style={{ width: '100%', height: '100%', transform: 'perspective(500px) rotateX(74deg)', transformOrigin: 'bottom center', backgroundImage: 'linear-gradient(rgba(255,167,51,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(45,91,255,.09) 1px,transparent 1px)', backgroundSize: '72px 72px', animation: 'lp-gridMove 3s linear infinite', WebkitMaskImage: 'linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 100%)', maskImage: 'linear-gradient(to top,rgba(0,0,0,.8) 0%,transparent 100%)' }} />
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top,#060a14 0%,transparent 100%)', pointerEvents: 'none', zIndex: 2 }} />

        {/* hero content */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', border: '1px solid rgba(255,167,51,.28)', borderRadius: 40, background: 'rgba(255,167,51,.07)', marginBottom: 30, animation: 'lp-fadeUp .7s ease both' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffa733', animation: 'lp-dotPulse 1.4s infinite' }} />
            <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: '#ffa733' }}>AI-Powered · Real-time Detection</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 14, animation: 'lp-fadeUp .7s .08s ease both' }}>
            <div style={{ width: 76, height: 76, border: '2px solid #ffa733', borderRadius: 20, transform: 'rotate(45deg)', display: 'grid', placeItems: 'center', animation: 'lp-amberGlow 3s ease-in-out infinite' }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#ffa733', transform: 'rotate(-45deg)', boxShadow: '0 0 18px rgba(255,167,51,.9)' }} />
            </div>
            <h1 style={{ fontSize: 'clamp(56px,8.5vw,112px)', fontWeight: 800, letterSpacing: '.12em', lineHeight: 1, textShadow: '0 0 100px rgba(255,167,51,.18)' }}>DRISHTI</h1>
          </div>

          <p style={{ fontFamily: MONO, fontSize: 12.5, letterSpacing: '.3em', textTransform: 'uppercase', color: '#4a5264', marginBottom: 52, textAlign: 'center', animation: 'lp-fadeUp .7s .16s ease both' }}>Traffic Violation Detection System · Bengaluru</p>

          {/* portal cards (equal size) */}
          <div style={{ display: 'flex', gap: 26, alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center', animation: 'lp-fadeUp .8s .28s ease both' }}>
            {/* OFFICER */}
            <div ref={oCardRef} onClick={() => navigate('/officer')} style={{ width: 300, minHeight: 430, display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(155deg,#0f1932 0%,#0c1424 100%)', animation: 'lp-amberGlow 3.5s ease-in-out infinite,lp-floatOfficer 5s ease-in-out infinite', cursor: 'pointer', transition: 'transform .22s ease' }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(255,167,51,.2),rgba(255,167,51,.06))', borderBottom: '1px solid rgba(255,167,51,.18)', padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 28, height: 28, border: '1px solid rgba(255,167,51,.55)', borderRadius: 7, transform: 'rotate(45deg)', display: 'grid', placeItems: 'center' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ffa733', transform: 'rotate(-45deg)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.14em' }}>DRISHTI</div>
                  <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '.2em', color: '#ffa733', marginTop: 1 }}>OFFICER PORTAL</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'lp-dotPulse 1.6s infinite' }} />
                  <span style={{ fontFamily: MONO, fontSize: 9, color: '#34d399', letterSpacing: '.1em' }}>LIVE</span>
                </div>
              </div>
              <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>Officer Portal</div>
                <div style={{ fontSize: 12.5, color: '#8a93a3', lineHeight: 1.65, marginBottom: 16 }}>Real-time detection, review queue, live map &amp; analytics for traffic officers.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
                  {[['sc-challans', 'challans', '#ffce9a'], ['sc-cams', 'cameras', '#34d399'], ['sc-fines', 'collected', '#ffa733']].map(([id, lab, col]) => (
                    <div key={id} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 9, padding: '10px 10px 8px', textAlign: 'center' }}>
                      <div id={id} style={{ fontWeight: 700, fontSize: 16, color: col, lineHeight: 1 }}>0</div>
                      <div style={{ fontSize: 9.5, color: '#5b6473', marginTop: 3 }}>{lab}</div>
                    </div>
                  ))}
                </div>
                <div style={{ position: 'relative', height: 46, border: '1px solid rgba(255,167,51,.2)', borderRadius: 9, background: 'rgba(255,167,51,.04)', overflow: 'hidden', marginBottom: 16 }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,transparent,rgba(255,167,51,.75),transparent)', animation: 'lp-scanLine 2.2s linear infinite' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 13px', gap: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: '#ffa733', letterSpacing: '.08em' }}>CAM-03</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: '#8a93a3' }}>NO HELMET · 0.89</span>
                    <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9.5, background: 'rgba(255,93,93,.16)', color: '#ff8a8a', padding: '2px 8px', borderRadius: 5 }}>ALERT</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); navigate('/officer') }} className="lp-cta" style={{ marginTop: 'auto', width: '100%', height: 44, border: 'none', borderRadius: 10, background: '#ffa733', color: '#0a0d13', fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Enter Officer Portal {arrow}</button>
              </div>
            </div>

            {/* OR divider */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, justifyContent: 'center' }}>
              <div style={{ width: 1, height: 56, background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,.14),transparent)' }} />
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.18em', color: '#2e3648' }}>OR</span>
              <div style={{ width: 1, height: 56, background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,.14),transparent)' }} />
            </div>

            {/* CITIZEN */}
            <div ref={cCardRef} onClick={() => navigate('/citizen')} style={{ width: 300, minHeight: 430, display: 'flex', flexDirection: 'column', borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(155deg,#ffffff,#f4f7ff)', animation: 'lp-blueGlow 3.5s ease-in-out infinite,lp-floatCitizen 5.5s ease-in-out infinite', cursor: 'pointer', transition: 'transform .22s ease' }}>
              <div style={{ background: 'linear-gradient(135deg,rgba(45,91,255,.1),rgba(6,182,212,.05))', borderBottom: '1px solid rgba(45,91,255,.12)', padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 28, height: 28, border: '1.5px solid #2d5bff', borderRadius: 7, transform: 'rotate(45deg)', display: 'grid', placeItems: 'center' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2d5bff', transform: 'rotate(-45deg)' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '.14em', color: '#15181e' }}>DRISHTI</div>
                  <div style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: '.2em', color: '#2d5bff', marginTop: 1 }}>e-CHALLAN</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9, color: '#16a34a', background: '#e7f7ee', padding: '2px 9px', borderRadius: 5, fontWeight: 600, letterSpacing: '.05em' }}>SECURE</div>
              </div>
              <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 700, color: '#15181e', marginBottom: 6 }}>Citizen Portal</div>
                <div style={{ fontSize: 12.5, color: '#717a88', lineHeight: 1.65, marginBottom: 16 }}>Check fines, pay online &amp; contest challans — no app download needed.</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {[
                    { p: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', t: 'Lookup by challan ID or plate' },
                    { p: 'M3 11h18v11H3zM7 11V7a5 5 0 0 1 10 0v4', t: 'Pay via UPI, Card, Net Banking' },
                    { p: 'M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z', t: 'Contest with photo evidence' },
                  ].map((f) => (
                    <div key={f.t} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12.5, color: '#3a4150' }}>
                      <span style={{ width: 22, height: 22, borderRadius: 7, background: '#eef2ff', display: 'grid', placeItems: 'center', flex: 'none' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2d5bff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={f.p} /></svg>
                      </span>{f.t}
                    </div>
                  ))}
                </div>
                <button onClick={(e) => { e.stopPropagation(); navigate('/citizen') }} className="lp-cta" style={{ marginTop: 'auto', width: '100%', height: 44, border: 'none', borderRadius: 10, background: '#2d5bff', color: '#fff', fontFamily: 'inherit', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 24px -8px rgba(45,91,255,.55)' }}>Enter Citizen Portal {arrow}</button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, animation: 'lp-fadeUp .8s .5s ease both' }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: '#2e3648' }}>Scroll to explore</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e3648" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </div>
        </div>
      </section>

      {/* STATS MARQUEE */}
      <div style={{ background: '#08101e', borderTop: '1px solid rgba(255,255,255,.05)', borderBottom: '1px solid rgba(255,255,255,.05)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', whiteSpace: 'nowrap', animation: 'lp-marquee 20s linear infinite', width: 'max-content' }}>
          {[0, 1].map((dup) => (
            [['#ffa733', '3,241', 'CHALLANS TODAY'], ['#34d399', '12', 'CAMERAS LIVE'], ['#ffa733', '₹48L', 'COLLECTED'], ['#9db4ff', '248', 'CLEARED TODAY'], ['#ff8a8a', '3', 'EMERGENCIES']].map(([c, v, l], i) => (
              <span key={`${dup}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '14px 40px', fontFamily: MONO, fontSize: 11.5, color: '#4a5264', letterSpacing: '.1em', borderRight: '1px solid rgba(255,255,255,.05)', flex: 'none' }}>
                <span style={{ color: c }}>●</span><b style={{ color: '#dfe4ec', fontSize: 17 }}>{v}</b>{l}
              </span>
            ))
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 5vw', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.28em', textTransform: 'uppercase', color: '#ffa733', marginBottom: 12 }}>Platform Capabilities</div>
          <h2 style={{ fontSize: 'clamp(30px,4vw,50px)', fontWeight: 700, lineHeight: 1.15 }}>Built for real enforcement,<br />real streets</h2>
          <p style={{ fontSize: 15, color: '#5b6473', marginTop: 14, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.75 }}>DRISHTI combines computer vision, real-time pipelines, and a citizen-first portal into one unified enforcement system.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18 }}>
          {[
            { c: '255,167,51', col: '#ffa733', t: 'AI Camera Detection', d: 'Real-time YOLO11 detects no-helmet, red-light, phone-use, and seatbelt violations across all feeds simultaneously.', p: 'M3 7h18v12H3zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 7l1.5-2h5L16 7' },
            { c: '45,91,255', col: '#6a8bff', t: 'Predictive Analytics', d: 'ML-powered hotspot prediction gives officers a 6-hour lookahead of violation-prone junctions based on historical data.', p: 'M3 21h18M5 13v5M11 8v10M17 4v14' },
            { c: '52,211,153', col: '#34d399', t: 'Instant e-Challans', d: 'Violations auto-generate challans linked to VAHAN data. Emailed to the registered owner within seconds — zero manual entry.', p: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
            { c: '255,167,51', col: '#ffa733', t: 'Live Map & Heatmap', d: 'Interactive city map with camera feeds, checkposts, and color-coded violation heatmaps for tactical deployment.', p: 'M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11zM12 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z' },
            { c: '45,91,255', col: '#6a8bff', t: 'Citizen Appeal Flow', d: 'Citizens contest challans with photo evidence. Officer review queue handles appeals within 5 business days with full audit trail.', p: 'M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z' },
            { c: '52,211,153', col: '#34d399', t: 'DrishtiBot Analytics', d: 'Officers ask natural-language queries — "Which junction had the most violations?" — and get charts and insights instantly.', p: 'M4 5h16v11H9l-4 4z' },
          ].map((f) => (
            <div key={f.t} className="lp-feat" onMouseEnter={(e) => (e.currentTarget.style.borderColor = `rgba(${f.c},.35)`)} onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)')}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: `rgba(${f.c},.12)`, border: `1px solid rgba(${f.c},.22)`, display: 'grid', placeItems: 'center', marginBottom: 18, color: f.col }}>
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d={f.p} /></svg>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 9 }}>{f.t}</div>
              <div style={{ fontSize: 13, color: '#5b6473', lineHeight: 1.75 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: '40px 5vw 100px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ border: '1px solid rgba(255,255,255,.07)', borderRadius: 26, background: 'linear-gradient(135deg,rgba(13,20,44,.92),rgba(9,13,26,.92))', padding: 'clamp(32px,4vw,56px)', display: 'flex', gap: 60, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.28em', textTransform: 'uppercase', color: '#ffa733', marginBottom: 13 }}>Built by</div>
            <h2 style={{ fontSize: 'clamp(24px,3vw,38px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>Flipkart Hackathon Project<br /><span style={{ color: '#ffa733' }}>AI-Powered Traffic Enforcement</span></h2>
            <p style={{ fontSize: 14, color: '#5b6473', lineHeight: 1.8, maxWidth: 500, marginBottom: 26 }}>DRISHTI is an end-to-end traffic violation detection and e-challan management system — combining computer vision, real-time data pipelines, and an AI analytics layer.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['YOLO11', 'FastAPI', 'React', 'WebSocket', 'SQLite', 'Claude API', 'Leaflet'].map((t) => (
                <span key={t} style={{ fontFamily: MONO, fontSize: 11, padding: '5px 13px', borderRadius: 7, border: '1px solid rgba(255,255,255,.1)', color: '#8a93a3' }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 'none', width: 270, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['#ffa733', '255,167,51', 'Officer Portal', 'Tactical dark theme'], ['#6a8bff', '45,91,255', 'Citizen Portal', 'Clean light theme'], ['#34d399', '52,211,153', 'DrishtiBot Layer', 'Natural language analytics']].map(([col, c, t, s]) => (
              <div key={t} style={{ border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '18px 20px', background: 'rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `rgba(${c},.12)`, display: 'grid', placeItems: 'center', flex: 'none', color: col }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="13" rx="1.5" /><path d="M8 21h8M12 17v4" /></svg>
                </div>
                <div><div style={{ fontSize: 13.5, fontWeight: 600, color: '#dfe4ec' }}>{t}</div><div style={{ fontSize: 11.5, color: '#5b6473', marginTop: 2 }}>{s}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer" style={{ background: '#040710', borderTop: '1px solid rgba(255,255,255,.05)', padding: '72px 5vw 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 52, marginBottom: 60 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 18 }}>
                <div style={{ width: 38, height: 38, border: '1.5px solid rgba(255,167,51,.5)', borderRadius: 11, transform: 'rotate(45deg)', display: 'grid', placeItems: 'center' }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ffa733', transform: 'rotate(-45deg)' }} /></div>
                <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: '.15em' }}>DRISHTI</span>
              </div>
              <p style={{ fontSize: 13, color: '#3a4150', lineHeight: 1.75, maxWidth: 270, marginBottom: 22 }}>Traffic Violation Detection System — AI-powered enforcement and citizen services for smarter, safer roads.</p>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.14em', color: '#2e3648', lineHeight: 1.9 }}>Version 1.0.0 · Demo Build · 2026<br />© DRISHTI · Flipkart Hackathon</div>
            </div>
            {[
              ['#ffa733', 'Officer', ['Live Monitor', 'Review Queue', 'Analytics', 'Email Outbox', 'Cameras'], '/officer'],
              ['#2d5bff', 'Citizen', ['Check Challan', 'Pay Fine', 'Contest Challan', 'Challan History', 'Payment Receipt'], '/citizen'],
              ['#34d399', 'Resources', ['User Guide', 'API Documentation', 'System Status', 'Privacy Policy', 'Contact Support'], null],
            ].map(([dot, head, links, to]) => (
              <div key={head as string}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: '#4a5264', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: dot as string }} />{head as string}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(links as string[]).map((l) => (
                    <a key={l} className="lp-foot" onClick={() => to && navigate(to as string)}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 26, borderTop: '1px solid rgba(255,255,255,.05)', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: '#2e3648', letterSpacing: '.1em' }}>DEMO BUILD · NO AUTH REQUIRED · ALL DATA IS SIMULATED</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 10, color: '#4a5264' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'lp-dotPulse 1.6s infinite' }} />System Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
