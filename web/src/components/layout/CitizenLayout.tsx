import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FileText, CreditCard, Bell, HelpCircle, History, LogOut,
} from 'lucide-react'
import { DrishtiLogo } from '@/components/ui/DrishtiLogo'
import { getCitizenToken, getCitizenChallanId, citizenLogout } from '@/lib/store'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/citizen/history', label: 'History', icon: History },
  { path: '/citizen/payments', label: 'Payments', icon: CreditCard },
  { path: '/citizen/notifications', label: 'Alerts', icon: Bell },
  { path: '/citizen/help', label: 'Help', icon: HelpCircle },
]

export default function CitizenLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = getCitizenToken()
  const challanId = getCitizenChallanId()

  useEffect(() => {
    // If on login page (index), don't redirect
    if (location.pathname === '/citizen') return
    // If not logged in, redirect to login
    if (!token) navigate('/citizen')
  }, [token, location.pathname, navigate])

  const handleLogout = () => { citizenLogout(); navigate('/citizen') }

  return (
    <div className="min-h-screen ambient-citizen citizen-portal citizen-scroll">
      {/* ── Desktop header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-citizen-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between h-16 px-6">
          <NavLink to="/citizen" className="flex items-center gap-2">
            <DrishtiLogo size="sm" citizen />
          </NavLink>

          {token && (
            <div className="hidden md:flex items-center gap-1">
              {challanId && (
                <NavLink
                  to={`/citizen/challan/${challanId}`}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                    isActive ? 'bg-citizen-primary/10 text-citizen-primary' : 'text-citizen-muted hover:text-citizen-text hover:bg-gray-50',
                  )}
                >
                  <FileText className="h-4 w-4" /> My Challan
                </NavLink>
              )}
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
                    isActive ? 'bg-citizen-primary/10 text-citizen-primary' : 'text-citizen-muted hover:text-citizen-text hover:bg-gray-50',
                  )}
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </NavLink>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-citizen-muted hover:text-red-600 hover:bg-red-50 ml-2"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="max-w-4xl mx-auto px-6 py-8 pb-28 md:pb-8">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      {token && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-xl border-t border-citizen-border">
          <div className="flex items-center justify-around h-16">
            {challanId && (
              <MobileNavItem to={`/citizen/challan/${challanId}`} icon={FileText} label="Challan" />
            )}
            {NAV_ITEMS.map((item) => (
              <MobileNavItem key={item.path} to={item.path} icon={item.icon} label={item.label} />
            ))}
          </div>
        </nav>
      )}

      {/* Footer */}
      <footer className="hidden md:block max-w-4xl mx-auto px-6 py-6 border-t border-citizen-border mt-8">
        <p className="text-xs text-citizen-faint text-center">
          © 2025 DRISHTI — AI-Powered Traffic Enforcement · Government of Karnataka
        </p>
      </footer>
    </div>
  )
}

function MobileNavItem({ to, icon: Icon, label }: { to: string; icon: typeof FileText; label: string }) {
  const location = useLocation()
  const isActive = location.pathname.startsWith(to)
  return (
    <NavLink to={to} className="flex flex-col items-center gap-0.5 px-2 py-1 relative">
      {isActive && (
        <motion.div
          layoutId="citizen-nav-indicator"
          className="absolute -top-px inset-x-2 h-0.5 rounded-full bg-citizen-primary"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <Icon className={cn('h-5 w-5', isActive ? 'text-citizen-primary' : 'text-citizen-muted')} />
      <span className={cn('text-[10px] font-medium', isActive ? 'text-citizen-primary' : 'text-citizen-muted')}>
        {label}
      </span>
    </NavLink>
  )
}
