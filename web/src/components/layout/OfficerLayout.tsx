import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MonitorPlay, ClipboardList, Scale, AlertTriangle, FileText, BarChart3,
  MessageSquare, Map, Camera, Mail, LogOut, ChevronLeft, Bell, Menu,
} from 'lucide-react'
import { DrishtiLogo } from '@/components/ui/DrishtiLogo'
import { Badge } from '@/components/ui/Badge'
import { SceneBackground } from '@/components/three/SceneBackground'
import { getOfficer, officerLogout } from '@/lib/store'
import { api, type Notification } from '@/lib/api'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { path: '/officer/monitor', label: 'Live Monitor', icon: MonitorPlay },
  { path: '/officer/review', label: 'Review Queue', icon: ClipboardList, badge: 'review' },
  { path: '/officer/contested', label: 'Contested', icon: Scale },
  { path: '/officer/emergencies', label: 'Emergencies', icon: AlertTriangle, badge: 'emergency' },
  { path: '/officer/challans', label: 'Challans', icon: FileText },
  { path: '/officer/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/officer/chat', label: 'DrishtiBot', icon: MessageSquare },
  { path: '/officer/map', label: 'Live Map', icon: Map },
  { path: '/officer/cameras', label: 'Cameras', icon: Camera },
  { path: '/officer/outbox', label: 'Email Outbox', icon: Mail },
]

export default function OfficerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  // Read once into stable state — getOfficer() returns a fresh object each call,
  // so using it directly would change the polling effect's deps every render and
  // spin an infinite fetch loop.
  const [officer] = useState(getOfficer)
  const [collapsed, setCollapsed] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [showNotifs, setShowNotifs] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    if (!officer) { navigate('/officer'); return }
    const poll = () => {
      api.notifications('officer').then((r) => {
        setNotifications(r.items); setUnread(r.unread)
      }).catch(() => {})
      api.listChallans({ status: 'PENDING_REVIEW', limit: 1 }).then((r) => {
        setReviewCount(r.total)
      }).catch(() => {})
    }
    poll()
    const id = setInterval(poll, 20000)
    return () => clearInterval(id)
  }, [officer, navigate])

  const handleLogout = () => { officerLogout(); navigate('/officer') }

  const markRead = () => {
    api.markNotificationsRead('officer').then(() => setUnread(0)).catch(() => {})
  }

  return (
    <div className="flex h-screen overflow-hidden ambient-officer">
      <SceneBackground variant="officer" />

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-20 flex flex-col border-r border-border-glass bg-void/80 backdrop-blur-xl shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border-glass">
          {!collapsed && <DrishtiLogo size="md" animate />}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-white/[0.04] text-text-muted hover:text-text-primary"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
              {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </motion.div>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-amethyst/10 text-amethyst-light'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/[0.03]',
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-full bg-amethyst glow-amethyst"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge === 'review' && reviewCount > 0 && (
                    <Badge variant="warning" dot className="ml-auto">{reviewCount}</Badge>
                  )}
                  {!collapsed && item.badge === 'emergency' && (
                    <span className="ml-auto h-2 w-2 rounded-full bg-crimson animate-dot-pulse" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Officer profile */}
        {officer && !collapsed && (
          <div className="p-4 border-t border-border-glass">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-amethyst/20 flex items-center justify-center text-amethyst font-display font-bold text-sm">
                {officer.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{officer.name}</p>
                <p className="text-xs text-text-muted truncate">{officer.badge}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-xs text-text-muted hover:text-crimson hover:bg-crimson/5"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        )}
      </motion.aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-border-glass bg-void/50 backdrop-blur-xl z-10 shrink-0">
          <div>
            <h1 className="text-h3 text-text-primary">
              {NAV_ITEMS.find((n) => location.pathname.startsWith(n.path))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markRead() }}
                className="relative p-2 rounded-xl hover:bg-white/[0.04] text-text-muted hover:text-text-primary"
              >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center"
                  >
                    {unread > 9 ? '9+' : unread}
                  </motion.span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto glass-strong rounded-xl z-50"
                  >
                    <div className="p-3 border-b border-border-glass">
                      <span className="text-label text-text-muted">Notifications</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-text-muted text-sm">No notifications</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <button
                          key={n.id}
                          onClick={() => { if (n.link) navigate(n.link); setShowNotifs(false) }}
                          className="w-full text-left px-4 py-3 hover:bg-white/[0.03] border-b border-border-glass last:border-0"
                        >
                          <p className="text-sm text-text-primary font-medium">{n.title}</p>
                          <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                        </button>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
