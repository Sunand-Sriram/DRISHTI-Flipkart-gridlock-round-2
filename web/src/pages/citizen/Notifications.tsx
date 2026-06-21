import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { api, type Notification } from '@/lib/api'
import { getCitizenPlate } from '@/lib/store'

const KIND_ICON: Record<string, string> = {
  challan: '📄', payment: '💰', contest: '⚖️', system: '🔔',
}

function timeAgo(ts: number) {
  const s = Math.floor(Date.now() / 1000 - ts)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function Notifications() {
  const navigate = useNavigate()
  const plate = getCitizenPlate() || ''
  const [items, setItems] = useState<Notification[]>([])

  useEffect(() => {
    if (!plate) return
    api.notifications(plate).then((r) => setItems(r.items)).catch(() => setItems([]))
    api.markNotificationsRead(plate).catch(() => {})
  }, [plate])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-citizen-ink">Notifications</h1>
        <p className="mt-1 text-sm text-citizen-muted">Updates about your challans, payments and contests.</p>
      </div>

      {items.length === 0 ? (
        <Card citizen className="py-12 text-center text-citizen-muted">
          <Bell className="mx-auto mb-3 h-8 w-8 text-citizen-faint" />
          You’re all caught up — no notifications.
        </Card>
      ) : (
        <Card citizen padding={false}>
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => n.link && navigate(n.link)}
              className="flex w-full items-start gap-3 border-b border-citizen-border/60 px-4 py-4 text-left last:border-0 hover:bg-citizen-primary/5"
            >
              <span className="text-lg">{KIND_ICON[n.kind] || '🔔'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-citizen-ink">{n.title}</p>
                <p className="text-sm text-citizen-muted">{n.body}</p>
                <p className="mt-0.5 font-mono text-[11px] text-citizen-faint">{timeAgo(n.created_at)}</p>
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-citizen-primary" />}
            </button>
          ))}
        </Card>
      )}
    </div>
  )
}
