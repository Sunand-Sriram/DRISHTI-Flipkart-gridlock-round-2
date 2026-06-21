import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Camera,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Radio,
  Shield,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DrishtiLogo } from '@/components/ui/DrishtiLogo'
import { cn } from '@/lib/utils'
import { getOfficer, getRole } from '@/lib/store'
import { useCameras, useChallans, useEmergencies } from '@/lib/hooks'
import { api, type Notification } from '@/lib/api'
import { AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const nav = [
  { to: '/officer/monitor', label: 'Live Monitor', icon: Radio, section: 'Operations' },
  { to: '/officer/review', label: 'Review Queue', icon: LayoutDashboard, badgeKey: 'review' },
  { to: '/officer/contested', label: 'Contested', icon: Shield },
  { to: '/officer/emergencies', label: 'Emergencies', icon: AlertTriangle, dotKey: 'emergency' },
  { to: '/officer/challans', label: 'Challans', icon: ClipboardList },
  { to: '/officer/analytics', label: 'Analytics', icon: BarChart3, section: 'Intelligence' },
  { to: '/officer/chat', label: 'Ask DrishtiBot', icon: MessageSquare },
  { to: '/officer/map', label: 'Live Map', icon: MapPin },
  { to: '/officer/cameras', label: 'Cameras', icon: Camera },
  { to: '/officer/outbox', label: 'Email Outbox', icon: Mail },
]

const labels: Record<string, string> = {
  monitor: 'Live Monitor',
  review: 'Review Queue',
  contested: 'Contested',
  emergencies: 'Emergency Alerts',
  challans: 'Challans',
  analytics: 'Analytics',
  chat: 'Chat Analytics',
  map: 'Live Map',
  cameras: 'Cameras & Checkposts',
  outbox: 'Email Outbox',
}

export function OfficerLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const segment = location.pathname.split('/').pop() || 'monitor'
  const role = getRole()
  const officer = getOfficer()
  const { data: cameras } = useCameras()
  const { data: review } = useChallans({ status: 'PENDING_REVIEW', limit: 1 })
  const { data: emergencies } = useEmergencies('active')
  const camerasLive = cameras?.filter((c) => c.status === 'live').length ?? 0
  const reviewCount = review?.total ?? 0
  const hasEmergency = (emergencies?.length ?? 0) > 0

  // ── notifications ──
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  function loadNotifs() {
    api.notifications('officer').then((r) => { setNotifs(r.items); setUnread(r.unread) }).catch(() => {})
  }
  useEffect(() => {
    loadNotifs()
    const t = setInterval(loadNotifs, 20000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function openNotifs() {
    setNotifOpen((o) => !o)
    if (!notifOpen && unread > 0) {
      api.markNotificationsRead('officer').then(() => setUnread(0)).catch(() => {})
    }
  }

  const initials = (officer?.name || 'SI Ramesh K.').split(' ').map((s) => s[0]).slice(0, 2).join('')

  const kindIcon: Record<string, string> = {
    emergency: '🚨', contest: '⚖️', payment: '💰', challan: '📄', system: '🔔',
  }
  function timeAgo(ts: number) {
    const s = Math.floor(Date.now() / 1000 - ts)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <div className="ambient-mesh-officer flex min-h-screen text-white">
      <aside
        className={cn(
          'sticky top-0 flex h-screen flex-col border-r border-officer-border bg-officer-surface/95 backdrop-blur-xl transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[240px]'
        )}
      >
        <div className="flex items-center gap-3 border-b border-officer-border p-5">
          {!collapsed && <DrishtiLogo size="sm" />}
          {collapsed && (
            <div className="mx-auto h-8 w-8 rotate-45 rounded-lg border border-officer-primary/50 grid place-items-center">
              <span className="h-2 w-2 rotate-[-45deg] rounded-full bg-officer-primary" />
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {nav.map((item, i) => {
            const prev = nav[i - 1]
            const showSection = item.section && item.section !== prev?.section
            return (
              <div key={item.to}>
                {showSection && !collapsed && (
                  <p className="px-3 pb-2 pt-4 text-[10px] font-mono uppercase tracking-[0.22em] text-officer-muted/70">
                    {item.section}
                  </p>
                )}
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-amber-500/15 text-amber-200'
                        : 'text-officer-muted hover:bg-white/5 hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="officer-nav-indicator"
                          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-officer-primary"
                        />
                      )}
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badgeKey === 'review' && reviewCount > 0 && (
                            <span className="ml-auto font-mono text-[10px] rounded-full bg-officer-primary px-1.5 py-0.5 text-white">
                              {reviewCount}
                            </span>
                          )}
                          {item.dotKey === 'emergency' && hasEmergency && (
                            <span className="ml-auto h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                          )}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              </div>
            )
          })}
        </nav>
        {!collapsed && (
          <div className="border-t border-officer-border p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs text-officer-mint">
              <span className="h-2 w-2 rounded-full bg-officer-mint animate-pulse" />
              {camerasLive} cameras live
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-officer-border bg-officer-bg/50 p-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-xs font-bold text-black">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{officer?.name || 'SI Ramesh Kumar'}</p>
                <p className="text-[10px] text-officer-muted capitalize">{officer?.badge || role || 'Officer'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-officer-border bg-officer-surface/90 px-[clamp(1rem,3vw,1.75rem)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg border border-officer-border p-2 text-officer-muted hover:text-white"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-officer-muted/70">Officer Portal</p>
            <h1 className="text-lg font-semibold">{labels[segment] || 'Dashboard'}</h1>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-officer-border px-3 py-1.5 font-mono text-xs text-officer-mint sm:flex">
              <span className="h-2 w-2 rounded-full bg-officer-mint animate-pulse" />
              {camerasLive} LIVE
            </div>
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={openNotifs}
                className="relative rounded-xl border border-officer-border p-2.5 text-officer-muted hover:text-white"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-officer-primary px-1 font-mono text-[9px] font-bold text-black">
                    {unread}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-officer-border bg-officer-surface shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-officer-border px-4 py-3">
                      <p className="text-sm font-semibold">Notifications</p>
                      <span className="font-mono text-[10px] text-officer-muted">{notifs.length} recent</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-officer-muted">No notifications</p>
                      ) : notifs.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { setNotifOpen(false); if (n.link) navigate(n.link) }}
                          className="flex w-full items-start gap-3 border-b border-officer-border/50 px-4 py-3 text-left hover:bg-white/5"
                        >
                          <span className="text-base">{kindIcon[n.kind] || '🔔'}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{n.title}</p>
                            <p className="truncate text-xs text-officer-muted">{n.body}</p>
                            <p className="mt-0.5 font-mono text-[10px] text-officer-faint">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-officer-primary" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link
              to="/"
              className="flex h-10 items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/20 hover:text-rose-300"
              aria-label="Exit officer portal"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Exit</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 p-[clamp(1rem,3vw,2.5rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
