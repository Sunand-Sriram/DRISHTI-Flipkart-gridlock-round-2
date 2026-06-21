import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Switch } from '@/components/ui/Switch'
import { DrishtiMap, type MapMarker } from '@/components/ui/DrishtiMap'
import { useCameras, useCheckposts, useHotspots, useEmergencies } from '@/lib/hooks'

export default function LiveMap() {
  const [offset, setOffset] = useState(120)
  const [layers, setLayers] = useState({ cameras: true, hotspots: true, checkposts: true, emergencies: true })

  const { data: cameras } = useCameras()
  const { data: checkposts } = useCheckposts()
  const { data: emergencies } = useEmergencies('active')
  // snap to 30-min buckets so dragging the slider doesn't spam the backend
  const { data: hotspotData } = useHotspots(Math.round(offset / 30) * 30)
  const mockCameras = cameras ?? []
  const hotspots = (hotspotData?.hotspots ?? []).slice(0, 6)

  const futureTime = new Date(Date.now() + offset * 60000)

  // build map markers from the toggled layers
  const markers: MapMarker[] = []
  if (layers.cameras)
    mockCameras.forEach((c) => markers.push({
      lat: c.lat, lng: c.lng, label: `${c.name} (${c.status})`, sub: c.location,
      color: c.status === 'live' ? '#34d399' : '#5b6473', radius: 8,
    }))
  if (layers.checkposts)
    (checkposts ?? []).forEach((c) => markers.push({
      lat: c.lat, lng: c.lng, label: c.name, sub: `Officer: ${c.officer}`, color: '#2d5bff', radius: 8,
    }))
  if (layers.hotspots)
    hotspots.forEach((h) => markers.push({
      lat: h.lat, lng: h.lng, label: `${h.label} · risk ${h.risk}/10`,
      sub: `Predicted ${h.expected ?? ''} violations`, color: '#ff5d5d', radius: 6 + (h.risk || 1),
    }))
  if (layers.emergencies)
    (emergencies ?? []).forEach((e) => markers.push({
      lat: e.lat, lng: e.lng, label: `🚨 ${e.vehicle}`, sub: `${e.location} → ${e.checkpost}`,
      color: '#fbbf24', radius: 11,
    }))

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <Card padding={false} className="relative min-h-[520px] overflow-hidden">
        <DrishtiMap markers={markers} height={560} />
        <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-xl border border-officer-border bg-officer-surface/90 p-4 text-xs space-y-1">
          <p className="font-semibold mb-1">Legend</p>
          <p><span className="text-officer-mint">●</span> Live camera · <span className="text-officer-faint">●</span> Offline</p>
          <p><span className="text-officer-blue">●</span> Checkpost · <span className="text-red-400">●</span> Predicted hotspot</p>
          <p><span className="text-amber-400">●</span> Active emergency</p>
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <h3 className="font-semibold mb-4">Layer Toggles</h3>
          <div className="space-y-3">
            {(Object.keys(layers) as (keyof typeof layers)[]).map((k) => (
              <Switch
                key={k}
                checked={layers[k]}
                onChange={(v) => setLayers((l) => ({ ...l, [k]: v }))}
                label={k.charAt(0).toUpperCase() + k.slice(1)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold mb-2">Predicted Hotspots</h3>
          <p className="text-xs text-officer-muted mb-4">Time slider — next 6 hours</p>
          <input
            type="range"
            min={0}
            max={360}
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="mt-2 flex justify-between font-mono text-[10px] text-officer-muted">
            <span>Now</span>
            <span>{futureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>+6h</span>
          </div>
          <div className="mt-5 space-y-3">
            {hotspots.map((h) => (
              <div key={h.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{h.label}</span>
                  <span className="font-mono text-amber-300">{h.risk}/10</span>
                </div>
                <div className="h-1.5 rounded-full bg-officer-border overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-400"
                    animate={{ width: `${h.risk * 10}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="max-h-48 overflow-y-auto">
          <h3 className="font-semibold mb-3 text-sm">Cameras</h3>
          {mockCameras.map((cam) => (
            <div key={cam.id} className="flex items-center gap-2 py-2 border-b border-officer-border/50 text-sm">
              <span className={`h-2 w-2 rounded-full ${cam.status === 'live' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="font-mono">{cam.name}</span>
              <span className="ml-auto font-mono text-officer-muted">{cam.count}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
