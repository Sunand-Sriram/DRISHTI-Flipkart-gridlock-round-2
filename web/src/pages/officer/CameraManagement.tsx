import { useState, useEffect } from 'react'
import { Camera as CamIcon, MapPin, Bell, History } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCameras, useCheckposts, useAuditLog } from '@/lib/hooks'
import { api, type Notification } from '@/lib/api'

export default function CameraManagement() {
  const { data: cams } = useCameras()
  const { data: cps } = useCheckposts()
  const { data: audit } = useAuditLog(20)
  const [activeTab, setActiveTab] = useState<'cameras' | 'checkposts' | 'alerts' | 'audit'>('cameras')
  const [selectedCP, setSelectedCP] = useState('')
  const [alerts, setAlerts] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const poll = () => {
      if (selectedCP) {
        api.checkpostAlerts(selectedCP).then((r) => { setAlerts(r.items); setUnread(r.unread) }).catch(() => {})
      } else {
        // Load alerts for ALL checkposts
        if (!cps || cps.length === 0) return
        Promise.all(cps.map((c) => api.checkpostAlerts(c.name).catch(() => ({ items: [] as Notification[], unread: 0 }))))
          .then((results) => {
            const all = results.flatMap((r) => r.items || [])
            all.sort((a, b) => b.created_at - a.created_at)
            setAlerts(all)
            setUnread(all.filter((n) => !n.read).length)
          })
      }
    }
    poll()
    const id = setInterval(poll, 8000)
    return () => clearInterval(id)
  }, [selectedCP, cps])

  const tabs = [
    { key: 'cameras' as const, label: 'Cameras', icon: CamIcon },
    { key: 'checkposts' as const, label: 'Checkposts', icon: MapPin },
    { key: 'alerts' as const, label: 'Alerts', icon: Bell },
    { key: 'audit' as const, label: 'Audit Log', icon: History },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-h2 text-text-primary">Camera Management</h2>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${activeTab === t.key ? 'glass bg-amethyst/10 text-amethyst-light' : 'text-text-muted hover:bg-white/[0.03]'}`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
            {t.key === 'alerts' && unread > 0 && <span className="ml-1 h-2 w-2 rounded-full bg-crimson animate-pulse" />}
          </button>
        ))}
      </div>

      {activeTab === 'cameras' && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Status</th><th>Violations</th></tr></thead>
            <tbody>
              {(cams || []).map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs text-amethyst-light">{c.id}</td>
                  <td className="font-medium">{c.name}</td>
                  <td className="text-text-muted">{c.location}</td>
                  <td>
                    <Badge variant={c.status === 'live' ? 'success' : 'muted'} dot>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="font-mono">{c.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'checkposts' && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Officer</th></tr></thead>
            <tbody>
              {(cps || []).map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.id}</td>
                  <td className="font-medium">{c.name}</td>
                  <td className="text-text-muted">{c.location}</td>
                  <td>{c.officer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedCP}
              onChange={(e) => setSelectedCP(e.target.value)}
              className="h-10 px-4 rounded-xl text-sm bg-white/[0.03] border border-border-glass text-text-primary outline-none"
            >
              <option value="">All Checkposts</option>
              {(cps || []).map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            {unread > 0 && <Badge variant="danger" dot>{unread} unread</Badge>}
            <span className="text-xs text-text-faint ml-auto">{alerts.length} alert(s)</span>
          </div>
          {alerts.length === 0 ? (
            <Card className="text-center py-8"><p className="text-text-muted text-sm">{selectedCP ? 'No alerts for this checkpost' : 'No alerts yet'}</p></Card>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <Card key={`${a.id}-${i}`} className={a.read ? '' : 'border border-amethyst/20'}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    {a.audience && (
                      <Badge variant="info" className="text-[10px]">{String(a.audience).replace('cp:', '')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{a.body}</p>
                  <p className="text-xs text-text-faint mt-1">{new Date(a.created_at * 1000).toLocaleString()}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="data-table">
            <thead><tr><th>ID</th><th>Action</th><th>Actor</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {(audit || []).map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-xs">{a.id}</td>
                  <td className="text-sm">{a.action}</td>
                  <td>{a.actor}</td>
                  <td><Badge variant={a.status === 'OK' ? 'success' : 'muted'}>{a.status}</Badge></td>
                  <td className="text-text-muted text-xs">{new Date(a.created_at * 1000).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
