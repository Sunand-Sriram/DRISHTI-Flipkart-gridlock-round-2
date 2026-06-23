import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, LogIn, UserPlus, Activity, Camera as CamIcon } from 'lucide-react'
import { SceneBackground } from '@/components/three/SceneBackground'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { DrishtiLogo } from '@/components/ui/DrishtiLogo'
import { Input } from '@/components/ui/Input'
import { api } from '@/lib/api'
import { loginOfficer, registerOfficer, setRole } from '@/lib/store'

export default function OfficerLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('officer@drishti.gov.in')
  const [password, setPassword] = useState('drishti123')
  const [name, setName] = useState('')
  const [badge, setBadge] = useState('')
  const [station, setStation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError(''); setLoading(true)
    try {
      const res = await api.officerLogin(email, password)
      if (res.ok) {
        localStorage.setItem('drishti_officer', JSON.stringify(res.officer))
        localStorage.setItem('drishti_role', 'officer')
        navigate('/officer/monitor')
        return
      }
    } catch { /* fallback to local */ }
    const local = loginOfficer(email, password)
    if (local.ok) { navigate('/officer/monitor') }
    else { setError(local.error || 'Invalid credentials') }
    setLoading(false)
  }

  const handleSignup = async () => {
    if (!name || !email || !password) { setError('All fields are required'); return }
    setError(''); setLoading(true)
    try {
      const res = await api.officerSignup({ email, password, name, badge, station })
      if (res.ok) {
        localStorage.setItem('drishti_officer', JSON.stringify(res.officer))
        setRole('officer')
        navigate('/officer/monitor')
        return
      }
    } catch { /* fallback */ }
    const local = registerOfficer({ name, badge, email, station, password })
    if (local.ok) { loginOfficer(email, password); navigate('/officer/monitor') }
    else { setError(local.error || 'Registration failed') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center ambient-officer p-6">
      <SceneBackground variant="officer" />

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass-strong rounded-2xl p-8"
        >
          <div className="flex flex-col items-center mb-8">
            <DrishtiLogo size="lg" animate />
            <p className="text-sm text-text-muted mt-2">Traffic Intelligence Platform</p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] mb-6">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors relative ${mode === m ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
              >
                {mode === m && (
                  <motion.div layoutId="login-tab" className="absolute inset-0 bg-amethyst/15 rounded-lg border border-amethyst/20" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  {m === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ x: mode === 'login' ? -20 : 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: mode === 'login' ? 20 : -20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="space-y-4"
            >
              {mode === 'signup' && (
                <>
                  <Input label="Full Name" placeholder="SI Ramesh Kumar" value={name} onChange={(e) => setName(e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Badge No." placeholder="KA-1024" value={badge} onChange={(e) => setBadge(e.target.value)} mono />
                    <Input label="Station" placeholder="Indiranagar" value={station} onChange={(e) => setStation(e.target.value)} />
                  </div>
                </>
              )}
              <Input label="Email" type="email" placeholder="officer@drishti.gov.in" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-crimson bg-crimson/10 rounded-lg px-3 py-2">
                  {error}
                </motion.p>
              )}

              <MagneticButton
                className="w-full"
                size="lg"
                loading={loading}
                onClick={mode === 'login' ? handleLogin : handleSignup}
              >
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </MagneticButton>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 pt-4 border-t border-border-glass">
            <p className="text-xs text-text-faint text-center mb-3">Demo credentials</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: 'Admin', val: 'admin@drishti.gov.in' },
                { icon: CamIcon, label: 'Officer', val: 'officer@drishti.gov.in' },
                { icon: Activity, label: 'SI Priya', val: 'priya.sharma@drishti.gov.in' },
              ].map((d) => (
                <button
                  key={d.val}
                  onClick={() => { setEmail(d.val); setPassword('drishti123'); setMode('login') }}
                  className="glass rounded-lg p-2 text-center hover:bg-white/[0.04]"
                >
                  <d.icon className="h-4 w-4 mx-auto text-amethyst mb-1" />
                  <span className="text-[10px] text-text-muted block">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-center text-xs text-text-faint mt-6">
          <button onClick={() => navigate('/')} className="hover:text-text-muted">← Back to home</button>
        </p>
      </div>
    </div>
  )
}
