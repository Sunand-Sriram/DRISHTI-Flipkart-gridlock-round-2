import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform, type Variants } from 'framer-motion'
import {
  Eye, Shield, Radio, Brain, MapPin, FileText,
  ArrowRight, ChevronDown, ExternalLink, Camera, AlertTriangle,
} from 'lucide-react'
import { SceneBackground } from '@/components/three/SceneBackground'
import { ScrollReveal } from '@/components/motion/ScrollReveal'
import { MagneticButton } from '@/components/motion/MagneticButton'

/* ─── Animation presets ─── */
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }
const fadeUp: Variants = { hidden: { y: 40, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80, damping: 20 } } }
const fadeScale: Variants = { hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 70, damping: 18 } } }

const FEATURES = [
  { icon: Eye, title: 'YOLO11m Vision', desc: 'Six specialized detectors across 8 violation types — avg 0.88 mAP@0.5, up to 0.98 for ANPR', gradient: 'from-teal-400 to-emerald-400' },
  { icon: Radio, title: 'Live Streaming', desc: 'WebSocket-powered CCTV feeds with frame-by-frame inference overlay', gradient: 'from-sky-400 to-blue-400' },
  { icon: Brain, title: 'DrishtiBot AI', desc: 'Natural language analytics — ask questions, get charts and insights instantly', gradient: 'from-rose-400 to-pink-400' },
  { icon: Shield, title: 'ANPR + VAHAN', desc: 'Automated plate recognition with RTO lookup for owner and insurance details', gradient: 'from-amber-400 to-orange-400' },
  { icon: MapPin, title: 'Hotspot Prediction', desc: 'ML-based spatio-temporal clustering predicts violations up to 6 hours ahead', gradient: 'from-teal-400 to-cyan-400' },
  { icon: FileText, title: 'Auto-Challans', desc: 'PDF generation, email delivery via SMTP, and citizen self-service portal', gradient: 'from-violet-400 to-purple-400' },
]

const STATS = [
  { value: '0.88', label: 'Avg mAP@0.5' },
  { value: '8', label: 'Violation Types' },
  { value: '6', label: 'AI Models' },
  { value: '220+', label: 'Challans Seeded' },
]

const WORKFLOW_STEPS = [
  { num: '01', title: 'Capture', desc: 'CCTV feeds stream into YOLO11m for real-time frame analysis', icon: Camera, color: '#14B8A6' },
  { num: '02', title: 'Detect', desc: 'AI identifies violations, extracts plates via ANPR, and cross-references VAHAN', icon: Eye, color: '#38BDF8' },
  { num: '03', title: 'Alert', desc: 'Officers review AI-flagged events, emergencies trigger instant checkpost alerts', icon: AlertTriangle, color: '#FB7185' },
  { num: '04', title: 'Enforce', desc: 'Auto-generated challans are emailed to vehicle owners with evidence and payment links', icon: FileText, color: '#F59E0B' },
]

