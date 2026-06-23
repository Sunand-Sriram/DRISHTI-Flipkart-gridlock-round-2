import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api, type Notification } from '@/lib/api'
import { getCitizenPlate } from '@/lib/store'

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const plate = getCitizenPlate()

  useEffect(() => {
    // Citizen notifications are stored under the vehicle plate (the audience),
    // not a literal "citizen" string. Mark them read after loading.
    if (!plate) { setLoading(false); return }
    api.notifications(plate)
      .then((r) => { setItems(r.items); api.markNotificationsRead(plate).catch(() => {}) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [plate])

  return (
    <div className="space-y-6">
      <h1 className="text-h1 text-citizen-text">Notifications</h1>

      {loading ? (
        <p className="text-center py-12 text-citizen-muted">Loading...</p>
      ) : items.length === 0 ? (
        <Card citizen className="text-center py-12">
          <BellOff className="h-10 w-10 text-citizen-faint mx-auto mb-2" />
          <p className="text-citizen-muted">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card citizen key={n.id} className={`${n.read ? '' : 'border-l-4 border-l-citizen-primary'}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${n.read ? 'bg-gray-100' : 'bg-citizen-primary/10'}`}>
                  <Bell className={`h-4 w-4 ${n.read ? 'text-citizen-faint' : 'text-citizen-primary'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-citizen-text">{n.title}</p>
                  <p className="text-xs text-citizen-muted mt-0.5">{n.body}</p>
                  <p className="text-xs text-citizen-faint mt-2">{new Date(n.created_at * 1000).toLocaleString()}</p>
                </div>
                {!n.read && <Badge variant="info" className="shrink-0">New</Badge>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
