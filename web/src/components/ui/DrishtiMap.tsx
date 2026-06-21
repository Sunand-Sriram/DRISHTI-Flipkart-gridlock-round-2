import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/** Fixes the classic Leaflet "renders before container is sized" bug and
 *  auto-fits the view to all markers so none are off-screen. */
function MapReady({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => {
      map.invalidateSize()
      if (markers.length > 1) {
        const b = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
        map.fitBounds(b, { padding: [40, 40], maxZoom: 14 })
      }
    }, 200)
    return () => clearTimeout(t)
  }, [map, markers])
  return null
}

export interface MapMarker {
  lat: number
  lng: number
  label: string
  sub?: string
  color?: string
  radius?: number
}

interface Props {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  height?: number | string
  dark?: boolean
  className?: string
}

const BENGALURU: [number, number] = [12.9716, 77.5946]

/** Reusable OpenStreetMap (Leaflet) map — no API key, deploy-safe. */
export function DrishtiMap({ markers, center, zoom = 12, height = 480, dark = true, className }: Props) {
  const c = center || (markers[0] ? [markers[0].lat, markers[0].lng] as [number, number] : BENGALURU)
  const tiles = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

  return (
    <div className={className} style={{ height, width: '100%', borderRadius: 16, overflow: 'hidden' }}>
      <MapContainer center={c} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <MapReady markers={markers} />
        <TileLayer
          url={tiles}
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />
        {markers.map((m, i) => (
          <CircleMarker
            key={i}
            center={[m.lat, m.lng]}
            radius={m.radius ?? 9}
            pathOptions={{
              color: m.color || '#ffa733',
              fillColor: m.color || '#ffa733',
              fillOpacity: 0.55,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>{m.label}</Tooltip>
            {m.sub && (
              <Popup>
                <b>{m.label}</b>
                <br />
                {m.sub}
              </Popup>
            )}
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