export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div className="relative min-h-screen overflow-hidden bg-midnight">
      <SceneBackground variant="landing" />

      {/* ── Grid overlay ── */}
      <div className="landing-grid-bg" />

      {/* ── Morphing gradient blobs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-teal-500/[0.07] animate-morph-blob blur-3xl" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-rose-500/[0.05] animate-morph-blob blur-3xl" style={{ animationDelay: '-4s' }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-sky-500/[0.04] animate-morph-blob blur-3xl" style={{ animationDelay: '-8s' }} />
      </div>

      {/* ═══════ HERO SECTION ═══════ */}
      <motion.section
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center"
      >
        {/* Orbiting ring */}
        <div className="absolute w-[360px] h-[360px] md:w-[500px] md:h-[500px] rounded-full border border-white/[0.04]">
          <div className="absolute w-3 h-3 rounded-full bg-teal-400/60 top-0 left-1/2 -translate-x-1/2 animate-orbit shadow-[0_0_20px_rgba(20,184,166,0.4)]" style={{ '--orbit-r': '180px', '--orbit-dur': '20s' } as React.CSSProperties} />
          <div className="absolute w-2 h-2 rounded-full bg-rose-400/50 top-0 left-1/2 -translate-x-1/2 animate-orbit" style={{ '--orbit-r': '200px', '--orbit-dur': '28s' } as React.CSSProperties} />
          <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400/40 top-0 left-1/2 -translate-x-1/2 animate-orbit" style={{ '--orbit-r': '160px', '--orbit-dur': '35s' } as React.CSSProperties} />
        </div>

        {/* Pulse rings */}
        <div className="absolute">
          <div className="w-48 h-48 rounded-full border border-teal-400/20" style={{ animation: 'pulse-ring 3s ease-out infinite' }} />
          <div className="absolute inset-0 w-48 h-48 rounded-full border border-teal-400/10" style={{ animation: 'pulse-ring 3s ease-out infinite 1s' }} />
        </div>

        <motion.div variants={stagger} initial="hidden" animate="visible" className="relative z-10">
          {/* Badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass mb-6 text-xs text-text-muted tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-glow-pulse" />
            FLIPKART GRIDLOCK — AI TRAFFIC ENFORCEMENT
          </motion.div>

          {/* ★ DRISHTI — The Centerpiece ★ */}
          <motion.h1
            variants={fadeScale}
            className="text-[4.5rem] md:text-[7rem] lg:text-[9rem] font-display font-black tracking-[-0.05em] leading-[0.85] mb-4 relative"
            style={{
              background: 'linear-gradient(135deg, #14B8A6 0%, #38BDF8 40%, #F59E0B 80%, #14B8A6 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradient-shift 6s ease infinite',
            }}
          >
            DRISHTI
            {/* Glow behind */}
            <span className="absolute inset-0 blur-2xl opacity-20 -z-10" style={{
              background: 'linear-gradient(135deg, #14B8A6, #38BDF8, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>DRISHTI</span>
          </motion.h1>

          {/* Subtitle tagline */}
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-text-primary/90 max-w-3xl mx-auto mb-2">
            Intelligent Eyes on Every Road
          </motion.h2>

          {/* Description */}
          <motion.p variants={fadeUp} className="mt-4 text-base md:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            DRISHTI uses <span className="text-teal-400 font-semibold">computer vision</span> and{' '}
            <span className="text-rose-400 font-semibold">deep learning</span> to detect, classify, and enforce
            traffic violations in real-time — from CCTV to challan in seconds.
          </motion.p>

          {/* ★ CTA buttons — bigger & prominent ★ */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-5 mt-12">
            <MagneticButton onClick={() => navigate('/officer')} variant="primary" size="lg" className="text-lg px-10 h-14 rounded-2xl min-w-[220px]">
              <Shield className="h-6 w-6" /> Officer Portal <ArrowRight className="h-5 w-5 ml-1" />
            </MagneticButton>
            <MagneticButton onClick={() => navigate('/citizen')} variant="secondary" size="lg" className="text-lg px-10 h-14 rounded-2xl min-w-[220px] border-teal-500/30">
              <FileText className="h-6 w-6" /> Citizen Lookup <ArrowRight className="h-5 w-5 ml-1" />
            </MagneticButton>
          </motion.div>

          {/* Stats ticker */}
          <motion.div variants={fadeUp} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-gradient-amethyst font-display">{s.value}</p>
                <p className="text-xs text-text-faint mt-1 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-text-faint"
        >
          <span className="text-xs tracking-widest">SCROLL TO EXPLORE</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="relative z-10 py-32 px-6">
        <ScrollReveal>
          <p className="text-label text-teal-400 text-center mb-3">THE PIPELINE</p>
          <h2 className="text-h1 text-text-primary text-center mb-16">From Camera to Challan</h2>
        </ScrollReveal>

        <div className="max-w-5xl mx-auto relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-teal-500/20 to-transparent" />

          {WORKFLOW_STEPS.map((step, i) => (
            <ScrollReveal key={step.num} direction={i % 2 === 0 ? 'left' : 'right'}>
              <div className={`flex items-center gap-8 mb-16 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Number + Icon */}
                <div className="shrink-0 relative">
                  <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle, ${step.color}, transparent 70%)` }} />
                    <step.icon className="h-8 w-8 relative z-10" style={{ color: step.color }} />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-mono font-bold px-2 py-0.5 rounded-full glass text-text-muted">{step.num}</span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-h3 text-text-primary mb-2">{step.title}</h3>
                  <p className="text-text-muted leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ═══════ FEATURES BENTO ═══════ */}
      <section className="relative z-10 py-24 px-6">
        <ScrollReveal>
          <p className="text-label text-teal-400 text-center mb-3">CAPABILITIES</p>
          <h2 className="text-h1 text-text-primary text-center mb-16">Built for the Real World</h2>
        </ScrollReveal>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <motion.div
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group relative glass rounded-2xl p-6 overflow-hidden cursor-default h-full"
              >
                {/* Glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />

                <div className={`p-3 rounded-xl bg-gradient-to-br ${f.gradient} w-fit mb-4 opacity-80 group-hover:opacity-100 transition-opacity`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-display font-bold text-text-primary mb-2 group-hover:text-gradient-amethyst transition-all">
                  {f.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>

                {/* Corner accent */}
                <div className={`absolute -bottom-1 -right-1 w-24 h-24 bg-gradient-to-tl ${f.gradient} opacity-0 group-hover:opacity-[0.06] blur-2xl transition-opacity duration-500 rounded-full`} />
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ═══════ TECH STACK SHOWCASE ═══════ */}
      <section className="relative z-10 py-24 px-6">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto glass-strong rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
            {/* Background mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.04] via-transparent to-rose-500/[0.03]" />

            <div className="relative z-10">
              <p className="text-label text-teal-400 mb-3">TECH STACK</p>
              <h2 className="text-h2 text-text-primary mb-8">Powered by Cutting-Edge AI</h2>

              <div className="flex flex-wrap justify-center gap-3">
                {['YOLOv11m', 'FastAPI', 'React 19', 'Three.js', 'SQLite', 'OpenCV', 'PaddleOCR', 'WebSocket', 'Framer Motion', 'Leaflet'].map((t) => (
                  <span key={t} className="px-4 py-2 rounded-full glass text-sm text-text-secondary hover:text-teal-400 hover:border-teal-400/20 transition-colors">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="relative z-10 py-12 px-6 border-t border-border-glass">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-teal-400" />
            <span className="font-display font-bold text-text-primary">DRISHTI</span>
            <span className="text-xs text-text-faint">Traffic Intelligence Platform</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-faint">
            <span>Built for Flipkart Gridlock</span>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-text-muted">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
