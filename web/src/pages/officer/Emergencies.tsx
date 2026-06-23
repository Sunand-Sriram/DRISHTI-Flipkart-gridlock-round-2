import { AlertTriangle, Siren, MapPin, Send, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MagneticButton } from '@/components/motion/MagneticButton'
import { DrishtiMap } from '@/components/ui/DrishtiMap'
import { useEmergencies } from '@/lib/hooks'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

export default function Emergencies() {
  const { data: active, reload } = useEmergencies('active')
  const { data: resolved } = useEmergencies('resolved')
  const toast = useToast()
  const items = active || []

  const markers = items.map((e) => ({
    lat: e.lat, lng: e.lng,
    label: `${e.vehicle.toUpperCase()} — ${e.location}`,
    color: '#F43F5E',
    radius: 12,
  }))

  const dismiss = async (id: string) => { await api.dismissEmergency(id); toast.info('Emergency dismissed'); reload() }
  const followUp = async (id: string) => { await api.followUpEmergency(id); toast.success('Green corridor alert dispatched'); reload() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 text-text-primary">Emergency Alerts</h2>
        <Badge variant="danger" dot>{items.length} active</Badge>
      </div>

      {/* Map */}
      <DrishtiMap markers={markers} height="300px" className="border border-border-glass" />

      {/* Active */}
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <Siren className="h-10 w-10 text-emerald mx-auto mb-2" />
          <p className="text-text-muted">No active emergencies</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 100, damping: 20 }}
            >
              <Card className="border border-crimson/20 animate-border-glow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-crimson/15">
                    <AlertTriangle className="h-5 w-5 text-crimson" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-text-primary capitalize">{e.vehicle}</p>
                    <p className="text-xs text-text-muted">{e.id} · {e.camera}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-1">
                  <MapPin className="h-3.5 w-3.5 text-text-muted" /> {e.location}
                </div>
                <p className="text-xs text-text-muted mb-4">Checkpost: {e.checkpost} · Officer: {e.officer}</p>
                <div className="flex gap-2">
                  <MagneticButton variant="success" size="sm" onClick={() => followUp(e.id)} className="flex-1">
                    <Send className="h-3.5 w-3.5" /> Follow Up
                  </MagneticButton>
                  <MagneticButton variant="ghost" size="sm" onClick={() => dismiss(e.id)}>
                    <X className="h-3.5 w-3.5" /> Dismiss
                  </MagneticButton>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Resolved history */}
      {resolved && resolved.length > 0 && (
        <>
          <h3 className="text-h3 text-text-primary pt-4">Recent History</h3>
          <div className="glass rounded-xl overflow-hidden">
            <table className="data-table">
              <thead><tr><th>ID</th><th>Vehicle</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {resolved.slice(0, 10).map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono text-xs">{e.id}</td>
                    <td className="capitalize">{e.vehicle}</td>
                    <td>{e.location}</td>
                    <td><Badge variant={e.status === 'resolved' ? 'success' : 'muted'}>{e.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
