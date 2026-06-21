import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { DrishtiMap, type MapMarker } from '@/components/ui/DrishtiMap'
import { api } from '@/lib/api'
import type { Emergency } from '@/lib/types'

export default function Emergencies() {
  const [active, setActive] = useState<Emergency[]>([])
  const [resolved, setResolved] = useState<Emergency[]>([])
  const [mapFor, setMapFor] = useState<string | null>(null)
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    api.emergencies('active').then(setActive).catch(() => setActive([]))
    api.emergencies('resolved').then(setResolved).catch(() => setResolved([]))
  }, [])

  function dismiss(id: string) {
    api.dismissEmergency(id).catch(() => {})
    setActive((a) => a.filter((e) => e.id !== id))
  }

  async function followUp(id: string) {
    setFollowed((s) => new Set(s).add(id))
    try {
      const r = await api.followUpEmergency(id)
      setToast(`✓ Green-corridor alert sent to ${r.checkpost} — ${r.vehicle} inbound from ${r.camera}`)
    } catch {
      setToast('⚠️ Could not dispatch alert')
    }
    setTimeout(() => setToast(null), 4000)
  }

  const markers: MapMarker[] = active.map((e) => ({
    lat: e.lat, lng: e.lng, label: `🚨 ${e.vehicle}`, sub: `${e.location} → ${e.checkpost}`,
    color: '#fbbf24', radius: 11,
  }))

  return (
    <div className="space-y-8">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="fixed right-6 top-20 z-50 max-w-sm rounded-xl border border-officer-mint/40 bg-officer-surface px-5 py-4 text-sm text-officer-mint shadow-2xl"
        >
          {toast}
        </motion.div>
      )}
      <p className="text-2xl font-bold text-officer-mint">🚨 ACTIVE EMERGENCIES: {active.length}</p>

      {active.length === 0 ? (
        <Card className="py-12 text-center text-officer-mint">All clear — no active alerts ✓</Card>
      ) : (
        <>
        <Card padding={false} className="overflow-hidden">
          <DrishtiMap markers={markers} height={300} zoom={12} />
        </Card>
        <div className="space-y-5">
          {active.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-red-500/20">
                <div className="mb-4 rounded-lg bg-red-500/20 px-4 py-2 font-bold text-red-300">
                  ⚠️ {e.vehicle} DETECTED
                </div>
                <p className="font-mono text-officer-muted">{e.camera} · {e.location}</p>
                <p className="mt-2 text-sm text-officer-muted">
                  {new Date(e.created_at * 1000).toLocaleTimeString()} · Spotted {Math.round((Date.now() / 1000 - e.created_at) / 60)}m ago
                </p>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-officer-mint">📍 Alert Status: ✓ Sent to {e.checkpost}</p>
                  <p className="text-officer-muted">📍 Checkpost Officer: {e.officer}</p>
                  <p className="text-officer-muted">📍 Est. Time to Clearance: 2m 15s</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setMapFor(mapFor === e.id ? null : e.id)}>
                    {mapFor === e.id ? 'Hide Map' : 'View on Map'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => dismiss(e.id)}>Dismiss</Button>
                  <Button
                    size="sm"
                    variant={followed.has(e.id) ? 'success' : 'ghost'}
                    onClick={() => followUp(e.id)}
                  >
                    {followed.has(e.id) ? '✓ Alert Sent' : 'Follow Up'}
                  </Button>
                </div>
                {mapFor === e.id && (
                  <div className="mt-4 overflow-hidden rounded-xl">
                    <DrishtiMap
                      markers={[{ lat: e.lat, lng: e.lng, label: `🚨 ${e.vehicle}`, sub: e.location, color: '#fbbf24', radius: 12 }]}
                      center={[e.lat, e.lng]} zoom={15} height={240}
                    />
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
        </>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">📋 Alert History (past 2 hours)</h2>
        <Card padding={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-officer-border text-left text-officer-muted">
                <th className="p-4">Time</th>
                <th className="p-4">Type</th>
                <th className="p-4">Camera</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {resolved.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-officer-muted">No resolved alerts</td></tr>
              ) : resolved.map((h) => (
                <tr key={h.id} className="border-b border-officer-border/50 hover:bg-white/5">
                  <td className="p-4 font-mono">{new Date(h.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-4 capitalize">{h.vehicle}</td>
                  <td className="p-4 font-mono">{h.camera}</td>
                  <td className="p-4 text-officer-mint">Cleared ✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
