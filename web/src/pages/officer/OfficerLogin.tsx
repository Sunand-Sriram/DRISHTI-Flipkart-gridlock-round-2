import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DrishtiLogo } from '@/components/ui/DrishtiLogo'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginOfficer, registerOfficer } from '@/lib/store'
import { api } from '@/lib/api'
import { useSummary, useCameras } from '@/lib/hooks'
import { inr } from '@/lib/utils'

function persistOfficer(o: { name: string; email: string; badge?: string; station?: string }) {
  localStorage.setItem('drishti_officer', JSON.stringify(o))
  localStorage.setItem('drishti_role', 'officer')
}

type Mode = 'login' | 'signup'

export default function OfficerLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // login fields
  const [email, setEmail] = useState('officer@drishti.gov.in')
  const [password, setPassword] = useState('drishti123')
  // signup fields
  const [name, setName] = useState('')
  const [badge, setBadge] = useState('')
  const [station, setStation] = useState('')

  const { data: summary } = useSummary()
  const { data: cameras } = useCameras()
  const stats = {
    challansToday: summary?.total ?? 0,
    collected: summary?.fines_collected ?? 0,
    camerasLive: cameras?.filter((c) => c.status === 'live').length ?? 0,
  }

  async function submit() {
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!name || !badge || !email || !password) {
          setError('Please fill all required fields.'); setLoading(false); return
        }
        try {
          const r = await api.officerSignup({ name, badge, email, station: station || 'Bengaluru Traffic PS', password })
          persistOfficer(r.officer)
          navigate('/officer/monitor'); return
        } catch (e) {
          const msg = String(e)
          if (msg.includes('already exists')) { setError('An account with this email already exists.'); setLoading(false); return }
          // offline fallback
          registerOfficer({ name, badge, email, station: station || 'Bengaluru Traffic PS', password })
          loginOfficer(email, password)
          navigate('/officer/monitor'); return
        }
      }
      // login
      try {
        const r = await api.officerLogin(email, password)
        persistOfficer(r.officer)
        navigate('/officer/monitor'); return
      } catch {
        const res = loginOfficer(email, password) // offline fallback (seeded default)
        if (!res.ok) { setError('Invalid email or password.'); setLoading(false); return }
        navigate('/officer/monitor')
      }
    } catch {
      setError('Something went wrong. Try again.'); setLoading(false)
    }
  }

  return (
    <div className="ambient-mesh-officer flex min-h-screen flex-col items-center justify-center px-4 py-10 text-white">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-md flex-col items-center"
      >
        <DrishtiLogo size="lg" />
        <p className="mt-3 text-sm text-officer-muted">Traffic Violation Detection System</p>

        <div className="mt-8 w-full rounded-2xl border border-officer-border bg-officer-surface/70 p-6 backdrop-blur-xl">
          {/* mode toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-officer-border bg-officer-bg/50 p-1">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError('') }}
                className={`rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
                  mode === m ? 'bg-officer-primary text-black' : 'text-officer-muted hover:text-white'
                }`}
              >
                {m === 'login' ? 'Officer Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <Input label="Full Name" placeholder="SI Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Badge No." mono placeholder="KA-1024" value={badge} onChange={(e) => setBadge(e.target.value.toUpperCase())} />
                    <Input label="Station" placeholder="Indiranagar PS" value={station} onChange={(e) => setStation(e.target.value)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Input label="Email" type="email" placeholder="officer@drishti.gov.in" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <Button size="lg" className="w-full" loading={loading} onClick={submit}>
              {mode === 'login' ? 'Sign In →' : 'Create Account & Sign In →'}
            </Button>

            {mode === 'login' && (
              <p className="text-center text-[11px] text-officer-muted">
                Demo login pre-filled · officer@drishti.gov.in / drishti123
              </p>
            )}
          </div>
        </div>

        {/* live stats */}
        <div className="mt-8 grid w-full grid-cols-3 overflow-hidden rounded-2xl border border-officer-border bg-officer-surface/50">
          {[
            { label: 'challans today', value: stats.challansToday.toLocaleString(), color: 'text-officer-primary-soft' },
            { label: 'collected', value: inr(Math.round(stats.collected / 100000) / 10) + 'L', color: 'text-officer-mint' },
            { label: 'cameras live', value: String(stats.camerasLive), color: 'text-white', live: true },
          ].map((s, i) => (
            <div key={s.label} className={`p-4 text-center ${i < 2 ? 'border-r border-officer-border' : ''}`}>
              <p className={`font-mono text-xl font-semibold ${s.color} flex items-center justify-center gap-2`}>
                {s.live && <span className="h-2 w-2 rounded-full bg-officer-mint animate-pulse" />}
                {s.value}
              </p>
              <p className="mt-1 text-[11px] text-officer-muted">{s.label}</p>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/')} className="mt-6 text-xs text-officer-muted hover:text-white">← Back to home</button>
      </motion.div>
    </div>
  )
}
