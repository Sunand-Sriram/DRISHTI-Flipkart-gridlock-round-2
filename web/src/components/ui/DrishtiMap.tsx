import { MapContainer, TileLayer, CircleMarker, Popup, LayerGroup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/lib/utils'

interface MapMarker {
  lat: number
  lng: number
  label: string
  color?: string
  radius?: number
  popup?: string
}

interface DrishtiMapProps {
  markers?: MapMarker[]
  center?: [number, number]
  zoom?: number
  className?: string
  height?: string
  citizen?: boolean
}

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

export function DrishtiMap({
  markers = [],
  center = [12.9716, 77.5946],
  zoom = 12,
  className,
  height = '400px',
  citizen = false,
}: DrishtiMapProps) {
  return (
    <div className={cn('rounded-xl overflow-hidden', className)} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={citizen ? LIGHT_TILES : DARK_TILES} />
        {/* Wrap markers in a LayerGroup keyed by the marker set's signature.
            react-leaflet does not reliably remove individual CircleMarkers when
            the array shrinks (toggling a layer off left stale markers behind);
            remounting the whole group on any change tears down every old leaflet
            layer and rebuilds cleanly. */}
        <LayerGroup key={markers.map((m) => `${m.label}@${m.lat},${m.lng}`).join('|')}>
          {markers.map((m, i) => (
            <CircleMarker
              // index suffix keeps the key unique when two markers share a spot
              // (e.g. two ambulances dispatched to the same junction).
              key={`${m.label}|${m.lat}|${m.lng}|${m.color ?? ''}|${m.radius ?? ''}|${i}`}
              center={[m.lat, m.lng]}
              radius={m.radius || 8}
              pathOptions={{
                color: m.color || (citizen ? '#0D9488' : '#14B8A6'),
                fillColor: m.color || (citizen ? '#0D9488' : '#14B8A6'),
                fillOpacity: 0.5,
                weight: 2,
              }}
            >
              <Popup>
                <div className="font-display text-sm font-semibold">{m.label}</div>
                {m.popup && <div className="text-xs mt-1 opacity-70">{m.popup}</div>}
              </Popup>
            </CircleMarker>
          ))}
        </LayerGroup>
      </MapContainer>
    </div>
  )
}
