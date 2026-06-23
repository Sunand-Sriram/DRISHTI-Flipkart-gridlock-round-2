import { useState } from 'react'
import { Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { DrishtiMap } from '@/components/ui/DrishtiMap'
import { useCameras, useCheckposts, useEmergencies, useHotspots } from '@/lib/hooks'

export default function LiveMap() {
  const [showCams, setShowCams] = useState(true)
  const [showCheckposts, setShowCheckposts] = useState(true)
  const [showHotspots, setShowHotspots] = useState(true)
  const [showEmergencies, setShowEmergencies] = useState(true)
  const [timeOffset, setTimeOffset] = useState(0)

  const { data: cams } = useCameras()
  const { data: cps } = useCheckposts()
  const { data: emergencies } = useEmergencies('active')
  const { data: hotspotData } = useHotspots(timeOffset)

  const markers = [
    ...(showCams ? (cams || []).map((c) => ({
      lat: c.lat, lng: c.lng,
      label: `📹 ${c.name} (${c.id})`,
      color: c.status === 'live' ? '#10B981' : '#6B7280',
      radius: 7,
      popup: `Camera · ${c.count} violations · ${c.status}`,
    })) : []),
    ...(showCheckposts ? (cps || []).map((c) => ({
      lat: c.lat, lng: c.lng,
      label: `🛡️ ${c.name}`,
      color: '#3B82F6',
      radius: 10,
      popup: `Checkpost · Officer: ${c.officer}`,
    })) : []),
    ...(showEmergencies ? (emergencies || []).map((e) => {
      const v = (e.vehicle || '').toLowerCase()
      const icon = v.includes('ambulance') ? '🚑' : v.includes('fire') ? '🚒' : '🚔'
      const color = v.includes('ambulance') ? '#EF4444' : v.includes('fire') ? '#F97316' : '#8B5CF6'
      return {
        lat: e.lat, lng: e.lng,
        label: `${icon} ${e.vehicle.replace(/_/g, ' ').toUpperCase()}`,
        color,
        radius: 14,
        popup: `Emergency · ${e.location} · ${e.camera}`,
      }
    }) : []),
    ...(showHotspots ? (hotspotData?.hotspots || []).map((h) => ({
      lat: h.lat, lng: h.lng,
      label: `🔥 ${h.label}`,
      color: h.risk > 0.7 ? '#EF4444' : h.risk > 0.4 ? '#F59E0B' : '#10B981',
      radius: 6 + Math.round(h.risk * 8),
      popup: `Hotspot · Risk: ${(h.risk * 100).toFixed(0)}% · ${h.top_violation}`,
    })) : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 text-text-primary">Live Map</h2>
        <div className="flex items-center gap-4">
          <Switch checked={showCams} onChange={setShowCams} label="Cameras" />
          <Switch checked={showCheckposts} onChange={setShowCheckposts} label="Checkposts" />
          <Switch checked={showHotspots} onChange={setShowHotspots} label="Hotspots" />
          <Switch checked={showEmergencies} onChange={setShowEmergencies} label="Emergencies" />
        </div>
      </div>

      <DrishtiMap markers={markers} height="calc(100vh - 280px)" />

      {/* Hotspot time slider */}
      {showHotspots && (
        <Card>
          <div className="flex items-center gap-4">
            <Clock className="h-5 w-5 text-text-muted" />
            <span className="text-sm text-text-muted">Predict:</span>
            <input
              type="range" min={0} max={360} step={30} value={timeOffset}
              onChange={(e) => setTimeOffset(+e.target.value)}
              className="flex-1 accent-amethyst"
            />
            <span className="text-sm font-mono text-text-secondary w-20">+{(timeOffset / 60).toFixed(1)}h</span>
          </div>
          {hotspotData && (
            <p className="text-xs text-text-faint mt-2">
              Based on {hotspotData.based_on} events over {hotspotData.weeks} weeks
            </p>
          )}
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Camera (Live)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-500" /> Camera (Offline)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Checkpost</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> 🚑 Ambulance</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> 🚒 Fire Engine</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" /> 🚔 Police</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> 🔥 Hotspot</span>
      </div>
    </div>
  )
}
