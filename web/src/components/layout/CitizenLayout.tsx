import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell, CreditCard, FileText, HelpCircle, History as HistoryIcon,
  Home, LogOut, Receipt, ShieldQuestion,
} from 'lucide-react'
import { DrishtiLogo } from '@/components/ui/DrishtiLogo'
import { cn } from '@/lib/utils'
import { citizenLogout, getCitizenChallanId, getCitizenToken } from '@/lib/store'

export function CitizenLayout() {
  const navigate = useNavigate()
  const loggedIn = !!getCitizenToken()
  const challanId = getCitizenChallanId()

  const nav = [
    { to: challanId ? `/citizen/challan/${challanId}` : '/citizen', label: 'My Challan', icon: FileText },
    { to: challanId ? `/citizen/pay/${challanId}` : '/citizen', label: 'Pay Fine', icon: CreditCard },
    { to: challanId ? `/citizen/contest/${challanId}` : '/citizen', label: 'Contest Challan', icon: ShieldQuestion },
    { to: '/citizen/history', label: 'Challan History', icon: HistoryIcon },
    { to: '/citizen/payments', label: 'Payment History', icon: Receipt },
    { to: '/citizen/notifications', label: 'Notifications', icon: Bell },
    { to: '/citizen/help', label: 'Help & Support', icon: HelpCircle },
  ]

  function logout() {
    citizenLogout()
    navigate('/citizen')
  }

  return (
    <div className="ambient-mesh-citizen citizen-scroll min-h-screen text-citizen-ink">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[248px] flex-col border-r border-citizen-border bg-white/80 backdrop-blur-xl md:flex">
          <div className="border-b border-citizen-border p-5">
            <Link to="/"><DrishtiLogo size="sm" citizen /></Link>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-citizen-faint">Citizen Portal</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {nav.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/citizen'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-citizen-primary/10 text-citizen-primary'
                      : 'text-citizen-muted hover:bg-citizen-primary/5 hover:text-citizen-ink'
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-citizen-border p-4">
            {loggedIn ? (
              <button
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100"
              >
                <LogOut className="h-[18px] w-[18px]" /> Sign Out
              </button>
            ) : (
              <Link
                to="/"
                className="flex w-full items-center gap-2 rounded-xl border border-citizen-border px-3 py-2.5 text-sm font-medium text-citizen-muted hover:text-citizen-ink"
              >
                <Home className="h-[18px] w-[18px]" /> Home
              </Link>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-citizen-border bg-white/80 px-[clamp(1rem,3vw,2rem)] backdrop-blur-xl md:hidden">
            <Link to="/citizen"><DrishtiLogo size="sm" citizen /></Link>
            <Link to="/" className="text-sm text-citizen-muted hover:text-citizen-primary">Home</Link>
          </header>

          <main className="mx-auto w-full max-w-3xl flex-1 px-[clamp(1rem,3vw,2rem)] py-[clamp(1.5rem,4vw,2.5rem)] pb-24">
            <Outlet />
          </main>

          {/* Mobile bottom nav */}
          <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-citizen-border bg-white/95 py-2 backdrop-blur-xl md:hidden">
            {[nav[0], nav[1], nav[3], nav[5]].map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  cn('flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]',
                    isActive ? 'text-citizen-primary' : 'text-citizen-faint')
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label.split(' ')[0]}
              </NavLink>
            ))}
          </nav>

          <footer className="border-t border-citizen-border bg-white/60 py-5 text-center text-xs text-citizen-faint">
            © 2026 DRISHTI · Demo build · support@drishti.local
          </footer>
        </div>
      </div>
    </div>
  )
}
