import { lazy, Suspense, useEffect } from 'react'
import { API } from '@/lib/api'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LenisProvider } from '@/components/effects/LenisProvider'
import { NoiseOverlay } from '@/components/effects/NoiseOverlay'
import { ToastProvider } from '@/components/ui/Toast'

/* ── Layouts ────────────────────────────────────────────────────────────── */
const OfficerLayout = lazy(() => import('@/components/layout/OfficerLayout'))
const CitizenLayout = lazy(() => import('@/components/layout/CitizenLayout'))

/* ── Landing ────────────────────────────────────────────────────────────── */
const Landing = lazy(() => import('@/pages/Landing'))

/* ── Officer pages ──────────────────────────────────────────────────────── */
const OfficerLogin    = lazy(() => import('@/pages/officer/OfficerLogin'))
const LiveMonitor     = lazy(() => import('@/pages/officer/LiveMonitor'))
const ReviewQueue     = lazy(() => import('@/pages/officer/ReviewQueue'))
const ContestedQueue  = lazy(() => import('@/pages/officer/ContestedQueue'))
const Emergencies     = lazy(() => import('@/pages/officer/Emergencies'))
const ChallanList     = lazy(() => import('@/pages/officer/ChallanList'))
const ChallanDetail   = lazy(() => import('@/pages/officer/ChallanDetail'))
const Analytics       = lazy(() => import('@/pages/officer/Analytics'))
const ChatAnalytics   = lazy(() => import('@/pages/officer/ChatAnalytics'))
const LiveMap         = lazy(() => import('@/pages/officer/LiveMap'))
const CameraManagement = lazy(() => import('@/pages/officer/CameraManagement'))
const Outbox          = lazy(() => import('@/pages/officer/Outbox'))

/* ── Citizen pages ──────────────────────────────────────────────────────── */
const CitizenLogin    = lazy(() => import('@/pages/citizen/CitizenLogin'))
const MyChallan       = lazy(() => import('@/pages/citizen/MyChallan'))
const PayNow          = lazy(() => import('@/pages/citizen/PaymentGateway'))
const ContestChallan  = lazy(() => import('@/pages/citizen/ContestForm'))
const Receipt         = lazy(() => import('@/pages/citizen/Receipt'))
const History         = lazy(() => import('@/pages/citizen/ViolationHistory'))
const PaymentHistory  = lazy(() => import('@/pages/citizen/PaymentHistory'))
const Notifications   = lazy(() => import('@/pages/citizen/Notifications'))
const Help            = lazy(() => import('@/pages/citizen/Help'))

/* ── Loading fallback ───────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-midnight z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-amethyst/30 border-t-amethyst animate-spin" />
        <span className="text-label text-text-muted tracking-widest">LOADING</span>
      </div>
    </div>
  )
}

/* ── Animated routes wrapper ────────────────────────────────────────────── */
function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Landing */}
        <Route path="/" element={<Landing />} />

        {/* Officer login (standalone, no layout) */}
        <Route path="/officer" element={<OfficerLogin />} />

        {/* Officer portal (with layout) */}
        <Route element={<OfficerLayout />}>
          <Route path="/officer/monitor" element={<LiveMonitor />} />
          <Route path="/officer/review" element={<ReviewQueue />} />
          <Route path="/officer/contested" element={<ContestedQueue />} />
          <Route path="/officer/emergencies" element={<Emergencies />} />
          <Route path="/officer/challans" element={<ChallanList />} />
          <Route path="/officer/challans/:id" element={<ChallanDetail />} />
          <Route path="/officer/analytics" element={<Analytics />} />
          <Route path="/officer/chat" element={<ChatAnalytics />} />
          <Route path="/officer/map" element={<LiveMap />} />
          <Route path="/officer/cameras" element={<CameraManagement />} />
          <Route path="/officer/outbox" element={<Outbox />} />
        </Route>

        {/* Citizen portal (with layout) */}
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<CitizenLogin />} />
          <Route path="challan/:id" element={<MyChallan />} />
          <Route path="pay/:id" element={<PayNow />} />
          <Route path="contest/:id" element={<ContestChallan />} />
          <Route path="receipt/:id" element={<Receipt />} />
          <Route path="history" element={<History />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<Help />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

/* ── App root ───────────────────────────────────────────────────────────── */
export default function App() {
  // Warm up the backend on first load. On Render's free tier the API sleeps
  // after ~15 min idle and takes ~50s to wake; pinging it while the visitor
  // reads the landing page means data + evidence images are ready by the time
  // they open a portal (avoids a cold-start burst of failed image requests).
  useEffect(() => {
    fetch(`${API}/`, { cache: 'no-store' }).catch(() => {})
  }, [])

  return (
    <BrowserRouter>
      <LenisProvider>
        <ToastProvider>
          <NoiseOverlay opacity={0.03} />
          <Suspense fallback={<LoadingScreen />}>
            <AnimatedRoutes />
          </Suspense>
        </ToastProvider>
      </LenisProvider>
    </BrowserRouter>
  )
}
